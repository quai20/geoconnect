function initDemoMap() {
  //BASE TILE LAYER 1
  var CartoDB_VoyagerNoLabels = L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 20
  });
  //MAP STRUCTURE
  var map = L.map('map', {
    layers: [CartoDB_VoyagerNoLabels],
    minZoom: 3,
    worldCopyJump: true,
    inertia: false
  });

  map.setView([47.0, 2.5], -1);

  //INIT RETURN FUNCTION
  return {
    map: map,
  };
}

// MAP CREATION
var mapStuff = initDemoMap();
var map = mapStuff.map;
var gameLayer = new L.LayerGroup();
gameLayer.addTo(map);
var cities;
var names = [];
var lats = [];
var lons = [];
var circle = new L.circle(new L.LatLng(0, 0), radius = 0, {color:'blue'});

var difficulty = document.getElementById('difficulty').value;
var score = 0;
var current;
var a;
var b;
var prop;

var greenIcon = new L.Icon({
  iconUrl: 'dist/icons/marker-icon-2x-green.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

var blueIcon = new L.Icon({
  iconUrl: 'dist/icons/marker-icon-2x-blue.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

var redIcon = new L.Icon({
  iconUrl: 'dist/icons/marker-icon-2x-red.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

//search index
const index = new FlexSearch.Index({
  preset: 'default',            
  tokenize: "full"                        
});

//Load data
$.get("worldcities.csv", function (data) {
  cities = data.split("\n");
  for (var i = 0; i < cities.length; i++) {
    names.push(cities[i].split(",")[0]);
    lats.push(cities[i].split(",")[1]);
    lons.push(cities[i].split(",")[2]);
    index.add(i, cities[i].split(",")[0]);
  };
});

var suggestions = document.getElementById("suggestions");
var userinput = document.getElementById("userinput");
userinput.addEventListener("input", show_results, true);

function show_results() {
  var value = this.value;
  var results = index.search(value);
  //console.log(results);
  var entry, childs = suggestions.childNodes;
  var i = 0, len = results.length;

  for (; i < len; i++) {
      entry = childs[i];
      if (!entry) {
        entry = document.createElement("div");
        entry.className = 'suggestion-bk';      
        suggestions.appendChild(entry);
      }
      entry.textContent = names[results[i]];
      entry.onclick = function () {
      console.log(this.textContent);
      document.getElementById('userinput').value = this.textContent;
    };
  }
  while (childs.length > len) {
      suggestions.removeChild(childs[i])
  }
}   

function StartFunc() {  

  gameLayer.clearLayers();  
  document.getElementById('userinput').value = '';
  document.getElementById('suggestions').innerHTML = "";
  
  score = 0;
  document.getElementById('score').innerHTML = score;
  //get difficulty
  difficulty = document.getElementById('difficulty').value;
  //get cities
  var dis = 0
  while (dis < 2000 || dis > 6000) {    
    a = getRandomInt(names.length);
    b = getRandomInt(names.length);
    dis = HavDist(lats[a], lats[b], lons[a], lons[b]);
    current = a
  }

  //Draw
  var markera = new L.Marker(new L.LatLng(lats[a], lons[a]),{title:names[a],icon:greenIcon}).addTo(gameLayer);
  markera.bindTooltip(names[a]);
  var markerb = new L.Marker(new L.LatLng(lats[b], lons[b]),{title:names[b],icon:blueIcon}).addTo(gameLayer);
  markerb.bindTooltip(names[b]);
  circle.setLatLng(new L.LatLng(lats[a], lons[a]));
  circle.setRadius(difficulty*1000);
  circle.addTo(map);

  map.panTo(new L.LatLng(lats[a], lons[a]));

   //Fill div
   document.getElementById('startV').innerHTML = names[a];
   document.getElementById('endV').innerHTML = names[b];
   document.getElementById('challenge-code').value = genChallengeCode(a, b, difficulty);

}

function GuessFunc() {

  //Get prop
  prop = document.getElementById('userinput').value;
  //get fuzz ration with every city
  var ratios=[]
  for (var i = 0; i<names.length; i++){
    ratios[i] = fuzzball.ratio(prop, names[i]);
  }
  ix = argMax(ratios);
  //seuil à ajuster
  if(ratios[ix]<85){
    console.log('Unknown city !');
  }
  else{
    //console.log(names[ix]);
    score = score+1;
    document.getElementById('score').innerHTML = score;
    //distance
    var d = HavDist(lats[ix],lats[current],lons[ix],lons[current]);
    if(d<difficulty){
      //draw green if inside circle and move circle
      var markerc = new L.Marker(new L.LatLng(lats[ix], lons[ix]),{title:names[ix],icon:greenIcon}).addTo(gameLayer);
      markerc.bindTooltip(names[ix]);
      circle.setLatLng(new L.LatLng(lats[ix], lons[ix]));
      var line = new L.polyline([new L.LatLng(lats[current],lons[current]), new L.LatLng(lats[ix],lons[ix])]).addTo(gameLayer);
      current = ix;
      //Check if endpoint is the new circle 
      var e = HavDist(lats[ix],lats[b],lons[ix],lons[b]);
      if(e<difficulty){
        document.getElementById('warn').innerHTML = 'Well done !!';        
        circle.remove();
        var wincircle = new L.circle(new L.LatLng(lats[ix], lons[ix]), radius = difficulty*1000, {color:'green'}).addTo(gameLayer);
      }
    }
    else{
      //Draw Red
      var markerd = new L.Marker(new L.LatLng(lats[ix], lons[ix]),{title:names[ix],icon:redIcon}).addTo(gameLayer);
      markerd.bindTooltip(names[ix]);
    }
  }
}

function ChallengeFunc() {

  gameLayer.clearLayers();
  document.getElementById('userinput').value = '';
  document.getElementById('suggestions').innerHTML = "";

  score = 0;
  document.getElementById('score').innerHTML = score;
  //parse Challenge code
  var challengecode = document.getElementById('challenge-code').value;
  a = parseInt(challengecode.split('-')[0]);
  b = parseInt(challengecode.split('-')[1]);
  difficulty = parseInt(challengecode.split('-')[2]);  

  if ((a < names.length) && (a > 0) && (b < names.length) && (b > 0) && (a != b) && (difficulty >= 5)) {
    current=a;
    //Draw    
    var markera = new L.Marker(new L.LatLng(lats[a], lons[a]), { title: names[a], icon: greenIcon }).addTo(gameLayer);
    markera.bindTooltip(names[a]);
    var markerb = new L.Marker(new L.LatLng(lats[b], lons[b]), { title: names[b], icon: blueIcon }).addTo(gameLayer);
    markerb.bindTooltip(names[b]);
    circle.setLatLng(new L.LatLng(lats[a], lons[a]));
    circle.setRadius(difficulty * 1000);
    circle.addTo(map);

    //Fill div
    document.getElementById('startV').innerHTML = names[a];
    document.getElementById('endV').innerHTML = names[b];    
  }
  else{
    alert('Wrong Challenge Code');
  }
}

function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}

function HavDist(lat1, lat2, lon1, lon2) {
  var R = 6371; // km 
  //has a problem with the .toRad() method below.
  var x1 = lat2 - lat1;
  var dLat = x1 * Math.PI / 180;
  var x2 = lon2 - lon1;
  var dLon = x2 * Math.PI / 180;
  var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  var d = R * c;
  return d;
}

function argMax(array) {
  return [].map.call(array, (x, i) => [x, i]).reduce((r, a) => (a[0] > r[0] ? a : r))[1];
}

function genChallengeCode(a, b, d) {
  return String(a) + '-' + String(b) + '-' + String(d);
}

//reshape map
document.addEventListener("DOMContentLoaded", (event) => {
  map.invalidateSize();
});