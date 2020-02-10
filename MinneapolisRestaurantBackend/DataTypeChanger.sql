ALTER TABLE yelpdata
	ADD PRIMARY KEY (index),
	ALTER COLUMN index TYPE int,
	ALTER COLUMN yelpid TYPE varchar,
	ALTER COLUMN name TYPE varchar,
	ALTER COLUMN image TYPE varchar,
	ALTER COLUMN url TYPE varchar,
	ALTER COLUMN latitude TYPE float,
	ALTER COLUMN longitude TYPE float,
	ALTER COLUMN address TYPE varchar,
	ALTER COLUMN phone TYPE varchar,
	ALTER COLUMN categories TYPE varchar[] USING categories::character varying[],
	ALTER COLUMN transactions TYPE varchar[] USING transactions::character varying[],
	ALTER COLUMN rating TYPE float,
	ALTER COLUMN reviews TYPE int;
	

ALTER TABLE googledata
	ADD PRIMARY KEY (googleplacesid),
	ALTER COLUMN index TYPE int,
	ALTER COLUMN googleplacesid TYPE varchar,
	ALTER COLUMN name TYPE varchar,
	ALTER COLUMN latitude TYPE float,
	ALTER COLUMN longitude TYPE float,
	ALTER COLUMN address TYPE varchar,
	ALTER COLUMN rating TYPE float USING rating::double precision,
	ALTER COLUMN reviews TYPE int,
	ALTER COLUMN price TYPE int,
	ALTER COLUMN icon TYPE varchar,
	ALTER COLUMN photos TYPE varchar[] USING photos::character varying[];

	
ALTER TABLE inspectionsdata
	ADD PRIMARY KEY(index,businessName),
	ALTER COLUMN index TYPE int,
	ALTER COLUMN businessname TYPE varchar,
	ALTER COLUMN fulladdress TYPE varchar,
	ALTER COLUMN latitude TYPE float,
	ALTER COLUMN longitude TYPE float,
	ALTER COLUMN healthfacilityidnumber TYPE varchar[] USING healthfacilityidnumber::character varying[],	
	ALTER COLUMN inspectionidnumber TYPE varchar[] USING inspectionidnumber::character varying[],
	ALTER COLUMN dateofinspection TYPE varchar[] USING dateofinspection::character varying[],
	ALTER COLUMN inspectionscore TYPE varchar[] USING inspectionscore::character varying[],
	ALTER COLUMN inspectiontype TYPE varchar[] USING inspectiontype::character varying[];


