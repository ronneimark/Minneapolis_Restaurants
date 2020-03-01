#!/usr/bin/env python
# coding: utf-8

# In[ ]:


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


# # Inspections Data Download

# In[ ]:


url = 'https://services.arcgis.com/afSMGVsC7QlRK1kZ/arcgis/rest/services/Food_Inspections/FeatureServer/0/query?'
params = "where=FacilityCategory%20%3D%20%27RESTAURANT%27"
outfields = "&outFields=BusinessName,HealthFacilityIDNumber,FullAddress,InspectionType,DateOfInspection,InspectionIDNumber,InspectionScore,Latitude,Longitude,FoodCodeText,ViolationPoints,InspectionResult,FoodCodeItem,InspectorComments,ViolationStatus,ViolationPriority&returnGeometry=false&outSR=4326"
json = '&f=json'

full_url = url+params+outfields+json

response = requests.get(full_url)

data=response.json()['features']


# In[ ]:


inspection_data_list = []

for records in data:
    item = records['attributes']
    item['DateOfInspection']=time.strftime('%Y/%m/%d',time.gmtime(records['attributes']['DateOfInspection']/1000))
    inspection_data_list.append(item)
    
print('inspection_data_list with needed data has been built.',flush=True)
print('---------------',flush=True)


# In[ ]:


inspections_df_base = pd.DataFrame(inspection_data_list)

inspections_df_1 = inspections_df_base[['InspectionIDNumber','DateOfInspection','BusinessName','FullAddress','InspectionType','InspectionScore','Latitude','Longitude']]
inspections_df_1 = inspections_df_1.drop_duplicates(subset='InspectionIDNumber', keep='first')
inspections_df_1 = inspections_df_1.sort_values(by=['BusinessName','DateOfInspection'])
inspections_df_1 = inspections_df_1.rename(columns={'BusinessName':'businessname','FullAddress':'fulladdress','Latitude':'latitude','Longitude':'longitude','InspectionIDNumber':'inspectionidnumber','DateOfInspection':'dateofinspection','InspectionScore':'inspectionscore','InspectionType':'inspectiontype'})

inspections_df_2 = inspections_df_base[['DateOfInspection','InspectionIDNumber','BusinessName','FullAddress','InspectionType','InspectionScore','InspectionResult','FoodCodeItem','FoodCodeText','InspectorComments','ViolationPriority','ViolationStatus','ViolationPoints']]
inspections_df_2 = inspections_df_2.sort_values(by=['BusinessName','DateOfInspection'])
inspections_df_2 = inspections_df_2.rename(columns={'InspectionIDNumber':'inspectionidnumber','DateOfInspection':'dateofinspection','BusinessName':'businessname','FullAddress':'fulladdress','InspectionType':'inspectiontype','InspectionScore':'inspectionscore','InspectionResult':'inspectionresult','FoodCodeItem':'foodcodeitem','FoodCodeText':'foodcodetext','InspectorComments':'inspectorcomments','ViolationPriority':'violationpriority','ViolationStatus':'violationstatus','ViolationPoints':'violationpoints'})
inspections_detail=inspections_df_2

inspections_detail
print('Inspection Detail DataFrame now stored in memory as "inspection_detail"',flush=True)
print('---------------',flush=True)


# In[ ]:


inspect_by_biz=inspections_df_1.groupby(['businessname','fulladdress','latitude','longitude'],sort=False,as_index=False).aggregate(lambda x: list(x))
inspections_data = inspect_by_biz

print('Inspections DataFrame now stored in memory as "inspections_data"')
print(f'There are {len(inspections_df_1)} inspections for {len(inspections_data)} facilities.')
print('---------------')


# # Yelp Data

# In[ ]:


# Download 1000 restaurants from Yelp API with Minneapolis as the search parameter.

data = []
i=0
iterable_list = inspections_data.values.tolist()

headers = {'Authorization': 'Bearer %s' % api_key}

url='https://api.yelp.com/v3/businesses/search'

print('Downloading Yelp Data for each restaurant...',flush=True)

for item in iterable_list:
    
    params = {
        'term':item[0],
        'location':item[1] + 'Minneapolis, MN',
        'latitude':item[2],
        'longitude':item[3],
        'radius':200
        }  
    
    response=requests.get(url, params=params, headers=headers)
    if response.status_code == 200:
        data += response.json()['businesses']
    elif response.status_code == 400:
        print('400 Bad Request')
        break
        
    print("Restaurants Remaining: {:3}".format(len(inspections_data)-i), end="\r",flush=True)
    
    i+=1
        
print(f'Yelp data downloaded...  There are {len(data)} records...',flush=True)
print('---------------',flush=True)


# In[ ]:


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


# In[ ]:


yelp_df=pd.DataFrame(yelp_list)
yelp_df=yelp_df[['yelpid','name','image','url','latitude','longitude','address','phone','categories','transactions','rating','reviews']]
yelp_df = yelp_df.drop_duplicates(subset=['name','address'])

print('Yelp DataFrame now stored in memory as "yelp_df"',flush=True)
print(f'Removed duplicates. Leaving {len(yelp_df)} restaurants.',flush=True)
print('---------------',flush=True)


# In[ ]:


master_list=yelp_df.to_dict('records')


# In[ ]:


print('Matching Yelp data list to Google API in order to append Google columns to Master...   This will take some time, as we match each record...',flush=True)

url = 'https://maps.googleapis.com/maps/api/place/findplacefromtext/json?'

i=0

for item in master_list:
    
    params = {
        'key':google_key,
        'input':item['name'],
        'inputtype':'textquery',
        'locationbias': 'point:' + str(item['latitude']) + ", " + str(item['longitude']),
        'radius': 100,
        'fields':'place_id,name,rating,user_ratings_total,price_level'
        }
    
    response = requests.get(url, params=params)
    json=response.json()
    
    if len(response.json()['candidates'])>0:
        if 'name' in json['candidates'][0]: 
            item.update(google_name =json['candidates'][0]['name'])
        if 'place_id' in json['candidates'][0]:
            item.update(google_id=json['candidates'][0]['place_id'])
        if 'rating' in json['candidates'][0]:
            item.update(google_rating=json['candidates'][0]['rating'])
        if 'user_ratings_total' in json['candidates'][0]:
            item.update(google_reviews = json['candidates'][0]['user_ratings_total'])
        if 'price_level' in json['candidates'][0]:
            item.update(google_price =json['candidates'][0]['price_level'])
    
    print("Restaurants Remaining: {:3}".format(len(master_list)-i), end="\r",flush=True)
    
    i+=1

print(f'Google match has been completed...',flush=True)


# In[ ]:


master_df=pd.DataFrame(master_list)


# In[ ]:


# Create a new Aggregate Score and Review Count  based on Yelp Rating and Google Rating and add Column to the DataFrame


# Function that computes the weighted rating of each movie
def aggregate_rating (x):
    yelp_reviews = x['reviews']
    yelp_rating = x['rating']
    google_reviews = x['google_reviews']
    google_rating = x['google_rating']
    # Calculation
    return ((yelp_rating*yelp_reviews)+(google_rating*google_reviews))/(yelp_reviews+google_reviews)

def total_reviews (x):
    yelp_reviews = x['reviews']
    google_reviews = x['google_reviews']
    return yelp_reviews+google_reviews

master_df['agg_rating'] = master_df.apply(aggregate_rating, axis=1)
master_df['total_reviews'] = master_df.apply(total_reviews, axis=1)


# In[ ]:


#Postgres username, password, and database name
ipaddress = 'localhost'
port = '5432'
username = username
password = password 
dbname = 'Minneapolis_Restaurants'
# A long string that contains the necessary Postgres login information
postgres_str = f'postgresql://{username}:{password}@{ipaddress}:{port}/{dbname}'


# In[ ]:


# Creates Classes which will serve as the anchor points for our Table, loads table to Postgres and uplads the data

Base = declarative_base()
engine = create_engine(postgres_str)

class MasterData(Base):
    __tablename__ = 'masterdata'
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
    google_name=Column(String)
    google_id=Column(String)
    google_rating=Column(Float(10))
    google_reviews=Column(Integer)
    google_price=Column(Integer)
    agg_rating=Column(Float)
    total_reviews=Column(Float)
                   
Base.metadata.create_all(engine)

master_df.to_sql('masterdata', engine, if_exists='replace', index=True)

print(f'Table "masterdata" uploaded to postgreSQL database "Minneapolis_Restaurants".',flush=True)
print('---------------')


# In[ ]:


# Creates Classes which will serve as the anchor points for our Table, loads table to Postgres and uplads the data

Base = declarative_base()
engine = create_engine(postgres_str)

class InspectionsData(Base):
    __tablename__ = 'inspectionsdata'
    index=Column(Integer,primary_key=True,autoincrement=True)
    businessname=Column(String,nullable=False)
    fulladdress=Column(String)
    healthfacilityidnumber=Column(String)
    latitude=Column(Float(20))
    longitude=Column(Float(20))
    inspectionidnumber=Column(String)
    dateofinspection=Column(String)
    inspectionscore=Column(String)
    inspectiontype=Column(String)
                   
Base.metadata.create_all(engine)

inspections_data.to_sql('inspectionsdata', engine, if_exists='replace', index=True)

print(f'Table "inspectionsdata" uploaded to postgreSQL database "Minneapolis_Restaurants".',flush=True)
print('---------------',flush=True)


# In[ ]:


# Creates Classes which will serve as the anchor points for our Table, loads table to Postgres and uplads the data

Base = declarative_base()
engine = create_engine(postgres_str)

class InspectionsDetail(Base):
    __tablename__ = 'inspectionsdetail'
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

inspections_detail.to_sql('inspectionsdetail', engine, if_exists='replace', index=True)

print(f'Table "inspectionsdetail" uploaded to postgreSQL database "Minneapolis_Restaurants".',flush=True)
print('---------------',flush=True)
print("DONE.  Don't forget to fix the SQL data types! Use the DataTypeChange script to fix your Minneapolis_Restaurants DB",flush=True)

