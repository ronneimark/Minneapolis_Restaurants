// Adding tile layer
var map = L.map("map-id", {
  center: [44.9602, -93.2659],
  zoom: 12,
});

var streets = L.tileLayer("https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}", {
  attribution: "Map data &copy; <a href=\"https://www.openstreetmap.org/\">OpenStreetMap</a> contributors, <a href=\"https://creativecommons.org/licenses/by-sa/2.0/\">CC-BY-SA</a>, Imagery © <a href=\"https://www.mapbox.com/\">Mapbox</a>",
  zoom:12,
  maxZoom: 22,
  minZoom:11,
  id: "mapbox.streets",
  accessToken: API_KEY
}).addTo(map);

// map.zoomControl.remove();

// var markers=new L.LayerGroup();
var baseMaps = {
  Streets:streets,
}
// map.zoomControl.remove();

var yelp_scores = new L.LayerGroup();

fetch('/yelp_data')
  .then((response) => {
    return response.json();
  })
  .then((myJson) => {
    console.log(myJson);

    var marker=[];

    var ratingStatusCode;
    var ratingCount = {
      Rating5: 0,
      Rating4_5: 0,
      Rating4: 0,
      Rating3_5: 0,
      Rating3under:0
    };

    var reviewsStatusCode;
    var reviewCount = {
      Reviews300plus:0,
      ReviewsUnder300:0
    };

    for(i=0; i < myJson.length; i++) {
        
      // var magnitude = Object.assign({}, data.features[i].properties.mag);
      var rating = myJson[i].rating;
      var reviews = myJson[i].reviews;

      if (rating >= 5){ratingStatusCode = "Rating5"; color = "red";} 
      else if (rating >= 4.5){ratingStatusCode = "Rating4_5"; color = "orange";} 
      else if (rating >= 4){ratingStatusCode = "Rating4"; color = "gold";}
      else if (rating >= 3.5){ratingStatusCode = "Rating3_5"; color = "violet";}
      else {ratingStatusCode = "Rating3under"; color = "black"}
      ratingCount[ratingStatusCode]++;

      if (reviews >= 300){reviewsStatusCode = "Reviews300plus"; icon = 'https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-' + color + '.png';}
      else {reviewsStatusCode = "ReviewsUnder300"; icon = 'https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-' + color + '.png';};
      reviewCount[reviewsStatusCode]++;

      var thisIcon = new L.Icon({
        iconUrl: icon,
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
        // iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        // shadowSize: [41, 41]
      });

      marker.push(L.marker([myJson[i].latitude, myJson[i].longitude], {icon: thisIcon}).addTo(map)
        .bindPopup("<div id='uppercase'><strong><u><center><a href='" + myJson[i].url +"'target='_blank'>" + myJson[i].name +"</a></center></u></strong><center></div><i>" + myJson[i].address + "</i></center><center>" + myJson[i].phone + "<hr><center>Yelp Rating: " + myJson[i].rating +"</center><center>" + myJson[i].reviews + " Yelp reviews</center><hr><center><strong>Categories: </strong>" + myJson[i].categories + "</center><center><strong>Transactions: </strong>" + myJson[i].transactions + "</strong></center><center>", {maxWidth:1500})
        .addTo(yelp_scores))
        yelp_scores.addTo(map)
        
    };

    // <a href="javascript:window.open('some.html', 'yourWindowName', 'width=200,height=150');">Test</a>

    console.log(marker)
    console.log(ratingCount)
    console.log(reviewCount)

    L.Control.legend = L.Control.extend({
      onAdd: function(map) {
        var legendName='yelp_legend'
        var legend = L.DomUtil.create('div');
        legend.id = legendName;
        legend.innerHTML = [
          "<table id='legend_table'><tr><td><img src='https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',alt='Red'/></td><td><strong>Rating of 5</strong></td><td align='right'>(" + ratingCount.Rating5 +")</td></tr>",
          "<tr><td><img src='https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-orange.png',alt='Orange'/></td><td><strong>Rating of 4.5</strong></td><td align='right'>(" + ratingCount.Rating4_5 +")</td></tr>",
          "<tr><td><img src='https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-gold.png',alt='Gold'/></td><td><strong>Rating of 4</strong></td><td align='right'>(" + ratingCount.Rating4 +")</td></tr>",
          "<tr><td><img src='https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-violet.png',alt='Purple'/></td><td><strong>Rating of 3.5</strong></td><td align='right'>(" + ratingCount.Rating3_5 +")</td></tr>",
          "<tr><td><img src='https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-black.png',alt='Black'/></td><td><strong>Rating 3 or less</strong></td><td align='right'>(" + ratingCount.Rating3under +")</td></tr>",
          "<tr><td><img src='https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-grey.png',alt='Big'/></td><td><strong>300+ Reviews</strong></td><td align='right'>(" + reviewCount.Reviews300plus +")</td></tr>",
          "<tr><td><img src='https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-grey.png',alt='Small'/></td><td><strong>Under 300 Reviews</strong></td><td align='right'>(" + reviewCount.ReviewsUnder300 +")</td></tr></table>"
        ].join("");

    map.on('overlayadd', function (eventLayer) {
      var legendary = document.getElementById(legendName);
      // Switch to the Permafrost legend...
        if (eventLayer.name === 'Yelp Scores') {
          //this.removeControl(legend1);
          legendary.style.display = "inline";
        }
        else { // Or switch to the treeline legend...
          legendary.style.display = "none";
          //this.removeControl(legend);
          //  legend1.addTo(this);
        }
      });
      
      map.on('overlayremove', (eventLayer) => {
        var legendary = document.getElementById(legendName);
        if (eventLayer.name === 'Yelp Scores') {
          //this.removeControl(legend1);
          legendary.style.display = "none";
        }
      });

        return legend;
      },

      onRemove: function(map) {
      // Nothing to do here
      }
    }); 

  L.control.legend = function(opts) { return new L.Control.legend(opts);}
  L.control.legend({ position: 'bottomright' }).addTo(map);

});


var overlays = {
  "Yelp Scores":yelp_scores
}


L.control.layers(baseMaps, overlays, {collapsed:false}).addTo(map);


// marker.on('mouseover', function(e) {
//   //open popup;
//   var popup = L.popup()
//    .setLatLng(e.latlng) 
//    .setContent('Popup')
//    .openOn(map);
// });

map.on('popupopen', function(e) {
  var px = map.project(e.target._popup._latlng); // find the pixel location on the map where the popup anchor is
  px.y -= e.target._popup._container.clientHeight/2; // find the height of the popup container, divide by 2, subtract from the Y axis of marker location
  map.panTo(map.unproject(px),{animate: true}); // pan to new center
});