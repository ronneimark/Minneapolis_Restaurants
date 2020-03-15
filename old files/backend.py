#!/usr/bin/env python
# coding: utf-8

# In[1]:


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

# In[2]:


url = 'https://services.arcgis.com/afSMGVsC7QlRK1kZ/arcgis/rest/services/Food_Inspections/FeatureServer/0/query?'
params = "where=FacilityCategory%20%3D%20%27RESTAURANT%27"
outfields = "&outFields=BusinessName,HealthFacilityIDNumber,FullAddress,InspectionType,DateOfInspection,InspectionIDNumber,InspectionScore,Latitude,Longitude,FoodCodeText,ViolationPoints,InspectionResult,FoodCodeItem,InspectorComments,ViolationStatus,ViolationPriority&returnGeometry=false&outSR=4326"
json = '&f=json'

full_url = url+params+outfields+json

response = requests.get(full_url)

data=response.json()['features']


# In[3]:


inspection_data_list = []

for records in data:
    item = records['attributes']
    item['DateOfInspection']=time.strftime('%Y/%m/%d',time.gmtime(records['attributes']['DateOfInspection']/1000))
    inspection_data_list.append(item)
    
print('inspection_data_list with needed data has been built.',flush=True)
print('---------------',flush=True)


# In[4]:


inspections_df_base = pd.DataFrame(inspection_data_list)

inspections_df_1 = inspections_df_base[['InspectionIDNumber','DateOfInspection','BusinessName','FullAddress','InspectionType','InspectionScore','Latitude','Longitude']]
inspections_df_1 = inspections_df_1.drop_duplicates(subset='InspectionIDNumber', keep='first')
inspections_df_1 = inspections_df_1.sort_values(by=['BusinessName','DateOfInspection'])
inspections_df_1 = inspections_df_1.rename(columns={'BusinessName':'inspect_name','FullAddress':'inspect_address','Latitude':'latitude','Longitude':'longitude','InspectionIDNumber':'inspectionidnumber','DateOfInspection':'dateofinspection','InspectionScore':'inspectionscore','InspectionType':'inspectiontype'})

inspections_detail = inspections_df_base[['DateOfInspection','InspectionIDNumber','BusinessName','FullAddress','InspectionType','InspectionScore','InspectionResult','FoodCodeItem','FoodCodeText','InspectorComments','ViolationPriority','ViolationStatus','ViolationPoints']]
inspections_detail = inspections_detail.sort_values(by=['BusinessName','DateOfInspection'])
inspections_detail = inspections_detail.rename(columns={'InspectionIDNumber':'inspectionidnumber','DateOfInspection':'dateofinspection','BusinessName':'businessname','FullAddress':'fulladdress','InspectionType':'inspectiontype','InspectionScore':'inspectionscore','InspectionResult':'inspectionresult','FoodCodeItem':'foodcodeitem','FoodCodeText':'foodcodetext','InspectorComments':'inspectorcomments','ViolationPriority':'violationpriority','ViolationStatus':'violationstatus','ViolationPoints':'violationpoints'})

print('Inspection Detail DataFrame now stored in memory as "inspection_detail"',flush=True)
print('---------------',flush=True)


# In[5]:


grand_master_data=inspections_df_1.groupby(['inspect_name','inspect_address','latitude','longitude'],sort=False,as_index=False).aggregate(lambda x: list(x))
grand_master_list = grand_master_data.to_dict('records')

print('Inspections Dictionary now stored in memory as "grand_master_list"')
print(f'There are {len(inspections_df_1)} inspections for {len(grand_master_list)} facilities.')
grand_master_list
print('---------------')


# # Yelp Data

# In[28]:


# Download 1000 restaurants from Yelp API with Minneapolis as the search parameter.

i=0

headers = {'Authorization': 'Bearer %s' % api_key}

url='https://api.yelp.com/v3/businesses/search'

print('Downloading Yelp Data for each restaurant...',flush=True)

for item in grand_master_list:
    
    params = {
        'term':item['inspect_name'].split()[0],
        'latitude':item['latitude'],
        'longitude':item['longitude'],
        'radius':200,
        "sort_by":"distance"
        }  
    
    response=requests.get(url, params=params, headers=headers)
    if response.status_code == 200:
        yelp= response.json()['businesses']
        if len(yelp)>0:                                                                                                                                                                 
            if 'name' in yelp[0]: 
                item.update(yelp_name = yelp[0]['name'])
            if 'id' in yelp[0]:
                item.update(yelp_id= yelp[0]['id'])
            if 'categories' in yelp[0]:
                categories=[]
                for cat in yelp[0]['categories']:
                    category = cat['title']
                    categories.append(category)
                item.update(yelp_categories=categories)
            if 'price' in yelp[0]:
                item.update(yelp_price=yelp[0]['price'])
            if 'url'in yelp[0]:
                item.update(yelp_url=yelp[0]['url'])
            if 'transactions' in yelp[0]:
                item.update(yelp_transactions=yelp[0]['transactions'])
            if 'display_phone' in yelp[0]:
                item.update(yelp_phone=yelp[0]['display_phone'])
            if 'display_address' in yelp[0]['location']:
                item.update(yelp_address=yelp[0]['location']['display_address'])
            if 'rating' in yelp[0]:
                item.update(yelp_rating=yelp[0]['rating'])
            if 'review_count' in yelp[0]:
                item.update(yelp_reviews=yelp[0]['review_count'])
            if 'latitude' in yelp[0]:
                item.update(latitude=yelp[0]['latitude'])
            if 'longitude' in yelp[0]:
                item.update(longitude=yelp[0]['longitude'])
          
    elif response.status_code == 400:
        print('400 Bad Request')
        break
        
    print("Restaurants Remaining: {:4}".format(len(grand_master_list)-i), end="\r",flush=True)
    
    i+=1
        
print(f'Yelp data downloaded and added to grand_master_list...',flush=True)
print('---------------',flush=True)


# #Google Data

# In[9]:


print('Appending Google Data to grand_master_list...   This will take some time, as we match each record...',flush=True)

url = 'https://maps.googleapis.com/maps/api/place/findplacefromtext/json?'

i=0

for item in grand_master_list:
    
    params = {
        'key':google_key,
        'input':item['inspect_name'],
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
    
    print("Restaurants Remaining: {:4}".format(len(grand_master_list)-i), end="\r",flush=True)
    
    i+=1

print(f'Google match has been completed...',flush=True)


# In[29]:


master_df=pd.DataFrame(grand_master_list)


# In[30]:


# Create a new Aggregate Score and Review Count  based on Yelp Rating and Google Rating and add Column to the DataFrame


# Function that computes the weighted rating of each restaurant
def aggregate_rating (x):
    yelp_reviews = x['yelp_reviews']
    yelp_rating = x['yelp_rating']
    google_reviews = x['google_reviews']
    google_rating = x['google_rating']
    # Calculation
    return ((yelp_rating*yelp_reviews)+(google_rating*google_reviews))/(yelp_reviews+google_reviews)

def total_reviews (x):
    yelp_reviews = x['yelp_reviews']
    google_reviews = x['google_reviews']
    return yelp_reviews+google_reviews

master_df['agg_rating'] = master_df.apply(aggregate_rating, axis=1)
master_df['total_reviews'] = master_df.apply(total_reviews, axis=1)
master_df.agg_rating =master_df.agg_rating.round(2)


# In[36]:


#Postgres username, password, and database name
ipaddress = 'localhost'
port = '5432'
username = username
password = password 
dbname = 'Minneapolis_Restaurants'
# A long string that contains the necessary Postgres login information
postgres_str = f'postgresql://{username}:{password}@{ipaddress}:{port}/{dbname}'


# In[37]:


# Creates Classes which will serve as the anchor points for our Table, loads table to Postgres and uplads the data

Base = declarative_base()
engine = create_engine(postgres_str)

class GrandMasterData(Base):
    __tablename__ = 'grandmasterdata'
    index=Column(Integer,primary_key=True,autoincrement=True)
    inspect_name=Column(String,nullable=False)
    inspect_address=Column(String)
    inspectionidnumber=Column(String)
    dateofinspection=Column(String)
    inspectionscore=Column(String)
    inspectiontype=Column(String)
    yelp_id=Column(String,nullable=False)
    yelp_name=Column(String)
    yelp_url=Column(String)
    yelp_price=Column(Integer)
    latitude=Column(Float(20))
    longitude=Column(Float(20))
    yelp_phone=Column(String)
    yelp_address=Column(String)
    yelp_categories=Column(String)
    yelp_transactions=Column(String)
    yelp_rating=Column(Float(10))
    yelp_reviews=Column(Integer)
    google_name=Column(String)
    google_id=Column(String)
    google_rating=Column(Float(10))
    google_reviews=Column(Integer)
    google_price=Column(Integer)
    agg_rating=Column(Float)
    total_reviews=Column(Float)
                   
Base.metadata.create_all(engine)

master_df.to_sql('grandmasterdata', engine, if_exists='replace', index=True)

print(f'Table "grandmasterdata" uploaded to postgreSQL database "Minneapolis_Restaurants".',flush=True)
print('---------------')


# In[17]:


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

