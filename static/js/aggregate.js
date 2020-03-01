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
fetch('/master_data')
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
			Rating4under: 0
		};

		var reviewsStatusCode;
		var reviewCount = {
			Reviews1270plus: 0,
			ReviewsUnder1270: 0
		};

		for (i = 0; i < myJson.length; i++) {

			// var magnitude = Object.assign({}, data.features[i].properties.mag);
			var rating = myJson[i].agg_rating;
			var reviews = myJson[i].total_reviews;

			if (rating >= 4.75) { ratingStatusCode = "Rating4_75"; color = "red"; }
			else if (rating >= 4.5) { ratingStatusCode = "Rating4_5"; color = "orange"; }
			else if (rating >= 4.25) { ratingStatusCode = "Rating4_25"; color = "gold"; }
			else if (rating >= 4) { ratingStatusCode = "Rating4"; color = "violet"; }
			else { ratingStatusCode = "Rating4under"; color = "black" }
			ratingCount[ratingStatusCode]++;

			if (reviews >= 1270) { reviewsStatusCode = "Reviews1270plus"; icon = 'static/images/marker-icon-2x-' + color + '.png'; }
			else { reviewsStatusCode = "ReviewsUnder1270"; icon = 'static/images/marker-icon-' + color + '.png'; };
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
				.bindPopup("<div id='uppercase'><strong><u><center>" + myJson[i].name + "</center></u></strong></div><center><strong><i>" + myJson[i].address + "</i></strong></center><center><strong>" + myJson[i].phone + "</strong><hr><center><strong>Yelp Categories: </strong>" + myJson[i].categories + "</center><center><strong>Price (Google 1-4): </strong>" + myJson[i].google_price + "</center><hr><strong>Overall Score: " + myJson[i].agg_rating + "</strong><br><strong>Total Reviews: " + myJson[i].total_reviews + "</strong></center><br><table><tr><td valign=top width=185 style=\"max-width:185px; min-width:185px; word-wrap:break-word;\"><h5><center><a href='" + myJson[i].url + "' onClick=\"return popup(this, 'Yelp')\">YELP</a></center></h5><center>Rating: " + myJson[i].rating + "</center><center>" + myJson[i].reviews + " Reviews</center><center><strong>Transactions: </strong>" + myJson[i].transactions + "</strong></center></td><td valign=top width=185 style=\"max-width:185px; min-width:185px; word-wrap:break-word;\"><h5><center><a href='https://www.google.com/maps/place/?q=place_id:" + myJson[i].google_id + "' onClick=\"return popup(this, 'Google')\">GOOGLE</a></center></h5><center>Rating: " + myJson[i].google_rating + "</center><center>" + myJson[i].google_reviews + " Reviews</center></td></tr></table>", { maxWidth: 380 })
				.addTo(master_scores));
			master_scores.addTo(map);

		};

		L.Control.legend = L.Control.extend({
			onAdd: function (map) {
				var legendName = 'master_legend'
				var legend = L.DomUtil.create('div');
				legend.id = legendName;
				legend.innerHTML = [
					"<h5><strong><u><center>Yelp/Google Scores</center></u></strong></h5>",
					"<table id='legend_table'><tr><td width=70><img src='static/images/marker-icon-red.png',alt='Red'/></td><td width=180><strong>Rating over 4.75</strong></td><td width=50 align='right'>(" + ratingCount.Rating4_75 + ")</td></tr>",
					"<tr><td><img src='static/images/marker-icon-orange.png',alt='Orange'/></td><td><strong>Rating over 4.5</strong></td><td align='right'>(" + ratingCount.Rating4_5 + ")</td></tr>",
					"<tr><td><img src='static/images/marker-icon-gold.png',alt='Gold'/></td><td><strong>Rating over 4.25</strong></td><td align='right'>(" + ratingCount.Rating4_25 + ")</td></tr>",
					"<tr><td><img src='static/images/marker-icon-violet.png',alt='Purple'/></td><td><strong>Rating over 4</strong></td><td align='right'>(" + ratingCount.Rating4 + ")</td></tr>",
					"<tr><td><img src='static/images/marker-icon-black.png',alt='Black'/></td><td><strong>Rating under 4</strong></td><td align='right'>(" + ratingCount.Rating4under + ")</td></tr>",
					"<tr><td><img src='static/images/marker-icon-2x-grey.png',alt='Big'/></td><td><strong>1270+ Reviews</strong></td><td align='right'>(" + reviewCount.Reviews1270plus + ")</td></tr>",
					"<tr><td><img src='static/images/marker-icon-grey.png',alt='Small'/></td><td><strong>Under 1270 Reviews</strong></td><td align='right'>(" + reviewCount.ReviewsUnder1270 + ")</td></tr></table>"
				].join("");


				map.on('overlayadd', function (eventLayer) {
					// Switch to the Permafrost legend...
					if (eventLayer.name === 'Master Scores') {
						var legendary = document.getElementById(legendName);
						legendary.style.display = "inline";
						setBox('Google Scores', false);
						setBox('Yelp Scores', false);
					}
				});

				map.on('overlayremove', (eventLayer) => {
					if (eventLayer.name === 'Master Scores') {
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

		L.Control.legend = L.Control.extend({
			onAdd: function (map) {
				var legendName = 'health_legend';
				var legend = L.DomUtil.create('div');
				legend.id = legendName;
				legend.innerHTML = [
					"<h5><strong><u><center>Inspections since 2017</center></u></strong></h5>",
					"<table id='legend_table'><tr><td width=40><img src='static/images/marker_green10.png',alt='Red'/></td><td width=130><strong>10+ Inspections</strong></td><td width=40 align='right'>(" + ratingCount.inspections10 + ")</td></tr>",
					"<tr><td><img src='static/images/marker_green7.png',alt='Red'/></td><td><strong>7-9 Inspections</strong></td><td align='right'>(" + ratingCount.inspections7 + ")</td></tr>",
					"<tr><td><img src='static/images/marker_green6.png',alt='Orange'/></td><td><strong>6 Inspections</strong></td><td align='right'>(" + ratingCount.inspections6 + ")</td></tr>",
					"<tr><td><img src='static/images/marker_green5.png',alt='Gold'/></td><td><strong>5 Inspections</strong></td><td align='right'>(" + ratingCount.inspections5 + ")</td></tr>",
					"<tr><td><img src='static/images/marker_green4.png',alt='Purple'/></td><td><strong>4 Inspections</strong></td><td align='right'>(" + ratingCount.inspections4 + ")</td></tr>",
					"<tr><td><img src='static/images/marker_green3.png',alt='Black'/></td><td><strong>1-3 Inspections</strong></td><td align='right'>(" + ratingCount.inspections3 + ")</td></tr>",
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

});

var overlays = {
	"Yelp/Google Scores":master_scores,
	"Inspection Scores": health_scores,
	"Neighborhoods": mpls_neighborhoods
}

lcontrol = L.control.layers(baseMaps, overlays, { collapsed: false, hideSingleBase: true }).addTo(map);
setTimeout(() => {
	setBox("Google Scores", false);
	setBox("Yelp Scores", false);
	document.getElementById("master_legend").style.display = 'none';
}, 1000);

map.on('popupopen', function (e) {
	console.log('hi\tworld');
	var px = map.project(e.target._popup._latlng); // find the pixel location on the map where the popup anchor is
	px.y -= e.target._popup._container.clientHeight / 2; // find the height of the popup container, divide by 2, subtract from the Y axis of marker location
	map.panTo(map.unproject(px), { animate: true }); // pan to new center
});

map.addControl(new mapboxgl.GeolocateControl({
    positionOptions: {
        enableHighAccuracy: true
    },
    trackUserLocation: true
}));



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