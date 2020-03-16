ALTER TABLE grandmasterdata
	ADD PRIMARY KEY (index),
	ALTER COLUMN index TYPE int,
	ALTER COLUMN inspect_name TYPE varchar,
	ALTER COLUMN address TYPE varchar, 
	ALTER COLUMN zipcode TYPE varchar,
	ALTER COLUMN neighborhood TYPE varchar,
	ALTER COLUMN longitude TYPE float,	
	ALTER COLUMN latitude TYPE float,
	ALTER COLUMN inspectionidnumber TYPE varchar[] USING inspectionidnumber::character varying[],
	ALTER COLUMN dateofinspection TYPE varchar[] USING dateofinspection::character varying[],
	ALTER COLUMN inspectionscore TYPE varchar[] USING inspectionscore::character varying[],
	ALTER COLUMN inspectiontype TYPE varchar[] USING inspectiontype::character varying[],
	ALTER COLUMN yelp_id TYPE varchar,
	ALTER COLUMN yelp_name TYPE varchar,
	ALTER COLUMN yelp_categories TYPE varchar[] USING yelp_categories::character varying[],
	ALTER COLUMN yelp_transactions TYPE varchar[] USING yelp_transactions::character varying[],
	ALTER COLUMN yelp_price TYPE varchar,
	ALTER COLUMN yelp_url TYPE varchar,	
	ALTER COLUMN yelp_phone TYPE varchar,	
	ALTER COLUMN yelp_rating TYPE float,
	ALTER COLUMN yelp_reviews TYPE int,
	ALTER COLUMN google_name TYPE varchar,
	ALTER COLUMN google_id TYPE varchar,
	ALTER COLUMN google_rating TYPE float,
	ALTER COLUMN google_reviews TYPE int,
	ALTER COLUMN google_price TYPE int,
	ALTER COLUMN agg_rating TYPE float,
	ALTER COLUMN total_reviews TYPE int,
	ALTER COLUMN updated TYPE varchar;

DELETE
FROM grandmasterdata
WHERE (agg_rating IS NULL) 
OR (total_reviews IS NULL);

DELETE
FROM grandmasterdata
WHERE (yelp_name IS NULL) 
AND (google_name IS NULL);

DELETE
FROM grandmasterdata
WHERE (yelp_categories IS NULL);

ALTER TABLE inspectionsdetail
	ADD PRIMARY KEY(index,inspectionidnumber),
	ALTER COLUMN inspectionidnumber TYPE int,
	ALTER COLUMN dateofinspection TYPE varchar,
	ALTER COLUMN businessname TYPE varchar,
	ALTER COLUMN fulladdress TYPE varchar,
	ALTER COLUMN inspectiontype TYPE varchar,
	ALTER COLUMN inspectionscore TYPE varchar,
	ALTER COLUMN inspectionresult TYPE varchar,
	ALTER COLUMN foodcodeitem TYPE varchar,	
	ALTER COLUMN foodcodetext TYPE varchar,
	ALTER COLUMN inspectorcomments TYPE varchar,
	ALTER COLUMN violationpriority TYPE varchar,
	ALTER COLUMN violationstatus TYPE varchar,
	ALTER COLUMN violationpoints TYPE varchar;