// Adding tile layer
var map = L.map("map-id", {
	center: [44.9602, -93.2659],
	zoom: 12,
});

var streets = L.tileLayer("https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}", {
	attribution: "Map data &copy; <a href=\"https://www.openstreetmap.org/\">OpenStreetMap</a> contributors, <a href=\"https://creativecommons.org/licenses/by-sa/2.0/\">CC-BY-SA</a>, Imagery © <a href=\"https://www.mapbox.com/\">Mapbox</a>",
	zoom: 12,
	maxZoom: 22,
	minZoom: 11,
	id: "mapbox.streets",
	accessToken: API_KEY
}).addTo(map);

var baseMaps = {
	Streets: streets,
}
// map.zoomControl.remove();


var yelp_scores = new L.LayerGroup();
fetch('/yelp_data')
	.then((response) => {
		return response.json();
	})
	.then((myJson) => {
		console.log(myJson);

		var marker = [];

		var ratingStatusCode;
		var ratingCount = {
			Rating5: 0,
			Rating4_5: 0,
			Rating4: 0,
			Rating3_5: 0,
			Rating3under: 0
		};

		var reviewsStatusCode;
		var reviewCount = {
			Reviews300plus: 0,
			ReviewsUnder300: 0
		};

		for (i = 0; i < myJson.length; i++) {

			// var magnitude = Object.assign({}, data.features[i].properties.mag);
			var rating = myJson[i].rating;
			var reviews = myJson[i].reviews;

			if (rating >= 5) { ratingStatusCode = "Rating5"; color = "red"; }
			else if (rating >= 4.5) { ratingStatusCode = "Rating4_5"; color = "orange"; }
			else if (rating >= 4) { ratingStatusCode = "Rating4"; color = "gold"; }
			else if (rating >= 3.5) { ratingStatusCode = "Rating3_5"; color = "violet"; }
			else { ratingStatusCode = "Rating3under"; color = "black" }
			ratingCount[ratingStatusCode]++;

			if (reviews >= 300) { reviewsStatusCode = "Reviews300plus"; icon = 'static/images/marker-icon-2x-' + color + '.png'; }
			else { reviewsStatusCode = "ReviewsUnder300"; icon = 'static/images/marker-icon-' + color + '.png'; };
			reviewCount[reviewsStatusCode]++;

			var thisIcon = new L.Icon({
				iconUrl: icon,
				shadowUrl: 'static/images/marker-shadow.png',
				// iconSize: [25, 41],
				iconAnchor: [12, 41],
				popupAnchor: [1, -34],
				// shadowSize: [41, 41]
			});

			marker.push(L.marker([myJson[i].latitude, myJson[i].longitude], { icon: thisIcon }).addTo(map)
				.bindPopup("<div id='uppercase'><strong><u><center><a href='" + myJson[i].url + "' onClick=\"return popup(this, 'Yelp')\">" + myJson[i].name + "</a></u></strong></div></center><center><i>" + myJson[i].address + "</i></center><center>" + myJson[i].phone + "<hr><center>Yelp Rating: " + myJson[i].rating + "</center><center>" + myJson[i].reviews + " Yelp reviews</center><hr><center><strong>Categories: </strong>" + myJson[i].categories + "</center><center><strong>Transactions: </strong>" + myJson[i].transactions + "</strong></center><center>", { maxWidth: 1500 })
				.addTo(yelp_scores));
			yelp_scores.addTo(map);

		};

		L.Control.legend = L.Control.extend({
			onAdd: function (map) {
				var legendName = 'yelp_legend'
				var legend = L.DomUtil.create('div');
				legend.id = legendName;
				legend.innerHTML = [
					"<h5><strong><u><center>Yelp Scores</center></u></strong></h5>",
					"<table id='legend_table'><tr><td width=70><img src='static/images/marker-icon-red.png',alt='Red'/></td><td width=180><strong>Rating of 5</strong></td><td width=50 align='right'>(" + ratingCount.Rating5 + ")</td></tr>",
					"<tr><td><img src='static/images/marker-icon-orange.png',alt='Orange'/></td><td><strong>Rating of 4.5</strong></td><td align='right'>(" + ratingCount.Rating4_5 + ")</td></tr>",
					"<tr><td><img src='static/images/marker-icon-gold.png',alt='Gold'/></td><td><strong>Rating of 4</strong></td><td align='right'>(" + ratingCount.Rating4 + ")</td></tr>",
					"<tr><td><img src='static/images/marker-icon-violet.png',alt='Purple'/></td><td><strong>Rating of 3.5</strong></td><td align='right'>(" + ratingCount.Rating3_5 + ")</td></tr>",
					"<tr><td><img src='static/images/marker-icon-black.png',alt='Black'/></td><td><strong>Rating 3 or less</strong></td><td align='right'>(" + ratingCount.Rating3under + ")</td></tr>",
					"<tr><td><img src='static/images/marker-icon-2x-grey.png',alt='Big'/></td><td><strong>300+ Reviews</strong></td><td align='right'>(" + reviewCount.Reviews300plus + ")</td></tr>",
					"<tr><td><img src='static/images/marker-icon-grey.png',alt='Small'/></td><td><strong>Under 300 Reviews</strong></td><td align='right'>(" + reviewCount.ReviewsUnder300 + ")</td></tr></table>"
				].join("");


				map.on('overlayadd', function (eventLayer) {
					// Switch to the Permafrost legend...
					if (eventLayer.name === 'Yelp Scores') {
						var legendary = document.getElementById(legendName);
						legendary.style.display = "inline";
						setBox('Google Scores', false);
					}
				});

				map.on('overlayremove', (eventLayer) => {
					if (eventLayer.name === 'Yelp Scores') {
						var legendary = document.getElementById(legendName);
						//this.removeControl(legend1);
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
		L.control.legend({ position: 'bottomleft' }).addTo(map);

});


var google_scores = new L.LayerGroup();
fetch('/google_data')
	.then((response) => {
		return response.json();
	})
	.then((myJson) => {
		console.log(myJson);

		var marker = [];

		var ratingStatusCode;
		var ratingCount = {
			Rating4_75plus: 0,
			Rating4_5plus: 0,
			Rating4_25plus: 0,
			Rating4plus: 0,
			Ratingunder4: 0
		};

		var reviewsStatusCode;
		var reviewCount = {
			Reviews1000plus: 0,
			ReviewsUnder1000: 0
		};

		for (i = 0; i < myJson.length; i++) {

			// var magnitude = Object.assign({}, data.features[i].properties.mag);
			var rating = myJson[i].rating;
			var reviews = myJson[i].reviews;

			if (rating >= 4.75) { ratingStatusCode = "Rating4_75plus"; color = "red"; }
			else if (rating >= 4.5) { ratingStatusCode = "Rating4_5plus"; color = "orange"; }
			else if (rating >= 4.25) { ratingStatusCode = "Rating4_25plus"; color = "gold"; }
			else if (rating >= 4) { ratingStatusCode = "Rating4plus"; color = "violet"; }
			else { ratingStatusCode = "Ratingunder4"; color = "black" }
			ratingCount[ratingStatusCode]++;

			if (reviews >= 1000) { reviewsStatusCode = "Reviews1000plus"; icon = 'static/images/marker-icon-2x-' + color + '.png'; }
			else { reviewsStatusCode = "ReviewsUnder1000"; icon = 'static/images/marker-icon-' + color + '.png'; };
			reviewCount[reviewsStatusCode]++;

			var thisIcon = new L.Icon({
				iconUrl: icon,
				shadowUrl: 'static/images/marker-shadow.png',
				// iconSize: [25, 41],
				iconAnchor: [12, 41],
				popupAnchor: [1, -34],
				// shadowSize: [41, 41]
			});

			marker.push(L.marker([myJson[i].latitude, myJson[i].longitude], { icon: thisIcon }).addTo(map)
				.bindPopup("<strong><center><u><div id='uppercase'><a href='https://www.google.com/maps/place/?q=place_id:" + myJson[i].googleplacesid + "' onClick=\"return popup(this, 'Google')\">" + myJson[i].name + "</a></center></u></strong><center></div><i>" + myJson[i].address + "</i></center><hr><center> Google Rating: " + myJson[i].rating + "</center><center>" + myJson[i].reviews + " Google reviews</center><hr><center><strong>Price (1-4): </strong>" + myJson[i].price + "</center>", { maxWidth: 1500 })
				.addTo(google_scores))
			google_scores.addTo(map)

		};

		L.Control.legend = L.Control.extend({
			onAdd: function (map) {
				var legendName = 'google_legend'
				var legend = L.DomUtil.create('div');
				legend.id = legendName;
				legend.innerHTML = [
					"<h5><strong><u><center>Google Scores</center></u></strong></h5>",
					"<table id='legend_table'><tr><td width=70><img src='static/images/marker-icon-red.png',alt='Red'/></td><td width=180><strong>Rating over 4.75</strong></td><td width=50 align='right'>(" + ratingCount.Rating4_75plus + ")</td></tr>",
					"<tr><td><img src='static/images/marker-icon-orange.png',alt='Orange'/></td><td><strong>Rating over 4.5</strong></td><td align='right'>(" + ratingCount.Rating4_5plus + ")</td></tr>",
					"<tr><td><img src='static/images/marker-icon-gold.png',alt='Gold'/></td><td><strong>Rating over 4.25</strong></td><td align='right'>(" + ratingCount.Rating4_25plus + ")</td></tr>",
					"<tr><td><img src='static/images/marker-icon-violet.png',alt='Purple'/></td><td><strong>Rating over 4</strong></td><td align='right'>(" + ratingCount.Rating4plus + ")</td></tr>",
					"<tr><td><img src='static/images/marker-icon-black.png',alt='Black'/></td><td><strong>Rating under 4</strong></td><td align='right'>(" + ratingCount.Ratingunder4 + ")</td></tr>",
					"<tr><td><img src='static/images/marker-icon-2x-grey.png',alt='Big'/></td><td><strong>1000+ Reviews</strong></td><td align='right'>(" + reviewCount.Reviews1000plus + ")</td></tr>",
					"<tr><td><img src='static/images/marker-icon-grey.png',alt='Small'/></td><td><strong>Under 1000 Reviews</strong></td><td align='right'>(" + reviewCount.ReviewsUnder1000 + ")</td></tr></table>"
				].join("");

				map.on('overlayadd', function (eventLayer) {
					// Switch to the Permafrost legend...
					if (eventLayer.name === 'Google Scores') {
						var legendary = document.getElementById(legendName);
						//this.removeControl(legend1);
						legendary.style.display = "inline";
						setBox('Yelp Scores', false);
					}
				});

				map.on('overlayremove', (eventLayer) => {
					if (eventLayer.name === 'Google Scores') {
						var legendary = document.getElementById(legendName);
						//this.removeControl(legend1);
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
		L.control.legend({ position: 'bottomleft' }).addTo(map);

});

var health_scores = new L.LayerGroup();
fetch('/health_data')
	.then((response) => {
		return response.json();
	})
	.then((myJson) => {
		console.log(myJson);

		var marker = [];

		var ratingStatusCode;
		var ratingCount = {
			inspections10: 0,
			inspections7: 0,
			inspections6: 0,
			inspections5: 0,
			inspections4: 0,
			inspections3: 0
		};

		var reviewsStatusCode;
		var reviewCount = {
			Reviews10plus: 0,
			ReviewsUnder300: 0
		};

		for (i = 0; i < myJson.length; i++) {

			// var magnitude = Object.assign({}, data.features[i].properties.mag);
			var rating = myJson[i].dateofinspection.length;
			var reviews = myJson[i].reviews;
			if (rating >= 10) { ratingStatusCode = "inspections10"; icon = "static/images/marker_green10.png"; }
			else if (rating >= 7) { ratingStatusCode = "inspections7"; icon = "static/images/marker_green7.png"; }
			else if (rating >= 6) { ratingStatusCode = "inspections6"; icon = "static/images/marker_green6.png"; }
			else if (rating >= 5) { ratingStatusCode = "inspections5"; icon = "static/images/marker_green5.png"; }
			else if (rating >= 4) { ratingStatusCode = "inspections4";  icon = "static/images/marker_green4.png"; }
			else { ratingStatusCode = "inspections3"; icon = "static/images/marker_green3.png" }
			ratingCount[ratingStatusCode]++;

			var thisIcon = new L.Icon({
				iconUrl: icon,
				shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
				// iconSize: [25, 41],
				iconAnchor: [12, 41],
				popupAnchor: [1, -34],
				// shadowSize: [41, 41]
			});

			var inspections_df = "<table id='inspections'><tr><th><center>ID</center></th><th><center>Date</center></th><th><center>Type</center></th><th><center>Score</center></th></tr>"
			for (var p in myJson[i].dateofinspection) {
				// inspections_df += "<tr><td><a href='http://127.0.0.1:5000/inspection_detail/" + myJson[i].inspectionidnumber[p] + "' target='_blank'>" + myJson[i].inspectionidnumber[p] + "</a></td><td>" + myJson[i].dateofinspection[p] + "</td><td>" + myJson[i].inspectiontype[p] + "</td><td align='right'>" + myJson[i].inspectionscore[p] + "</td></tr>"
				inspections_df += "<tr><td align=right><a href='http://127.0.0.1:5000/inspection_detail/" + myJson[i].inspectionidnumber[p] + "' onClick=\"return popup(this, 'inspection')\">" + myJson[i].inspectionidnumber[p] + "</a></td><td>" + myJson[i].dateofinspection[p] + "</td><td>" + myJson[i].inspectiontype[p] + "</td><td align='right'>" + myJson[i].inspectionscore[p] + "</td></tr>"
			}
			inspections_df += "</table>"

			marker.push(
				L.marker([myJson[i].latitude, myJson[i].longitude], {
					icon: thisIcon
				})
					.bindPopup("<div id='feature_infos'><div id='uppercase'><strong><center><u>" + myJson[i].businessname + "</u></center></strong></div><center><i>" + myJson[i].fulladdress + "</i></center><br><center><h6><strong>Inspections since 2017: " + myJson[i].inspectionscore.length + "</strong></h6></center><center>" + inspections_df + "</center></div>", { maxWidth: 500 })
					// <strong>Scores: </strong>" + myJson[i].inspectionscore +"</center><center><strong>Dates: </strong>" + myJson[i].dateofinspection + "</center><center><strong>Inspection Types: </strong>" + myJson[i].inspectiontype
					.addTo(health_scores))
			health_scores.addTo(map)

		};

		console.log(health_scores)
		console.log(ratingCount)
		console.log(reviewCount)


		L.Control.legend = L.Control.extend({
			onAdd: function (map) {
				var legendName = 'health_legend';
				var legend = L.DomUtil.create('div');
				legend.id = legendName;
				legend.innerHTML = [
					"<h5><strong><u><center>Inspections since 2017</center></u></strong></h5>",
					"<table id='legend_table'><tr><td width=40><img src='static/images/marker_green10.png',alt='Red'/></td><td width=130><strong>10+ Inspections</strong></td><td width=40 align='right'>(" + ratingCount.inspections10 + ")</td></tr>",
					// "<tr><td><img src='static/images/icons8-inspection-80-red.png',alt='Red'/></td><td><strong>7+ Inspections</strong></td><td align='right'>(" + ratingCount.inspections7 + ")</td></tr>",
					// "<tr><td><img src='static/images/icons8-inspection-80-orange.png',alt='Orange'/></td><td><strong>6 Inspections</strong></td><td align='right'>(" + ratingCount.inspections6 + ")</td></tr>",
					// "<tr><td><img src='static/images/icons8-inspection-80-pink.png',alt='Gold'/></td><td><strong>5 Inspections</strong></td><td align='right'>(" + ratingCount.inspections5 + ")</td></tr>",
					// "<tr><td><img src='static/images/icons8-inspection-80-blue.png',alt='Purple'/></td><td><strong>4 Inspections</strong></td><td align='right'>(" + ratingCount.inspections4 + ")</td></tr>",
					// "<tr><td><img src='static/icons8-inspection-80-purple.png',alt='Black'/></td><td><strong>3 or fewer</strong></td><td align='right'>(" + ratingCount.inspections3 + ")</td></tr>",
					"<tr><td><img src='static/images/marker_green7.png',alt='Red'/></td><td><strong>7-9 Inspections</strong></td><td align='right'>(" + ratingCount.inspections7 + ")</td></tr>",
					"<tr><td><img src='static/images/marker_green6.png',alt='Orange'/></td><td><strong>6 Inspections</strong></td><td align='right'>(" + ratingCount.inspections6 + ")</td></tr>",
					"<tr><td><img src='static/images/marker_green5.png',alt='Gold'/></td><td><strong>5 Inspections</strong></td><td align='right'>(" + ratingCount.inspections5 + ")</td></tr>",
					"<tr><td><img src='static/images/marker_green4.png',alt='Purple'/></td><td><strong>4 Inspections</strong></td><td align='right'>(" + ratingCount.inspections4 + ")</td></tr>",
					"<tr><td><img src='static/images/marker_green3.png',alt='Black'/></td><td><strong>1-3 Inspections</strong></td><td align='right'>(" + ratingCount.inspections3 + ")</td></tr>",
					// "<tr><td><img src='https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-grey.png',alt='Big'/></td><td><strong>300+ Reviews</strong></td><td align='right'>(" + reviewCount.Reviews300plus +")</td></tr>",
					// "<tr><td><img src='https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-grey.png',alt='Small'/></td><td><strong>Under 300 Reviews</strong></td><td align='right'>(" + reviewCount.ReviewsUnder300 +")</td></tr>",
					"</table>"
				].join("");

				map.on('overlayadd', function (eventLayer) {
					if (eventLayer.name === 'Inspection Scores') {
						var legendary = document.getElementById(legendName);
						legendary.style.display = "inline";
					}
				});

				map.on('overlayremove', (eventLayer) => {
					if (eventLayer.name === 'Inspection Scores') {
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
			layer.bindPopup(feature.properties.BDNAME);
		  }
	}).addTo(mpls_neighborhoods)

	mpls_neighborhoods.addTo(map);

  }

);

// d3.json('static/Minneapolis_Neighborhoods.geojson', function(data) {

// 	// Create a new choropleth layer
// 	geojson = L.choropleth(data, {
  
// 	  // Define what  property in the features to use
// 	  valueProperty: "MHI2016",
  
// 	  // Set color scale
// 	  scale: ["#ffffb2", "#b10026"],
  
// 	  // Number of breaks in step range
// 	  steps: 10,
  
// 	  // q for quartile, e for equidistant, k for k-means
// 	  mode: "q",
// 	  style: {
// 		// Border color
// 		color: "#fff",
// 		weight: 1,
// 		fillOpacity: 0.8
// 	  },
  
// 	  // Binding a pop-up to each layer
// 	  onEachFeature: function(feature, layer) {
// 		layer.bindPopup("Zip Code: " + feature.properties.ZIP + "<br>Median Household Income:<br>" +
// 		  "$" + feature.properties.MHI2016);
// 	  }


// fetch('/minneapolis_neighborhoods')
// 	.then((response) => {
// 		return response.json();
// 	})
// 	.then((myJson) => {
// 		myJson.forEach(function(neighborhood) {
// 			console.log(neighborhood.neighborhood)
// 			console.log(toLatLon(neighborhood.geometry))
			
// 			var polygon=L.polygon(neighborhood.geometry, {
// 				weight: 1,
// 				fillOpacity: 0.7,
// 				color: 'red',
// 				dashArray: '3'
// 			}).addTo(mpls_neighborhoods)
// 		mpls_neighborhoods.addTo(map)	
// 		})	
// });

var overlays = {
	"Yelp Scores": yelp_scores,
	"Google Scores": google_scores,
	"Inspection Scores": health_scores,
	"Neighborhoods": mpls_neighborhoods
}

lcontrol = L.control.layers(baseMaps, overlays, { collapsed: false, hideSingleBase: true }).addTo(map);
setTimeout(() => {
	setBox("Google Scores", false);
	document.getElementById("google_legend").style.display = 'none';
}, 1000);

map.on('popupopen', function (e) {
	console.log('hi\tworld');
	var px = map.project(e.target._popup._latlng); // find the pixel location on the map where the popup anchor is
	px.y -= e.target._popup._container.clientHeight / 2; // find the height of the popup container, divide by 2, subtract from the Y axis of marker location
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