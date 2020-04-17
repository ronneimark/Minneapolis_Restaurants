// Adding tile layer
var map = L.map("map-id", {
	center: [44.9602, -93.2659],
	zoom: 13,
});

var streets = L.tileLayer("https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}", {
	attribution: "Map data &copy; <a href=\"https://www.openstreetmap.org/\">OpenStreetMap</a> contributors, <a href=\"https://creativecommons.org/licenses/by-sa/2.0/\">CC-BY-SA</a>, Imagery © <a href=\"https://www.mapbox.com/\">Mapbox</a>",
	zoom: 13,
	maxZoom: 22,
	minZoom: 11,
	id: "mapbox.streets",
	accessToken: API_KEY
}).addTo(map);

var baseMaps = {
	Streets: streets,
}

var master_scores = new L.LayerGroup();
fetch('/grandmaster_data')
	.then((response) => {
		return response.json();
	})
	.then((myJson) => {
		console.log(myJson);

		var marker = [];

		var ratingStatusCode;
		var ratingCount = {
			Rating4_75: 0,
			Rating4_5: 0,
			Rating4_25: 0,
			Rating4: 0,
			Rating3_75: 0,
			Rating3_5: 0,
			Rating3_25: 0,
			RatingUnder: 0
		};

		var reviewsStatusCode;
		var reviewCount = {
			Reviews15percentile: 0,
			ReviewsUnder15percentile: 0
		};

		var restaurant_list=[]
		var category_list=[]
		var neighborhood_list=[]
		var zipcode_list=[]

		myJson.forEach(function(d){
			restaurant_list.push(d.inspect_name);
			neighborhood_list.push(d.neighborhood);
			zipcode_list.push(d.zipcode)
			d.yelp_categories.forEach(function(e) {
				category_list.push(e)
			});
		});

		let categories = category_list.filter((item, i, ar) => ar.indexOf(item) === i);
		let restaurants = restaurant_list.filter((item, i, ar) => ar.indexOf(item) === i);
		let zipcodes = zipcode_list.filter((item, i, ar) => ar.indexOf(item) === i);
		let neighborhoods = neighborhood_list.filter((item, i, ar) => ar.indexOf(item) === i);
		
		categories = categories.sort()
		restaurants = restaurants.sort()
		zipcodes = zipcodes.sort()
		neighborhoods=neighborhoods.sort()

		console.log(restaurants);
		console.log(categories);
		console.log(zipcodes);
		console.log(neighborhoods);

		for (i = 0; i < myJson.length; i++) {

			var rating = myJson[i].agg_rating;
			var reviews = myJson[i].total_reviews;

			if (rating >= 4.75) { ratingStatusCode = "Rating4_75"; color = "red"; }
			else if (rating >= 4.5) { ratingStatusCode = "Rating4_5"; color = "orange"; }
			else if (rating >= 4.25) { ratingStatusCode = "Rating4_25"; color = "yellow"; }
			else if (rating >= 4) { ratingStatusCode = "Rating4"; color = "green"; }
			else if (rating >= 3.75) { ratingStatusCode = "Rating3_75"; color = "blue";}
			else if (rating >= 3.5) { ratingStatusCode = "Rating3_5"; color = "purple";}
			else if (rating >= 3.25) { ratingStatusCode = "Rating3_25"; color = "black";}
			else { ratingStatusCode = "RatingUnder"; color = "grey" }
			ratingCount[ratingStatusCode]++;

			if (reviews >= 1105) { reviewsStatusCode = "Reviews15percentile"; icon = 'static/images/marker_' + color + myJson[i].inspectionscore.length + '.png'; }
			else { reviewsStatusCode = "ReviewsUnder15percentile"; icon = 'static/images/marker_' + color + myJson[i].inspectionscore.length + '.png'; };
			reviewCount[reviewsStatusCode]++;

			var thisIcon = new L.Icon({
				iconUrl: icon,
				// shadowUrl: 'static/images/marker-shadow.png',
				// iconAnchor: [12, 41],
				// popupAnchor: [0, -34]
				popupAnchor: [0,0]
			});

			var inspections_df = "<table id='inspections'><thead><tr><td style = 'width:70px; min-width:70px; max-width:70px'><center><strong>ID</strong></center></td><td style='width:70px; min-width:70px; max-width:70px;'><center><strong>Date</strong></center></td><td style='width:70px; min-width:70px; max-width:70px;'><center><strong>Type</strong></center></td><td style='width:40px; min-width:40px; max-width:40px;'><center><strong>Score</strong></center></td></tr></thead><tbody>"
			for (var p in myJson[i].dateofinspection) {
				inspections_df += "<tr><td style='width:70px; min-width:70px; max-width:70px;' align=right><a href='http://127.0.0.1:5000/inspection_detail/" + myJson[i].inspectionidnumber[p] + "' onClick=\"return popup(this, 'inspection')\">" + myJson[i].inspectionidnumber[p] + "</a></td><td style='width:70px; min-width:70px; max-width:70px;'>" + myJson[i].dateofinspection[p] + "</td><td style='width:70px; min-width:70px; max-width:70px;'>" + myJson[i].inspectiontype[p] + "</td><td style='width:40px; min-width:40px; max-width:40px;' align='right'>" + myJson[i].inspectionscore[p] + "</td></tr>"
			}
			inspections_df += "</tbody></table>"

			marker.push(L.marker([myJson[i].latitude, myJson[i].longitude], { icon: thisIcon }).addTo(map)
				.bindPopup("<div id='popup-header'><hr><h5><u><strong><center>" + myJson[i].inspect_name + "</center></strong></u></h5><center><strong><i><div style = 'font-size:16px'>" + myJson[i].address + "</div></i></strong></center><center><strong><i><div style = 'font-size:14px'>Neighborhood: " + myJson[i].neighborhood + "</div></i></strong></center><center><strong><div style = 'font-size:14px'>" + myJson[i].yelp_phone + "</div></strong><hr></div><center><div style='font-size:14px; color:red';>" + myJson[i].yelp_categories + "</div><br><center><div style='font-size:14px;'><strong>Agg Score: " + myJson[i].agg_rating + " (" + myJson[i].total_reviews + " reviews)</strong></div></center></div><br><table id='popup-details' align='center'><tr><td valign=top width=185 style=\"max-width:185px; min-width:185px; word-wrap:break-word;\"><center><a href='" + myJson[i].yelp_url + "' onClick=\"return popup(this, 'Yelp')\"><div style='font-size:16px'>YELP</div></a></center><center><strong>Rating: " + myJson[i].yelp_rating + " (" + myJson[i].yelp_reviews + " Reviews)</strong></center><center><strong>Price (0-4): </strong>" + myJson[i].yelp_price + "</center><hr style='width:75%; margin-top:0em; margin-bottom:0em;'><center><strong>Transactions: </strong>" + myJson[i].yelp_transactions + "</strong></center></td><td valign=top width=185 style=\"max-width:185px; min-width:185px; word-wrap:break-word;\"><center><a href='https://www.google.com/maps/place/?q=place_id:" + myJson[i].google_id + "' onClick=\"return popup(this, 'Google')\"<div style='font-size:16px'>GOOGLE</div></a></center><center><strong>Rating: " + myJson[i].google_rating + " (" + myJson[i].google_reviews + " Reviews)</strong></center><center><strong>Price (0-4): " + myJson[i].google_price + "</strong></center><strong></td></tr></table><br><center><h6>Inspections Since 2017: " + myJson[i].inspectionscore.length + "</h6></center><center>" + inspections_df + "</center><hr><center><i><b><div style='color:blue;'>Updated " +  myJson[i].updated +"</div></b></i></center>", { keepInView:true, maxWidth: 390, minWidth:390, minHeight:500, maxHeight:525 })
				.addTo(master_scores));
			master_scores.addTo(map);
		};

		L.Control.legend = L.Control.extend({
			onAdd: function (map) {
				var legendName = 'master_legend'
				var legend = L.DomUtil.create('div');
				legend.id = legendName;
				legend.innerHTML = [
					"<h5><strong><u><center>Scores</center></u></strong></h5>",
					"<table id='legend_table'><tr><td width=30><img src='static/images/marker_red.png',alt='Red'/></td><td width=90><strong>4.75-5.00</strong></td><td width=25 align='right'>(" + ratingCount.Rating4_75 + ")</td></tr>",
					"<tr><td><img src='static/images/marker_orange.png',alt='Orange'/></td><td><strong>4.50-4.75</strong></td><td align='right'>(" + ratingCount.Rating4_5 + ")</td></tr>",
					"<tr><td><img src='static/images/marker_yellow.png',alt='Yellow'/></td><td><strong>4.25-4.50</strong></td><td align='right'>(" + ratingCount.Rating4_25 + ")</td></tr>",
					"<tr><td><img src='static/images/marker_green.png',alt='Green'/></td><td><strong>4.00-4.25</strong></td><td align='right'>(" + ratingCount.Rating4 + ")</td></tr>",
					"<tr><td><img src='static/images/marker_blue.png',alt='Blue'/></td><td><strong>3.75-4.00</strong></td><td align='right'>(" + ratingCount.Rating3_75 + ")</td></tr>",
					"<tr><td><img src='static/images/marker_purple.png',alt='Purple'/></td><td><strong>3.50-3.75</strong></td><td align='right'>(" + ratingCount.Rating3_5 + ")</td></tr>",
					"<tr><td><img src='static/images/marker_black.png',alt='Black'/></td><td><strong>3.25-3.50</strong></td><td align='right'>(" + ratingCount.Rating3_25 + ")</td></tr>",
					"<tr><td><img src='static/images/marker_grey.png',alt='Grey'/></td><td><strong>0.00-3.00</strong></td><td align='right'>(" + ratingCount.RatingUnder + ")</td></tr>",
					// "<tr><td><img src='static/images/marker-icon-2x-grey.png',alt='Big'/></td><td><strong>\>15%ile Reviews</strong></td><td align='right'>(" + reviewCount.Reviews15percentile + ")</td></tr>",
					// "<tr><td><img src='static/images/marker-icon-grey.png',alt='Small'/></td><td><strong>\<15%ile Reviews</strong></td><td align='right'>(" + reviewCount.ReviewsUnder15percentile + ")</td></tr>",
					"</table>",
					"<i># on marker indicates<br>Mpls inspections since 2017.</i>"
				].join("");

				map.on('overlayadd', function (eventLayer) {
					if (eventLayer.name === 'Restaurant Details') {
						var legendary = document.getElementById(legendName);
						legendary.style.display = "inline";
						setBox('Google Scores', false);
						setBox('Yelp Scores', false);
					}
				});

				map.on('overlayremove', (eventLayer) => {
					if (eventLayer.name === 'Restaurant Details') {
						var legendary = document.getElementById(legendName);
						legendary.style.display = "none";
					}
				});

				return legend;
			},

			onRemove: function (map) {
				// Nothing to do here
			}
		});

		L.control.legend = function (opts) { return new L.Control.legend(opts); }
		L.control.legend({ position: 'bottomright' }).addTo(map);
});

var mpls_neighborhoods=new L.LayerGroup();
d3.json('static/Minneapolis_Neighborhoods.geojson', function(neighborhoods){
	L.geoJson(neighborhoods, {
		onEachFeature: function(feature, layer) {
			layer.bindPopup("<h6>"+feature.properties.BDNAME)+"</h6>";
		  }
	}).addTo(mpls_neighborhoods)

	mpls_neighborhoods.addTo(map);


});

var overlays = {
	"Restaurant Details":master_scores,
	"Neighborhoods": mpls_neighborhoods
	}

// lcontrol = L.control.layers(baseMaps, overlays, { collapsed: true, hideSingleBase: true }).addTo(map);

map.on('popupopen', function (e) {
	var px = map.project(e.target._popup._latlng); // find the pixel location on the map where the popup anchor is
	px.y -= e.target._popup._container.clientHeight / 1.75; // find the height of the popup container, divide by 2, subtract from the Y axis of marker location
	map.panTo(map.unproject(px), { animate: true }); // pan to new center
});

/**
 * 
 * @param {string} target 
 * @param {boolean} setting 
 */

function setBox(target, setting)
{
	var checkboxes = document.getElementsByClassName("leaflet-control-layers-selector");
	for(var i = 0; i < checkboxes.length; i++)
	{
		if(target === checkboxes[i].parentElement.children[1].innerText.trim())
		{
			checkboxes[i].checked = setting;
			map.removeLayer(overlays[target]);
			return;
		}
	}
	
}