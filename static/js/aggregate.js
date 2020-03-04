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
			Rating4under: 0
		};

		var reviewsStatusCode;
		var reviewCount = {
			Reviews15percentile: 0,
			ReviewsUnder15percentile: 0
		};

		
		
		for (i = 0; i < myJson.length; i++) {

			var rating = myJson[i].agg_rating;
			var reviews = myJson[i].total_reviews;

			if (rating >= 4.75) { ratingStatusCode = "Rating4_75"; color = "red"; }
			else if (rating >= 4.5) { ratingStatusCode = "Rating4_5"; color = "orange"; }
			else if (rating >= 4.25) { ratingStatusCode = "Rating4_25"; color = "gold"; }
			else if (rating >= 4) { ratingStatusCode = "Rating4"; color = "violet"; }
			else { ratingStatusCode = "Rating4under"; color = "black" }
			ratingCount[ratingStatusCode]++;

			if (reviews >= 1105) { reviewsStatusCode = "Reviews15percentile"; icon = 'static/images/marker-icon-2x-' + color + '.png'; }
			else { reviewsStatusCode = "ReviewsUnder15percentile"; icon = 'static/images/marker-icon-' + color + '.png'; };
			reviewCount[reviewsStatusCode]++;

			var thisIcon = new L.Icon({
				iconUrl: icon,
				shadowUrl: 'static/images/marker-shadow.png',
				iconAnchor: [12, 41],
				popupAnchor: [1, -34]
			});


			var inspections_df = "<table id='inspections'><tr><th><center>ID</center></th><th><center>Date</center></th><th><center>Type</center></th><th><center>Score</center></th></tr>"
			for (var p in myJson[i].dateofinspection) {
				inspections_df += "<tr><td align=right><a href='http://127.0.0.1:5000/inspection_detail/" + myJson[i].inspectionidnumber[p] + "' onClick=\"return popup(this, 'inspection')\">" + myJson[i].inspectionidnumber[p] + "</a></td><td>" + myJson[i].dateofinspection[p] + "</td><td>" + myJson[i].inspectiontype[p] + "</td><td align='right'>" + myJson[i].inspectionscore[p] + "</td></tr>"
			}
			inspections_df += "</table>"

			marker.push(L.marker([myJson[i].latitude, myJson[i].longitude], { icon: thisIcon }).addTo(map)
				.bindPopup("<div id='uppercase'><h5><u><center>" + myJson[i].inspect_name + "</center></u></h5></div><center><strong><i>" + myJson[i].inspect_address + "</i></strong></center><center><strong>" + myJson[i].yelp_phone + "</strong><hr><center><strong>Yelp Categories: </strong>" + myJson[i].yelp_categories + "</center><center>Overall Score: " + myJson[i].agg_rating + "</strong><br><strong>Total Reviews: " + myJson[i].total_reviews + "</strong></center><br><table><tr><td valign=top width=185 style=\"max-width:185px; min-width:185px; word-wrap:break-word;\"><h6><center><a href='" + myJson[i].yelp_url + "' onClick=\"return popup(this, 'Yelp')\">YELP</a></center></h6><center>Rating: " + myJson[i].yelp_rating + "</center><center>" + myJson[i].yelp_reviews + " Reviews</center><center><strong>Price (0-4): </strong>" + myJson[i].yelp_price + "</center><strong><center><strong>Transactions: </strong>" + myJson[i].yelp_transactions + "</strong></center></td><td valign=top width=185 style=\"max-width:185px; min-width:185px; word-wrap:break-word;\"><h6><center><a href='https://www.google.com/maps/place/?q=place_id:" + myJson[i].google_id + "' onClick=\"return popup(this, 'Google')\">GOOGLE</a></center></h6><center>Rating: " + myJson[i].google_rating + "</center><center>" + myJson[i].google_reviews + " Reviews</center><center><strong>Price (0-4): </strong>" + myJson[i].google_price + "</center><strong></td></tr></table><br><br><center><h6><strong><u>INSPECTIONS SINCE 2017: " + myJson[i].inspectionscore.length + "</u></strong></h6></center><center>" + inspections_df + "</center>", { maxWidth: 380, minWidth:380, maxHeight:490 })
				.addTo(master_scores));
			master_scores.addTo(map);

		};

		L.Control.legend = L.Control.extend({
			onAdd: function (map) {
				var legendName = 'master_legend'
				var legend = L.DomUtil.create('div');
				legend.id = legendName;
				legend.innerHTML = [
					"<h5><strong><u><center>Yelp/Google/Inspections</center></u></strong></h5>",
					"<table id='legend_table'><tr><td width=70><img src='static/images/marker-icon-red.png',alt='Red'/></td><td width=180><strong>Rating over 4.75</strong></td><td width=50 align='right'>(" + ratingCount.Rating4_75 + ")</td></tr>",
					"<tr><td><img src='static/images/marker-icon-orange.png',alt='Orange'/></td><td><strong>Rating over 4.5</strong></td><td align='right'>(" + ratingCount.Rating4_5 + ")</td></tr>",
					"<tr><td><img src='static/images/marker-icon-gold.png',alt='Gold'/></td><td><strong>Rating over 4.25</strong></td><td align='right'>(" + ratingCount.Rating4_25 + ")</td></tr>",
					"<tr><td><img src='static/images/marker-icon-violet.png',alt='Purple'/></td><td><strong>Rating over 4</strong></td><td align='right'>(" + ratingCount.Rating4 + ")</td></tr>",
					"<tr><td><img src='static/images/marker-icon-black.png',alt='Black'/></td><td><strong>Rating under 4</strong></td><td align='right'>(" + ratingCount.Rating4under + ")</td></tr>",
					"<tr><td><img src='static/images/marker-icon-2x-grey.png',alt='Big'/></td><td><strong>\>15%ile Reviews</strong></td><td align='right'>(" + reviewCount.Reviews15percentile + ")</td></tr>",
					"<tr><td><img src='static/images/marker-icon-grey.png',alt='Small'/></td><td><strong>\<15%ile Reviews</strong></td><td align='right'>(" + reviewCount.ReviewsUnder15percentile + ")</td></tr></table>"
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
			layer.bindPopup("<h5>"+feature.properties.BDNAME)+"</h5>";
		  }
	}).addTo(mpls_neighborhoods)

	mpls_neighborhoods.addTo(map);

});

var overlays = {
	"Restaurant Details":master_scores,
	"Neighborhoods": mpls_neighborhoods
}

lcontrol = L.control.layers(baseMaps, overlays, { collapsed: false, hideSingleBase: true }).addTo(map);

map.on('popupopen', function (e) {
	console.log('hi\tworld');
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