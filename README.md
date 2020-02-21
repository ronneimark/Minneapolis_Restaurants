# Minneapolis_Restaurants
Project 3


To set up the backend, from the folder "Minneapolis Restaurant Backend":

  1) Create config.py in the "Minneapolis Restaurant Backend" which includes, at minimum:

        api_key = {your yelp api key}
        google_key = {your google api key}
        username = {your postgreSQL username}
        password = {your postgreSQL password}

  2) Create DB called Minneapolis_Restaurants in PostreSQL.

  3) Run python script backend.py in the terminal.

  4) Run DataTypeChanger script in PGAdmin, within the Minneapolis_Restaurants DB to fix the data types.

In the main folder, you will need a config.py with:

      username = {your postgreSQL username}
      password = {your postgreSQL password}

In the static/js folder, you will need a config.js with:

      API_KEY = {your MapBox API key}

 At that point, you should be able to run the Flask Server (app.py) from the main folder and access all of the site.


 
