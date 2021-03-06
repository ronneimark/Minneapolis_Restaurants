# Import the functions we need from flask
from flask import Flask
from flask import render_template 
from flask import jsonify
from flask import request
# from flask import session
from config import password, username, SECRET_KEY
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

# app.secret_key = SECRET_KEY

# Here's where we define the various application routes ...
@app.route("/",  methods=['GET', 'POST'])
def IndexRoute():

    webpage = render_template("index.html")
    return webpage

@app.route("/grandmaster_data", methods=['GET', 'POST'])
def GrandMasterDataRoute():
    
    engine = create_engine(connection_string)
    base = automap_base()
    base.prepare(engine, reflect=True)
    
    table = base.classes.grandmasterdata

    # Open a session, run the query, and then close the session again
    session = Session(engine)
    results = session.query(table.index, table.inspect_name, table.address, table.zipcode, table.neighborhood, table.inspectionidnumber, table.dateofinspection, table.inspectionscore, table.inspectiontype, table.updated, table.yelp_id, table.yelp_name, table.yelp_url, table.yelp_price, table.latitude, table.longitude, table.yelp_phone, table.yelp_categories, table.yelp_transactions, table.yelp_rating, table.yelp_reviews, table.google_name, table.google_id, table.google_rating, table.google_reviews, table.google_price, table.agg_rating, table.total_reviews).all()
    session.close()

    grandmaster_list = []
    for table.index, table.inspect_name, table.address, table.zipcode, table.neighborhood, table.inspectionidnumber, table.dateofinspection, table.inspectionscore, table.inspectiontype, table.updated, table.yelp_id, table.yelp_name, table.yelp_url, table.yelp_price, table.latitude, table.longitude, table.yelp_phone, table.yelp_categories, table.yelp_transactions, table.yelp_rating, table.yelp_reviews, table.google_name, table.google_id, table.google_rating, table.google_reviews, table.google_price, table.agg_rating, table.total_reviews in results:
        dict = {}
        dict["index"] = table.index
        dict["inspect_name"] = table.inspect_name
        dict["address"] = table.address.strip(', United States')
        dict["zipcode"] = table.zipcode
        dict["neighborhood"] = table.neighborhood
        dict["inspectionidnumber"]=table.inspectionidnumber
        dict["dateofinspection"] = table.dateofinspection
        dict["inspectionscore"] = table.inspectionscore
        dict["inspectiontype"] = table.inspectiontype
        dict["updated"]=table.updated
        dict["yelp_id"] = table.yelp_id
        dict["yelp_name"] = table.yelp_name
        dict["yelp_url"] = table.yelp_url
        dict["yelp_price"] = table.yelp_price
        dict["longitude"] = table.longitude
        dict["latitude"] = table.latitude
        dict["yelp_phone"] = table.yelp_phone
        dict["yelp_categories"] = table.yelp_categories
        dict["yelp_transactions"] = table.yelp_transactions
        dict["yelp_rating"] = table.yelp_rating
        dict["yelp_reviews"] = table.yelp_reviews
        dict["google_name"]=table.google_name
        dict["google_id"]=table.google_id
        dict["google_rating"]=table.google_rating
        dict["google_reviews"]=table.google_reviews
        dict["google_price"]=table.google_price
        dict["agg_rating"]=table.agg_rating
        dict["total_reviews"]=table.total_reviews
        grandmaster_list.append(dict)

    # Return the jsonified result. 
    return jsonify(grandmaster_list)

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

    return "This is the test route!"
 
if __name__ == '__main__':
    app.run(debug=True)