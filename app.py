# Import the functions we need from flask
from flask import Flask
from flask import render_template 
from flask import jsonify
from flask import request
from config import password, username
from flask_sqlalchemy import SQLAlchemy
import json
import pandas as pd

# Import the functions we need from SQL Alchemy
import sqlalchemy
from sqlalchemy.ext.automap import automap_base
from sqlalchemy.orm import Session
from sqlalchemy import create_engine

# Define the database connection parameters
database_name = 'Minneapolis_Restaurants'  
connection_string = f'postgresql://{username}:{password}@localhost:5432/{database_name}'

app = Flask(__name__)
app.config['SEND_FILE_MAX_AGE_DEFAULT'] = 0 # Effectively disables page caching


# Here's where we define the various application routes ...
@app.route("/",  methods=['GET', 'POST'])
def IndexRoute():
    ''' This function runs when the browser loads the index route. 
        Note that the html file must be located in a folder called templates. '''

    webpage = render_template("index.html")
    return webpage

@app.route("/yelp_data", methods=['GET', 'POST'])
def YelpDataRoute():
    
    engine = create_engine(connection_string)
    base = automap_base()
    base.prepare(engine, reflect=True)
    
    table = base.classes.yelpdata

    # Open a session, run the query, and then close the session again
    session = Session(engine)
    results = session.query(table.index, table.yelpid, table.name, table.image, table.url, table.latitude, table.longitude, table.address, table.phone, table.categories, table.transactions, table.rating, table.reviews).all()
    session.close()

    # Create a list of dictionaries, with each dictionary containing one row from the query. 
    yelp_reviews = []
    for table.index, table.yelpid, table.name, table.image, table.url, table.latitude, table.longitude, table.address, table.phone, table.categories, table.transactions, table.rating, table.reviews in results:
        dict = {}
        dict["index"] = table.index
        dict["yelpid"] = table.yelpid
        dict["name"] = table.name
        dict["image"] = table.image
        dict["url"] = table.url
        dict["latitude"] = table.latitude
        dict["longitude"] = table.longitude
        dict["address"] = table.address
        dict["phone"] = table.phone
        dict["categories"] = table.categories
        dict["transactions"] = table.transactions
        dict["rating"] = table.rating
        dict["reviews"] = table.reviews
        yelp_reviews.append(dict)

    # Return the jsonified result. 
    return jsonify(yelp_reviews)
    
@app.route("/google_data", methods=['GET', 'POST'])
def GoogleDataRoute():
    
    engine = create_engine(connection_string)
    base = automap_base()
    base.prepare(engine, reflect=True)

    # Choose the table we wish to use
    table = base.classes.googledata

    # Open a session, run the query, and then close the session again
    session = Session(engine)
    results = session.query(table.index, table.googleplacesid, table.name, table.latitude, table.longitude, table.address, table.rating, table.reviews, table.price, table.icon, table.photos).all()
    session.close()

    # Create a list of dictionaries, with each dictionary containing one row from the query. 
    google_reviews = []
    for table.index, table.googleplacesid, table.name, table.latitude, table.longitude, table.address, table.rating, table.reviews, table.price, table.icon, table.photos in results:
        dict = {}
        dict["index"] = table.index
        dict["googleplacesid"] = table.googleplacesid
        dict["name"] = table.name
        dict["latitude"] = table.latitude
        dict["longitude"] = table.longitude
        dict["address"] = table.address.rsplit(",",1)[0]
        dict["rating"] = table.rating
        dict["reviews"] = table.reviews
        dict["price"] = table.price
        dict["icon"] = table.icon
        dict["photos"] = table.photos
        google_reviews.append(dict)

    # Return the jsonified result. 
    return jsonify(google_reviews)

@app.route("/health_data")
def HealthDataRoute():
    
    #need this in order to refresh the page
    engine = create_engine(connection_string)
    base = automap_base()
    base.prepare(engine, reflect=True)

    table = base.classes.inspectionsdata

    # Open a session, run the query, and then close the session again
    session = Session(engine)
    results = session.query(table.index, table.businessname, table.inspectionidnumber, table.dateofinspection, table.fulladdress, table.inspectiontype, table.inspectionscore, table.latitude, table.longitude).all()
    session.close()

    # Create a list of dictionaries, with each dictionary containing one row from the query.
    health_array = []
    for table.index, table.businessname, table.inspectionidnumber, table.dateofinspection, table.fulladdress, table.inspectiontype, table.inspectionscore, table.latitude, table.longitude in results:
        dict = {}
        dict['index']=table.index
        dict["businessname"] = table.businessname
        dict["inspectionidnumber"] = table.inspectionidnumber
        dict["dateofinspection"] = table.dateofinspection
        dict["fulladdress"] = table.fulladdress
        dict["inspectiontype"] = table.inspectiontype
        dict["inspectionscore"] = table.inspectionscore
        dict["latitude"] = table.latitude
        dict["longitude"] = table.longitude
        health_array.append(dict)

    # Return the jsonified result.
    return jsonify(health_array)

# @app.route("/minneapolis_neighborhoods")
# def NeighborhoodRoute():

#     data=pd.read_json('Minneapolis_Neighborhoods.geojson')

#     data=data.features

#     i = 0
#     neighborhoods=[]

#     for items in data:
#         dict={}
#         dict['neighborhood']=data[i]['properties']['BDNAME']
#         dict['geometry'] = data[i]['geometry']['coordinates']
#         neighborhoods.append(dict)
#         i+=1

#     return jsonify(neighborhoods)

@app.route("/inspection_detail/<inspection_number>", methods=['GET', 'POST'])
def InspectionDetailRoute(inspection_number):

    #need this in order to refresh the page
    engine = create_engine(connection_string)
    base = automap_base()
    base.prepare(engine, reflect=True)

    table = base.classes.inspectionsdetail

    # Open a session, run the query, and then close the session again
    session = Session(engine)
    results = session.query(table.index, table.inspectionidnumber, table.dateofinspection, table.businessname, table.fulladdress, table.inspectiontype, table.inspectionscore, table.inspectionresult, table.foodcodeitem, table.foodcodetext, table.inspectorcomments, table.violationpriority, table.violationstatus, table.violationpoints).all()
    session.close()

    # Create a list of dictionaries, with each dictionary containing one row from the query.
    inspection_detail_array = []

    for table.index, table.inspectionidnumber, table.dateofinspection, table.businessname, table.fulladdress, table.inspectiontype, table.inspectionscore, table.inspectionresult, table.foodcodeitem, table.foodcodetext, table.inspectorcomments, table.violationpriority, table.violationstatus, table.violationpoints in results:
        dict = {}
        dict["index"] = table.index
        dict["inspectionidnumber"] = table.inspectionidnumber
        dict["dateofinspection"] = table.dateofinspection        
        dict["businessname"] = table.businessname
        dict["fulladdress"] = table.fulladdress
        dict["inspectiontype"] = table.inspectiontype
        dict["inspectionscore"] = table.inspectionscore
        dict["inspectionresult"] = table.inspectionresult
        dict["foodcodeitem"] = table.foodcodeitem
        dict["foodcodetext"] = table.foodcodetext
        dict["inspectorcomments"] = table.inspectorcomments
        dict["violationpriority"] = table.violationpriority
        dict["violationstatus"] = table.violationstatus
        dict["violationpoints"] = table.violationpoints
        inspection_detail_array.append(dict)

    inspection_detail = []

    for item in inspection_detail_array:
        search_term = str(item['inspectionidnumber'])

        if search_term == inspection_number:
            inspection_detail.append(item)

    return render_template('inspection.html', inspectionscore=inspection_detail[0]['inspectionscore'], businessname=inspection_detail[0]['businessname'], fulladdress=inspection_detail[0]['fulladdress'], dateofinspection=inspection_detail[0]['dateofinspection'], inspectiontype=inspection_detail[0]['inspectiontype'], inspectionidnumber=inspection_detail[0]['inspectionidnumber'], inspection_detail = inspection_detail)
    # return jsonify(inspection_detail)

@app.route("/test")
def TestRoute():
    ''' This function returns a simple message, just to guarantee that
        the Flask server is working. '''

    return "This is the test route!"

# This statement is required for Flask to do its job. 
# Think of it as chocolate cake recipe. 
if __name__ == '__main__':
    app.run(debug=True)