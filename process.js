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

  map.setView([47.0, 2.5], 6);

  //INIT RETURN FUNCTION
  return {
    map: map,
  };
}
//SPINNER OPTS
var spopts = {
  lines: 13, // The number of lines to draw
  length: 38, // The length of each line
  width: 17, // The line thickness
  radius: 45, // The radius of the inner circle
  scale: 1, // Scales overall size of the spinner
  corners: 1, // Corner roundness (0..1)
  speed: 1, // Rounds per second
  rotate: 0, // The rotation offset
  animation: 'spinner-line-fade-quick', // The CSS animation name for the lines
  direction: 1, // 1: clockwise, -1: counterclockwise
  color: '#000000', // CSS color or array of colors
  fadeColor: 'transparent', // CSS color or array of colors
  top: '50%', // Top position relative to parent
  left: '50%', // Left position relative to parent
  shadow: '0 0 1px transparent', // Box-shadow for the lines
  zIndex: 2000000000, // The z-index (defaults to 2e9)
  className: 'spinner', // The CSS class to assign to the spinner
  position: 'absolute', // Element positioning
};

// MAP CREATION
var mapStuff = initDemoMap();
var map = mapStuff.map;
var gameLayer = new L.LayerGroup();
gameLayer.addTo(map);
var cities;
var names = [];
var lats = [];
var lons = [];
var circle = new L.circle(new L.LatLng(0, 0), radius = 0, { color: 'blue' });

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
$.get("FrCities2.csv", function (data) {
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
  while (dis < 400) {
    a = getRandomInt(names.length);
    b = getRandomInt(names.length);
    dis = HavDist(lats[a], lats[b], lons[a], lons[b]);
    current = a
  }

  //Draw
  var markera = new L.Marker(new L.LatLng(lats[a], lons[a]), { title: names[a], icon: greenIcon }).addTo(gameLayer);
  markera.bindTooltip(names[a]);
  var markerb = new L.Marker(new L.LatLng(lats[b], lons[b]), { title: names[b], icon: blueIcon }).addTo(gameLayer);
  markerb.bindTooltip(names[b]);
  circle.setLatLng(new L.LatLng(lats[a], lons[a]));
  circle.setRadius(difficulty * 1000);
  circle.addTo(map);

  map.panTo(new L.LatLng(lats[a], lons[a]));

  //Fill div
  document.getElementById('startV').innerHTML = names[a];
  document.getElementById('endV').innerHTML = names[b];
  document.getElementById('challenge-code').value = genChallengeCode(a, b, difficulty);
}

function GiveUpPre() {
  map.spin(true, { lines: 15, length: 30, radius: 30, color: 'black' });
  setTimeout(GiveUp, 500);
}

function GiveUp() {
  //init
  var izr = 0;
  var currenth = a;
  var brng = 0;
  var destination = [0, 0];
  // loop until goal is inside the circle
  while (HavDist(lats[currenth], lats[b], lons[currenth], lons[b]) > difficulty) {
    brng = bearing(lats[currenth], lats[b], lons[currenth], lons[b]);
    destination = destVincenty(parseFloat(lats[currenth]), parseFloat(lons[currenth]), brng, difficulty * 1000);
    // Find closest city to this point that remains in the circle
    izr = 0;
    for (let th = 1; th < 100; th++) {
      izr = searchCity(destination[0], destination[1], currenth, difficulty, th);
      if (izr < names.length) { break; }
    }
    var markerh = new L.Marker(new L.LatLng(lats[izr], lons[izr])).addTo(gameLayer);
    markerh.bindTooltip(names[izr]);
    var lineh = new L.polyline([new L.LatLng(lats[currenth], lons[currenth]), new L.LatLng(lats[izr], lons[izr])]).addTo(gameLayer);

    currenth = izr;
  }
  circle.remove();
  var wincircle = new L.circle(new L.LatLng(lats[currenth], lons[currenth]), radius = difficulty * 1000, { color: 'green' })
  wincircle.on("add", function () { map.spin(false); });
  wincircle.addTo(gameLayer);
}

function searchCity(lat1, lon1, currentg, difficulty, thresh) {
  var ixr = 1;
  var distx = 1000;
  var dista = 1000;

  while (ixr < names.length) {
    distx = HavDist(lat1, lats[ixr], lon1, lons[ixr]);
    dista = HavDist(lats[currentg], lats[ixr], lons[currentg], lons[ixr]);
    if ((dista < difficulty) && (distx < thresh)) {
      break;
    }
    ixr += 1;
  }
  // console.log(dista,distx);  
  return ixr;
}

function GuessFunc() {

  //Get prop
  prop = document.getElementById('userinput').value;
  //get fuzz ration with every city
  var ratios = []
  for (var i = 0; i < names.length; i++) {
    ratios[i] = fuzzball.ratio(prop, names[i]);
  }
  ix = argMax(ratios);
  //seuil à ajuster
  if (ratios[ix] < 85) {
    console.log('Unknown city !');
  }
  else {
    //console.log(names[ix]);
    score = score + 1;
    document.getElementById('score').innerHTML = score;
    //distance
    var d = HavDist(lats[ix], lats[current], lons[ix], lons[current]);

    if (d < difficulty) {
      //draw green if inside circle and move circle
      var markerc = new L.Marker(new L.LatLng(lats[ix], lons[ix]), { title: names[ix], icon: greenIcon }).addTo(gameLayer);
      markerc.bindTooltip(names[ix]);
      circle.setLatLng(new L.LatLng(lats[ix], lons[ix]));
      var line = new L.polyline([new L.LatLng(lats[current], lons[current]), new L.LatLng(lats[ix], lons[ix])]).addTo(gameLayer);
      current = ix;
      //Check if endpoint is the new circle 
      var e = HavDist(lats[ix], lats[b], lons[ix], lons[b]);
      if (e < difficulty) {
        circle.remove();
        var wincircle = new L.circle(new L.LatLng(lats[ix], lons[ix]), radius = difficulty * 1000, { color: 'green' }).addTo(gameLayer);
        setTimeout("alert('Good Job !! Score : ' + String(score));", 1);
      }
    }
    else {
      //Draw Red
      var markerd = new L.Marker(new L.LatLng(lats[ix], lons[ix]), { title: names[ix], icon: redIcon }).addTo(gameLayer);
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
    current = a;
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
  else {
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

function bearing(lat1, lat2, lon1, lon2) {
  startLat = lat1 * Math.PI / 180;
  startLng = lon1 * Math.PI / 180;
  destLat = lat2 * Math.PI / 180;
  destLng = lon2 * Math.PI / 180;

  y = Math.sin(destLng - startLng) * Math.cos(destLat);
  x = Math.cos(startLat) * Math.sin(destLat) -
    Math.sin(startLat) * Math.cos(destLat) * Math.cos(destLng - startLng);
  brng = Math.atan2(y, x);
  brng = brng * 180 / Math.PI;
  return (brng + 360) % 360;
}

function destVincenty(lat1, lon1, brng, dist) {
  var a = 6378137,
    b = 6356752.3142,
    f = 1 / 298.257223563, // WGS-84 ellipsiod
    s = dist,
    alpha1 = brng * Math.PI / 180,
    sinAlpha1 = Math.sin(alpha1),
    cosAlpha1 = Math.cos(alpha1),
    tanU1 = (1 - f) * Math.tan(lat1 * Math.PI / 180),
    cosU1 = 1 / Math.sqrt((1 + tanU1 * tanU1)), sinU1 = tanU1 * cosU1,
    sigma1 = Math.atan2(tanU1, cosAlpha1),
    sinAlpha = cosU1 * sinAlpha1,
    cosSqAlpha = 1 - sinAlpha * sinAlpha,
    uSq = cosSqAlpha * (a * a - b * b) / (b * b),
    A = 1 + uSq / 16384 * (4096 + uSq * (-768 + uSq * (320 - 175 * uSq))),
    B = uSq / 1024 * (256 + uSq * (-128 + uSq * (74 - 47 * uSq))),
    sigma = s / (b * A),
    sigmaP = 2 * Math.PI;
  while (Math.abs(sigma - sigmaP) > 1e-12) {
    var cos2SigmaM = Math.cos(2 * sigma1 + sigma),
      sinSigma = Math.sin(sigma),
      cosSigma = Math.cos(sigma),
      deltaSigma = B * sinSigma * (cos2SigmaM + B / 4 * (cosSigma * (-1 + 2 * cos2SigmaM * cos2SigmaM) - B / 6 * cos2SigmaM * (-3 + 4 * sinSigma * sinSigma) * (-3 + 4 * cos2SigmaM * cos2SigmaM)));
    sigmaP = sigma;
    sigma = s / (b * A) + deltaSigma;
  };
  var tmp = sinU1 * sinSigma - cosU1 * cosSigma * cosAlpha1,
    lat2 = Math.atan2(sinU1 * cosSigma + cosU1 * sinSigma * cosAlpha1, (1 - f) * Math.sqrt(sinAlpha * sinAlpha + tmp * tmp)),
    lambda = Math.atan2(sinSigma * sinAlpha1, cosU1 * cosSigma - sinU1 * sinSigma * cosAlpha1),
    C = f / 16 * cosSqAlpha * (4 + f * (4 - 3 * cosSqAlpha)),
    L = lambda - (1 - C) * f * sinAlpha * (sigma + C * sinSigma * (cos2SigmaM + C * cosSigma * (-1 + 2 * cos2SigmaM * cos2SigmaM))),
    revAz = Math.atan2(sinAlpha, -tmp); // final bearing
  return [lat2 * 180 / Math.PI, parseFloat(lon1) + (L * 180 / Math.PI)];
};

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
