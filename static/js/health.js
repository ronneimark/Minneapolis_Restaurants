// Adding tile layer
var map = L.map("map-id", {
  center: [44.9602, -93.2659],
  zoom: 13,
});

L.tileLayer("https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}", {
  attribution: "Map data &copy; <a href=\"https://www.openstreetmap.org/\">OpenStreetMap</a> contributors, <a href=\"https://creativecommons.org/licenses/by-sa/2.0/\">CC-BY-SA</a>, Imagery © <a href=\"https://www.mapbox.com/\">Mapbox</a>",
  zoom:13,
  maxZoom: 22,
  minZoom:11,
  id: "mapbox.streets",
  accessToken: API_KEY
}).addTo(map);

map.zoomControl.remove();

var markers=new L.LayerGroup();

fetch('/health_data')

.then((response) => {
  return response.json();
})
.then((myJson) => {
  console.log(myJson);

  var markers=[];

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
    else {ratingStatusCode = "Rating3under"; color = "blue"}
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

    L.marker([myJson[i].latitude, myJson[i].longitude], {icon: thisIcon}).addTo(map)
      .bindPopup("<div id='feature_infos'><div id='uppercase'><strong><center><u>" + myJson[i].businessname +"</u></center></strong></div><center><i>" + myJson[i].fulladdress + "</i></center><hr><center><strong>Inspections since 2017: </strong>" + myJson[i].inspectionscore.length + "</center><center><strong>Scores: </strong>" + myJson[i].inspectionscore +"</center><center><strong>Dates: </strong>" + myJson[i].dateofinspection + "</center><center><strong>Inspection Types: </strong>" + myJson[i].inspectiontype +"</center></div>", {maxWidth:1500})
      .addTo(map);
      // markers.addTo(map)
  
  };

  // <a href="javascript:window.open('some.html', 'yourWindowName', 'width=200,height=150');">Test</a>

  console.log(ratingCount)
  console.log(reviewCount)

  // L.Control.legend = L.Control.extend({
  //   onAdd: function(map) {
      
  //     var legend = L.DomUtil.create('div');
  //     legend.id = "legend";
  //     legend.innerHTML = [
  //       "<table><tr><td><img src='https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',alt='Red'/></td><td><strong>Rating of 5</strong></td><td align='right'>(" + ratingCount.Rating5 +")</td></tr>",
  //       "<tr><td><img src='https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-orange.png',alt='Orange'/></td><td><strong>Rating of 4.5</strong></td><td align='right'>(" + ratingCount.Rating4_5 +")</td></tr>",
  //       "<tr><td><img src='https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-gold.png',alt='Gold'/></td><td><strong>Rating of 4</strong></td><td align='right'>(" + ratingCount.Rating4 +")</td></tr>",
  //       "<tr><td><img src='https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-violet.png',alt='Purple'/></td><td><strong>Rating of 3.5</strong></td><td align='right'>(" + ratingCount.Rating3_5 +")</td></tr>",
  //       "<tr><td><img src='https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-black.png',alt='Black'/></td><td><strong>Rating 3 or less</strong></td><td align='right'>(" + ratingCount.Rating3under +")</td></tr>",
  //       "<tr><td><img src='https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-grey.png',alt='Big'/></td><td><strong>300+ Reviews</strong></td><td align='right'>(" + reviewCount.Reviews300plus +")</td></tr>",
  //       "<tr><td><img src='https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-grey.png',alt='Small'/></td><td><strong>Under 300 Reviews</strong></td><td align='right'>(" + reviewCount.ReviewsUnder300 +")</td></tr></table>"
  //     ].join("");
  //     return legend;
  //   },

  //   onRemove: function(map) {
  //   // Nothing to do here
  //   }
  // }); 

L.control.legend = function(opts) { return new L.Control.legend(opts);}
L.control.legend({ position: 'bottomright' }).addTo(map);

});


map.on('popupopen', function(centerMarker) {
pane:"fixed"; 
classname:"popup-fixed";
var cM = map.project(centerMarker.popup._latlng);
cM.y -= centerMarker.popup._container.clientHeight/15
map.setView(map.unproject(cM),15, {animate: true});
});

//     .then(function (health_array) {
//         return health_array.json(); // But parse it as JSON this time
//     })
//     .then(function (json) {
//         console.log('GET response as JSON:');
//         console.log(json); // Here's our JSON object
//         // Create a circle and pass in some initial options
//         for(i=0; i < json.length; i++) {
//             var inspectionscore = json[i].inspectionscore
//             function color_swap(inspectionscore){
//               if (inspectionscore >= 90){
//                   return 'green';
//               } else if (inspectionscore >=80){
//                   return 'yellowgreen';
//               } else if (inspectionscore >= 70){
//                   return "orange";
//               } else {
//                   return 'red';
//               }}
//                 // //
//             L.circle([json[i].latitude, json[i].longitude], {
//                 fillColor: color_swap(inspectionscore),
//                 fillOpacity: 0.5,
//                 color: "black",
//                 stroke:.0001,
//                 radius: 75
//             }).addTo(map).bindPopup("<h2><center><u>" + json[i].businessname + "</u></center></h2><center><h3><i>" + json[i].fulladdress + "</i></h3></center><center><h4>Lowest Health Inspection Score: " + json[i].inspectionscore+"</h4></center>")            
//     }
//   });

// map.on('popupopen', function(centerMarker) {
//   var cM = map.project(centerMarker.popup._latlng);
//   cM.y -= centerMarker.popup._container.clientHeight/15
//   map.setView(map.unproject(cM),15, {animate: true});
// });

