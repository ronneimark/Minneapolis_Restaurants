#!/usr/bin/env python
# coding: utf-8

# Import Dependencies

import requests
import json
import pandas as pd
import numpy as np
import datetime
from config import api_key
from config import google_key
import time

from config import password
from config import username
import psycopg2
import sqlalchemy
import urllib
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy import PrimaryKeyConstraint
from sqlalchemy.orm import Session
from sqlalchemy.orm import sessionmaker
from sqlalchemy import Column, Integer, String, Float, DateTime
from sqlalchemy.schema import Sequence

print(f'Dependencies imported...',flush=True)
print('---------------',flush=True)


# Download 1000 restaurants from Yelp API with Minneapolis as the search parameter.

data = []

headers = {'Authorization': 'Bearer %s' % api_key}

url='https://api.yelp.com/v3/businesses/search'

print('Downloading Yelp Data...',flush=True)

for offset in range(0, 1000, 50):
    
    params = {
        'limit':50, 
        'location':'Minneapolis, MN',

        'categories':'restaurants',
        'offset':offset
        }  
    
    response=requests.get(url, params=params, headers=headers)
    if response.status_code == 200:
        data += response.json()['businesses']
    elif response.status_code == 400:
        print('400 Bad Request')
        break
        
print(f'Yelp data downloaded...  There are {len(data)} records...',flush=True)
print('---------------',flush=True)


#Convert Yelp Data to list to convert to DataFrame

i=0
yelp_list=[]
for places in data:
    yelp_id=data[i]['id']
    name=data[i]['name']
    image=data[i]['image_url']
    categories = []
    for category in data[i]['categories']:
        cat = category['title']
        categories.append(cat)
    url=data[i]['url']
    transactions=data[i]['transactions']
    city=data[i]['location']['city']
    phone=data[i]['display_phone']
    address= data[i]['location']['display_address']
    rating=data[i]['rating']
    reviews=data[i]['review_count']
    latitude=data[i]['coordinates']['latitude']
    longitude=data[i]['coordinates']['longitude']
    if data[i]['is_closed']==False and city=="Minneapolis":
        business_dict={"yelpid":yelp_id,"name":name,"image":image,"url":url,"latitude":latitude,"longitude":longitude,"phone":phone,"categories":categories,"transactions":transactions,"address":' '.join(map(str, address)),"rating":rating,"reviews":reviews}
        yelp_list.append(business_dict)
    i+=1

print('yelp_list with needed data has been built.',flush=True)
print('---------------',flush=True)


#Convert Yelp list to DataFrame

yelp_df=pd.DataFrame(yelp_list)
yelp_df=yelp_df[['yelpid','name','image','url','latitude','longitude','address','phone','categories','transactions','rating','reviews']]
yelp_df = yelp_df.drop_duplicates(subset=['name','address'])

print('Yelp DataFrame now stored in memory as "yelp_df"',flush=True)
print(f'Removed duplicates and restaurants outside of Minneapolis. Leaving {len(yelp_df)} restaurants.',flush=True)
print('---------------',flush=True)


#Query the Google API for every restaurant in the Yelp DataFrame

print('Matching Yelp data list to Google API...   This will take some time, as we match each record...',flush=True)

url = 'https://maps.googleapis.com/maps/api/place/findplacefromtext/json?'
google_data=[]

for index,row in yelp_df.iterrows():
    
    params = {
        'key':google_key,
        'input':row['name'],
        'inputtype':'textquery',
        'locationbias': 'point:' + str(row['latitude']) + ", " + str(row['longitude']),
        'radius': 10,
        'fields':'place_id,name,formatted_address,geometry,rating,user_ratings_total,price_level,photos,icon'
        }
    
    response = requests.get(url, params=params)

    if len(response.json()['candidates'])>0:
        google_data.append(response.json()['candidates'][0])
    else:
        google_data.append("")
        
    print("Restaurants Remaining: {:3}".format(len(yelp_df)-index), end="\r",flush=True)

print(f'Google match has been completed...  There are {len(google_data)} records',flush=True)


#Convert Google Data to List to form DataFrame

i=0
google_list=[]

for places in google_data:
    if places != "":
        if "place_id" in places:
            google_id = places['place_id']
        if "icon"in places:
            icon=places['icon']
        photos=[]
        if "photos" in places:
            for photo in places['photos']:
                item = photo['html_attributions']
                photos.append(item)
        if "price_level" in places:
            price_level=places['price_level']
        if "name" in places:
            name = places['name']
        if "formatted_address" in places:
            address = places['formatted_address']
        if "rating" in places:
            rating  = places['rating']
        if "user_ratings_total" in places:
            reviews = places['user_ratings_total']
        if "geometry" in places:
            latitude = places['geometry']['location']['lat']
            longitude = places['geometry']['location']['lng']
        business_dict = {"googleplacesid":google_id,"icon":icon,"photos":photos,"name":name,"latitude":latitude,"longitude":longitude,"address":address,"rating":rating,"reviews":reviews,"price":price_level}
    
    else:
        business_dict = {"googleplacesid":"","icon":"","photos":"","name":"","latitude":"","longitude":"","address":"", "rating":"","reviews":"","price":""}
    
    google_list.append(business_dict)
    
    i+=1
    
print('google_list with needed data has been built.',flush=True)


# Create Googlelist DataFrame

google_df=pd.DataFrame(google_list)
google_df=google_df[google_df.name != ""]
google_df = google_df.drop_duplicates(subset=['googleplacesid'])

google_df=google_df[['googleplacesid','name','latitude','longitude','address','rating','reviews','price','icon','photos']]


print('Google DataFrame now stored in memory as "google_df".',flush=True)
print(f'Removed null entries.  {len(google_df)} restaurants remain.',flush=True)
print('---------------',flush=True)


# Create comparison spreadsheet to spot check that Google and Yelp DataFrames match up.

i = 0
compare_list=[]
yelpgeo_list=[]

for i in range(len(google_list)):

    compare = {"Yelp":yelp_list[i]['name'],"Google":google_list[i]['name'],"GoogleAddress":google_list[i]['address'],"Yelp Address":yelp_list[i]['address']}
    compare_list.append(compare)
    i+=1

compare_df = pd.DataFrame(compare_list)
compare_df.to_csv('DataFiles/compare.csv')

print('"compare_df" has been stored in memory and csv "compare.csv" has been saved in DataFiles folder to allow easy comparison between Yelp and Google data.',flush=True)
print('---------------',flush=True)


# Queries the Mineapolis Inspection Database for all restaurants in the Yelp DataFrame.

print('Matching Yelp data list to Minneapolis Health Inspection API...   This will take some time, as we match each record...',flush=True)

inspection_data=[]

for index,row in yelp_df.iterrows():

    biz = row['name']

    biz_string = biz.split(' ',1)[0].upper()
    biz_string = biz_string.replace("'","")
    biz_string = biz_string.replace("&","")

    minlat=row['latitude']-.0015
    maxlat=row['latitude']+.0015
    minlon=row['longitude']-.0015
    maxlon=row['longitude']+.0015
    
    url = 'https://services.arcgis.com/afSMGVsC7QlRK1kZ/arcgis/rest/services/Food_Inspections/FeatureServer/0/query?'
    params = f"where=BusinessName%20like%20'%25{biz_string}%25'%20AND%20Latitude%20%3E%3D%20{minlat}%20AND%20Latitude%20%3C%3D%20{maxlat}%20AND%20Longitude%20%3E%3D%20{minlon}%20AND%20Longitude%20%3C%3D%20{maxlon}"
    outfields = "&outFields=BusinessName,HealthFacilityIDNumber,FullAddress,InspectionType,DateOfInspection,InspectionIDNumber,InspectionScore,Latitude,Longitude,FoodCodeText,ViolationPoints,InspectionResult,FoodCodeItem,InspectorComments,ViolationStatus,ViolationPriority&returnGeometry=false&outSR=4326"
    json = '&f=json'

    full_url = url+params+outfields+json

    response = requests.get(full_url)
    
    if response !="":
        inspection_data += response.json()['features']
        
    print("Restaurants Remaining: {:3}".format(len(yelp_df)-index), end="\r",flush=True)
    
print(f'Inspection data match has been completed...  There are {len(inspection_data)} records',flush=True)
print('---------------',flush=True)

#Converts Inspection Data into a list for the DataFrame

inspection_data_list = []

for records in inspection_data:
    item = records['attributes']
    item['DateOfInspection']=time.strftime('%Y/%m/%d',time.gmtime(records['attributes']['DateOfInspection']/1000))
    inspection_data_list.append(item)
    
print('inspection_data_list with needed data has been built.',flush=True)
print('---------------',flush=True)


#Inspections DataFrames created - 1 with basic data and other with inspection details

inspections_df_base = pd.DataFrame(inspection_data_list)

inspections_df_1 = inspections_df_base[['InspectionIDNumber','DateOfInspection','BusinessName','FullAddress','InspectionType','InspectionScore','Latitude','Longitude']]
inspections_df_1 = inspections_df_1.drop_duplicates(subset='InspectionIDNumber', keep='first')
inspections_df_1 = inspections_df_1.sort_values(by=['BusinessName','DateOfInspection'])
inspections_df_1 = inspections_df_1.rename(columns={'BusinessName':'businessname','FullAddress':'fulladdress','Latitude':'latitude','Longitude':'longitude','InspectionIDNumber':'inspectionidnumber','DateOfInspection':'dateofinspection','InspectionScore':'inspectionscore','InspectionType':'inspectiontype'})

inspections_df_2 = inspections_df_base[['DateOfInspection','InspectionIDNumber','BusinessName','FullAddress','InspectionType','InspectionScore','InspectionResult','FoodCodeItem','FoodCodeText','InspectorComments','ViolationPriority','ViolationStatus','ViolationPoints']]
inspections_df_2 = inspections_df_2.sort_values(by=['BusinessName','DateOfInspection'])
inspections_df_2 = inspections_df_2.rename(columns={'InspectionIDNumber':'inspectionidnumber','DateOfInspection':'dateofinspection','BusinessName':'businessname','FullAddress':'fulladdress','InspectionType':'inspectiontype','InspectionScore':'inspectionscore','InspectionResult':'inspectionresult','FoodCodeItem':'foodcodeitem','FoodCodeText':'foodcodetext','InspectorComments':'inspectorcomments','ViolationPriority':'violationpriority','ViolationStatus':'violationstatus','ViolationPoints':'violationpoints'})

inspect_by_biz=inspections_df_1.groupby(['businessname','fulladdress','latitude','longitude'],sort=False,as_index=False).aggregate(lambda x: list(x))

print('Inspections DataFrame now stored in memory as "inspect_by_biz" and csv "InspectionsData.csv" has been saved in DataFiles folder.',flush=True)
print(f'There are {len(inspections_df_1)} inspections for {len(inspect_by_biz)} facilities.',flush=True)
print('---------------',flush=True)

inspection_detail=inspections_df_2

print('Inspection Detail DataFrame now stored in memory as "inspection_detail"',flush=True)

print('---------------',flush=True)


#DEPLOYMENT TO POSTGRESQL

#Postgres username, password, and database name
ipaddress = 'localhost'
port = '5432'
username = username
password = password 
dbname = 'Minneapolis_Restaurants'
# A long string that contains the necessary Postgres login information
postgres_str = f'postgresql://{username}:{password}@{ipaddress}:{port}/{dbname}'


# Creates Classes which will serve as the anchor points for YelpData, loads table to Postgres and uplads the data

Base = declarative_base()
engine = create_engine(postgres_str)

class YelpData(Base):
    __tablename__ = 'yelpdata'
    index=Column(Integer,primary_key=True,autoincrement=True)
    yelpid=Column(String,nullable=False)
    name=Column(String)
    image=Column(String)
    url=Column(String)
    latitude=Column(Float(20))
    longitude=Column(Float(20))
    address=Column(String)
    phone=Column(String)
    categories=Column(String)
    transactions=Column(String)
    rating=Column(Float(10))
    reviews=Column(Integer)
                   
Base.metadata.create_all(engine)

yelp_df.to_sql('yelpdata', engine, if_exists='replace', index=True)

print(f'Table "yelpdata" uploaded to postgreSQL database "Minneapolis_Restaurants".',flush=True)
print('---------------',flush=True)



# Creates Classes which will serve as the anchor points for GoogleData, loads table to Postgres and uplads the data

Base = declarative_base()
engine = create_engine(postgres_str)

class GoogleData(Base):
    __tablename__ = 'googledata'
    googleplacesid=Column(String,primary_key=True, nullable=False)
    name=Column(String)
    latitude=Column(Float(20))
    longitude=Column(Float(20))
    address=Column(String)
    rating=Column(Float(10))
    reviews=Column(Integer) 
    price=Column(Integer)
    icon=Column(String)
    photos=Column(String)
                   
Base.metadata.create_all(engine)

google_df.to_sql('googledata', engine, if_exists='replace', index=True)

print(f'Table "googledata" uploaded to postgreSQL database "Minneapolis_Restaurants".',flush=True)
print('---------------',flush=True)


# Creates Classes which will serve as the anchor points for InspectionsData, loads table to Postgres and uplads the data

Base = declarative_base()
engine = create_engine(postgres_str)

class InspectionsData(Base):
    __tablename__ = 'inspectionsdata'
    index=Column(Integer,primary_key=True,autoincrement=True)
    businessname=Column(String,nullable=False)
    fulladdress=Column(String)
    healthfacilityidumber=Column(String)
    latitude=Column(Float(20))
    longitude=Column(Float(20))
    inspectionidnumber=Column(String)
    dateofinspection=Column(String)
    inspectionscore=Column(String)
    inspectiontype=Column(String)
                   
Base.metadata.create_all(engine)

inspect_by_biz.to_sql('inspectionsdata', engine, if_exists='replace', index=True)

print(f'Table "inspectionsdata" uploaded to postgreSQL database "Minneapolis_Restaurants".',flush=True)
print('---------------',flush=True)

# Creates Classes which will serve as the anchor points for our Table, loads table to Postgres and uplads the data

Base = declarative_base()
engine = create_engine(postgres_str)

class InspectionsDetail(Base):
    __tablename__ = 'inspectionsdata'
    inspectionidnumber=Column(String,primary_key=True)
    dateofinspection=Column(String)
    businessname=Column(String)
    fulladdress=Column(String)
    inspectiontype=Column(String)
    inspectionscore=Column(String)
    inspectionresult=Column(String)
    foodcodeitem=Column(String)
    foodcodetext=Column(String)
    inspectorcomments=Column(String)
    violationpriority=Column(String)
    violationstatus=Column(String)
    violationpoints=Column(String)
                   
Base.metadata.create_all(engine)

inspection_detail.to_sql('inspectionsdetail', engine, if_exists='replace', index=True)

print(f'Table "inspectionsdetail" uploaded to postgreSQL database "Minneapolis_Restaurants".',flush=True)
print('---------------',flush=True)
print("DONE.  Don't forget to fix the SQL data types! Use the DataTypeChange script to fix your Minneapolis_Restaurants DB",flush=True)