#!/usr/bin/env python
# coding: utf-8

# In[1]:


# Import Dependencies

import requests
import json
import pandas as pd
import numpy as np
import datetime
from config import yelp_key
from config import google_key
from config import foursquare_id
from config import foursquare_secret
import time
import datetime
from difflib import SequenceMatcher

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
inspections_df_1 = inspections_df_1.rename(columns={'BusinessName':'inspect_name','FullAddress':'address','Latitude':'latitude','Longitude':'longitude','InspectionIDNumber':'inspectionidnumber','DateOfInspection':'dateofinspection','InspectionScore':'inspectionscore','InspectionType':'inspectiontype'})

inspections_detail = inspections_df_base[['DateOfInspection','InspectionIDNumber','BusinessName','FullAddress','InspectionType','InspectionScore','InspectionResult','FoodCodeItem','FoodCodeText','InspectorComments','ViolationPriority','ViolationStatus','ViolationPoints']]
inspections_detail = inspections_detail.sort_values(by=['BusinessName','DateOfInspection'])
inspections_detail = inspections_detail.rename(columns={'InspectionIDNumber':'inspectionidnumber','DateOfInspection':'dateofinspection','BusinessName':'businessname','FullAddress':'fulladdress','InspectionType':'inspectiontype','InspectionScore':'inspectionscore','InspectionResult':'inspectionresult','FoodCodeItem':'foodcodeitem','FoodCodeText':'foodcodetext','InspectorComments':'inspectorcomments','ViolationPriority':'violationpriority','ViolationStatus':'violationstatus','ViolationPoints':'violationpoints'})

print('Inspection Detail DataFrame now stored in memory as "inspection_detail"',flush=True)
print('---------------',flush=True)


# In[5]:


grand_master_data=inspections_df_1.groupby(['inspect_name','address','latitude','longitude'],sort=False,as_index=False).aggregate(lambda x: list(x))
grand_master_list = grand_master_data.to_dict('records')

for item in grand_master_list:
    currentDT=datetime.datetime.now()
    item.update(updated = currentDT.strftime("%a, %b %d, %Y at %I:%M %p"))

print('Inspections Dictionaries list now stored in memory as "grand_master_list"', flush=True)
print(f'There are {len(inspections_df_1)} inspections for {len(grand_master_list)} facilities.',flush=True)

print('---------------',flush=True)


# # Yelp Data

# In[6]:


Bad_Categories = [
 'Adult Entertainment','Airport Shuttles','Apartments','Appliances & Repair','Arcades','Art Galleries','Art Museums','Art Schools',
 'Arts & Crafts','Assisted Living Facilities','Auto Detailing','Auto Insurance','Auto Repair','Axe Throwing','Banks & Credit Unions','Barbers',
 'Beverage Store','Bike Repair/Maintenance','Bikes','Blood & Plasma Donation Centers','Body Shops','Bookstores','Bowling','Building Supplies','Cabinetry',
 'Candy Stores','Car Wash','Caterers','Cardiologists','Chiropractors','Churches','Colleges & Universities','Comedy Clubs',
 'Community Centers','Community Service/Non-Profit','Convenience Stores','Cooking Classes','Cooking Schools','Cosmetic Dentists',
 'Cosmetics & Beauty Supply','CSA','Cultural Center','Dance Clubs','Department Stores','Discount Store','Drugstores','Electronics',
 'Employment Agencies','Endodontists','Financial Advising','Florists','Furniture Stores','Gas Stations','General Dentistry',
 'Gift Shops','Golf','Grocery','Guest Houses','Gyms','Hair Extensions','Hair Salons','Hardware Stores','Health Markets','Historical Tours',
 'Home & Rental Insurance','Hospitals','Hotels','Imported Food','International Grocery','Interior Design','Investing','IT Services & Computer Repair',
 'Jazz & Blues','Jewelry','Karaoke','Kitchen Supplies','Knife Sharpening','Landmarks & Historical Buildings','Landscaping','Laser Eye Surgery/Lasik',
 'Life Insurance','Limos','Massage Therapy','Meat Shops','Medical Centers','Medical Spas','Men\'s Clothing','Mobile Phone Accessories',
 'Mobile Phone Repair','Mobile Phones','Mortgage Brokers','Museums','Music & DVDs','Music Venues','Nail Salons','Nurseries & Gardening',
 'Ophthalmologists','Organic Stores','Orthopedists','Outlet Stores','Parking','Parks','Party & Event Planning','Party Bus Rentals',
 'Performing Arts','Personal Care Services','Pharmacy','Print Media','Professional Sports Teams','Psychiatrists','Public Transportation',
 'Radio Stations','Religious Organizations','Retirement Homes','Shopping Centers','Skilled Nursing','Social Clubs','Spray Tanning','Strip Clubs',
 'Tattoo','Taxis','Tires','Trainers','Venues & Event Spaces','Videos & Video Game Rental','Vinyl Records','Vitamins & Supplements','Waxing',
 'Wedding Planning','Wheel & Rim Repair','Wholesale Stores','Wigs','Wine Tours','Women\'s Clothing','Yoga'
]


# In[ ]:


# Download restaurants as the search parameter.

i=0

headers = {'Authorization': 'Bearer %s' % yelp_key}

url='https://api.yelp.com/v3/businesses/search'

print('Downloading Yelp Data for each restaurant...',flush=True)

no_yelp=[]

for item in grand_master_list:
    
    if item['inspect_name'].split()[0] != "THE":
        params = {
            'term':item['inspect_name'].split()[0],
    #         'term':item['inspect_name'],
            'latitude':item['latitude'],
            'longitude':item['longitude'],
            'radius':200,
            "sort_by":"distance"
            }
    else:
    
        params = {
            'term':item['inspect_name'].split()[1],
    #         'term':item['inspect_name'],
            'latitude':item['latitude'],
            'longitude':item['longitude'],
            'radius':200,
            "sort_by":"distance"
            }
        
    response=requests.get(url, params=params, headers=headers)
    if response.status_code == 200:
        yelp= response.json()['businesses']
        if len(yelp)>0:
            if 'categories' in yelp[0]:
                categories=[]
                for cat in yelp[0]['categories']:
                    category = cat['title']
                    if category not in Bad_Categories:
                        categories.append(category)
                    if len(categories) != 0:
                        item.update(yelp_categories=categories)
                        if 'name' in yelp[0]: 
                            item.update(yelp_name = yelp[0]['name'])
                        if 'id' in yelp[0]:
                            item.update(yelp_id= yelp[0]['id'])
                        if 'price' in yelp[0]:
                            item.update(yelp_price=yelp[0]['price'])
                        if 'url'in yelp[0]:
                            item.update(yelp_url=yelp[0]['url'])
                        if 'transactions' in yelp[0]:
                            item.update(yelp_transactions=yelp[0]['transactions'])
                        if 'display_phone' in yelp[0]:
                            item.update(yelp_phone=yelp[0]['display_phone'])
                        if len('display_address') in yelp[0]['location'] > 1:
                            item.update(address=yelp[0]['location']['display_address'][0]+", "+yelp[0]['location']['display_address'][1])
                        if 'rating' in yelp[0]:
                            item.update(yelp_rating=yelp[0]['rating'])
                        if 'review_count' in yelp[0]:
                            item.update(yelp_reviews=yelp[0]['review_count'])
                        if 'latitude' in yelp[0]:
                            item.update(latitude=yelp[0]['latitude'])
                        if 'longitude' in yelp[0]:
                            item.update(longitude=yelp[0]['longitude'])
                        currentDT=datetime.datetime.now()
                        item.update(updated = currentDT.strftime("%a, %b %d, %Y at %I:%M %p"))
          
    elif response.status_code == 400:
        print('400 Bad Request')
        break
        
    print("Restaurants Remaining: {:4}".format(len(grand_master_list)-i), end="\r",flush=True)
    
    i+=1
    
for item in grand_master_list:
    if 'yelp_rating' not in item:
        no_yelp.append(item)
        grand_master_list.remove(item)

for item in grand_master_list:
    if 'yelp_reviews' not in item:
        no_yelp.append(item)
        grand_master_list.remove(item)
        
for item in grand_master_list:
    if 'yelp_categories' not in item:
        no_yelp.append(item)
        grand_master_list.remove(item)
        
for item in grand_master_list:
    if 'yelp_name' not in item:
        no_yelp.append(item)
        grand_master_list.remove(item)

no_yelp_df=pd.DataFrame(no_yelp)
no_yelp_df.to_csv('DataFiles/NoYelp.csv')

print('---------------',flush=True)
print(f'Yelp data downloaded and added to grand_master_list...',flush=True)
print(f'{len(no_yelp)} records from the inspections list were not found in Yelp search (name, categories, rating, and reviews).',flush=True)  
print('Those records have been removed from grand_master_list and saved to a csv called "NoYelp.csv".',flush=True)
print(f'There are now {len(grand_master_list)} restaurants remaining in grand_master_list.', flush=True)
print('---------------',flush=True)


# In[33]:


#This code snippet iterates through the categories in each record and creates a list of unique category names.

category_dict={}
for items in grand_master_list:
    if 'yelp_categories' in items:
        for category in items['yelp_categories']:
        
            if category not in category_dict.keys():
                category_dict.update({category:1})
            else:
                category_dict[category]+=1

sorted_categories=sorted(category_dict.keys(), key=lambda x:x.lower())

sorted_cat_dict= {}
for key in sorted_categories:
    sorted_cat_dict.update({key: category_dict[key]})


# In[10]:


lack_similarity = []

for items in grand_master_list:
    if 'yelp_name' in items:
        s = SequenceMatcher(None, items['inspect_name'], items['yelp_name'].upper())
        s_ratio = s.ratio()
        if s_ratio <.25:
            dict={}
            dict["INSPECTION"] = items['inspect_name'].lower()
            dict["YELP"] = items['yelp_name'].lower()
            dict["RATIO"] = str(s.ratio())
            lack_similarity.append(dict)
            grand_master_list.remove(items)
            
yelp_lack_similarity_df=pd.DataFrame(lack_similarity)
yelp_lack_similarity_df.to_csv('DataFiles/YelpLackSimilarity.csv')

print(f'{len(lack_similarity)} restaurants downloaded from Yelp had less than 25% similarity in name when compared to the name in the inspections DB.', flush=True)
print('Assuming these are different establishments, they have been removed from grand_master_list.', flush=True)
print('They have been saved to a csv called "YelpLackSimilarity.csv".', flush=True)
print(f'There are now {len(grand_master_list)} restaurants left in grand_master_list.', flush=True)
print('---------------',flush=True)


# #Google Data

# In[11]:


print('Appending Google Data to grand_master_list...   This will take some time, as we match each record...',flush=True)

url = 'https://maps.googleapis.com/maps/api/place/findplacefromtext/json?'

i=0

no_google=[]

for item in grand_master_list:
    
    params = {
        'key':google_key,
        'input':item['inspect_name'],
        'inputtype':'textquery',
        'locationbias': 'point:' + str(item['latitude']) + ", " + str(item['longitude']),
        'radius': 100,
        'fields':'place_id,formatted_address,name,rating,user_ratings_total,price_level'
        }
    
    response = requests.get(url, params=params)
    json=response.json()
    
    if len(response.json()['candidates'])>0:
        if 'name' in json['candidates'][0]: 
            item.update(google_name =json['candidates'][0]['name'])
        if 'formatted_address' in json['candidates'][0]: 
            item.update(address =json['candidates'][0]['formatted_address'])
        if 'place_id' in json['candidates'][0]:
            item.update(google_id=json['candidates'][0]['place_id'])
        if 'rating' in json['candidates'][0]:
            item.update(google_rating=json['candidates'][0]['rating'])
        if 'user_ratings_total' in json['candidates'][0]:
            item.update(google_reviews = json['candidates'][0]['user_ratings_total'])
        if 'price_level' in json['candidates'][0]:
            item.update(google_price =json['candidates'][0]['price_level'])
        currentDT=datetime.datetime.now()
        item.update(updated = currentDT.strftime("%a, %b %d, %Y at %I:%M %p"))
    
    print("Restaurants Remaining: {:4}".format(len(grand_master_list)-i), end="\r",flush=True)
    
    i+=1

for item in grand_master_list:
    if 'google_rating' not in item:
        no_google.append(item)
        grand_master_list.remove(item)
    
for item in grand_master_list:
    if 'google_reviews' not in item:
        no_google.append(item)
        grand_master_list.remove(item)
        
for item in grand_master_list:
    if 'google_name' not in item:
        no_google.append(item)
        grand_master_list.remove(item)
        
no_google_df =  pd.DataFrame(no_google)
no_google_df.to_csv('DataFiles/NoGoogle.csv')

print('---------------',flush=True)
print(f'Google data downloaded and added to grand_master_list...',flush=True)
print(f'{len(no_google)} records from the inspections list were not found in Google search (rating and reviews).',flush=True)  
print('Those records have been removed from grand_master_list and saved to a csv called "NoGoogle.csv".',flush=True)
print(f'There are now {len(grand_master_list)} restaurants remaining in grand_master_list.', flush=True)
print('---------------',flush=True)


# In[13]:


google_lack_similarity = []

for items in grand_master_list:
    if 'google_name' in items:
        s = SequenceMatcher(None, items['inspect_name'], items['google_name'].upper())
        s_ratio = s.ratio()
        if s_ratio <.25:
            dict={}
            dict["INSPECTION"] = items['inspect_name'].lower()
            dict["GOOGLE"] = items['google_name'].lower()
            dict["RATIO"] = str(s.ratio())
            lack_similarity.append(dict)
            grand_master_list.remove(items)
            
google_lack_similarity_df=pd.DataFrame(lack_similarity)
google_lack_similarity_df.to_csv('DataFiles/GoogleLackSimilarity.csv')

print(f'{len(google_lack_similarity)} restaurants downloaded from Google had less than 25% similarity in name when compared to the name in the inspections DB.', flush=True)
print('Assuming these are different establishments, they have been removed from grand_master_list.', flush=True)
print('They have been saved to a csv called "GoogleLackSimilarity.csv".', flush=True)
print(f'There are now {len(grand_master_list)} restaurants left in grand_master_list.', flush=True)
print('---------------',flush=True)


# In[26]:


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

master_df=pd.DataFrame(grand_master_list)
master_df['agg_rating'] = master_df.apply(aggregate_rating, axis=1)
master_df['total_reviews'] = master_df.apply(total_reviews, axis=1)
master_df.agg_rating =master_df.agg_rating.round(2)

master_df.to_csv('DataFiles/MasterList.csv')

print('agg_rating and total_reviews fields created by combining Yelp and Google Ratings and Reviews.', flush=True)
print('grand_master_list is now complete, has been saved as csv named "MasterList.csv".', flush=True)
print('---------------',flush=True)


# In[17]:


#Postgres username, password, and database name
ipaddress = 'localhost'
port = '5432'
username = username
password = password 
dbname = 'Minneapolis_Restaurants'
# A long string that contains the necessary Postgres login information
postgres_str = f'postgresql://{username}:{password}@{ipaddress}:{port}/{dbname}'


# In[27]:


# Creates Classes which will serve as the anchor points for our Table, loads table to Postgres and uplads the data

Base = declarative_base()
engine = create_engine(postgres_str)

class GrandMasterData(Base):
    __tablename__ = 'grandmasterdata'
    index=Column(Integer,primary_key=True,autoincrement=True)
    inspect_name=Column(String,nullable=False)
    address=Column(String)
    inspectionidnumber=Column(String)
    dateofinspection=Column(String)
    inspectionscore=Column(String)
    inspectiontype=Column(String)
    updated=Column(String)
    yelp_id=Column(String,nullable=False)
    yelp_name=Column(String)
    yelp_url=Column(String)
    yelp_price=Column(Integer)
    latitude=Column(Float(20))
    longitude=Column(Float(20))
    yelp_phone=Column(String)
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


# In[19]:


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

