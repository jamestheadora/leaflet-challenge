// create tile layers for the backgrounds of the map
var defaultMap = L.tileLayer('https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png', {
	maxZoom: 20,
	attribution: '&copy; OpenStreetMap France | &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
});

// grayscale layer
var grayscale = L.tileLayer('https://stamen-tiles-{s}.a.ssl.fastly.net/toner-lite/{z}/{x}/{y}{r}.{ext}', {
	attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
	subdomains: 'abcd',
	minZoom: 0,
	maxZoom: 20,
	ext: 'png'
});

// water color layer
var waterColor = L.tileLayer('https://stamen-tiles-{s}.a.ssl.fastly.net/watercolor/{z}/{x}/{y}.{ext}', {
	attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
	subdomains: 'abcd',
	minZoom: 1,
	maxZoom: 16,
	ext: 'jpg'
});

// topography
let topoMap = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
	maxZoom: 17,
	attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
});

// make a basemaps object
let basemaps = {
    Default: defaultMap,
    GrayScale: grayscale,
    WaterColor: waterColor,
    Topography: topoMap
};

// make a map object
var myMap = L.map("map", {
  center: [46.2276, 2.2137],
  zoom: 3,
  layers: [defaultMap, grayscale, waterColor, topoMap]
});

// add default map to map
defaultMap.addTo(myMap);

// get data for tectonic plates and draw on the map
// variable to hold tectonic plates layer
let tectonicplates = new L.layerGroup();

// call the api to get the info for tectonic plates
d3.json("https://raw.githubusercontent.com/fraxen/tectonicplates/master/GeoJSON/PB2002_boundaries.json")
.then(function(plateData){
    // console log to make sure data is loaded
    // console.log(plateData);

    // load data using geoJson and add to tectonic plates layer group
    L.geoJson(plateData,{
        // add styling to mkae the line visible
        color: "yellow",
        weight: 1
    }).addTo(tectonicplates)
});

// add tectonic plates to map
tectonicplates.addTo(myMap);

// variable to hold earthquake data layer
let earthquakes = new L.layerGroup();

// get the data for earthquakes and populate layergroup
// call the USGS GeoJson API
d3.json("https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson")
.then(
    function(earthquakeData){
        // console log to make sure data is loaded
        console.log(earthquakeData);
        // plot circles, where radius is dependent on the magnitude
        // and color is dependent on depth

        // make a function that chooses the color of the data point
        function dataColor(depth){
            if (depth > 90)
                return "red";
            else if(depth > 70)
                return "#fc4903";
            else if(depth > 50)
                return "#fc8403";
            else if(depth > 30)
                return "#fcad03";
            else if(depth > 10)
                return "#cafc03";
            else
                return "green";
        }

        // make a function that determines the size of the radius
        function radiusSize(mag){
            if (mag == 0)
                return 1; // makes sure that a 0 mag earthquake shows up
            else
                return mag * 5; // makes sure that the circle is pronounced in the map
        }

        // add on to the style for each data point
        function dataStyle(feature)
        {
            return {
                opacity: 0.5,
                fillOpacity: 0.5,
                fillColor: dataColor(feature.geometry.coordinates[2]), //use index 2 for the depth
                color: "000000", // black outline
                radius: radiusSize(feature.properties.mag), // grabs the magnitude
                weight: 0.5,
                stroke: true
            }
        }

        // add the GeoJson Data to the earthquake layer group
        L.geoJson(earthquakeData, {
            // make each feature a marker that is on the map, each marker is a circle
            pointToLayer: function(feature, latLng) {
                return L.circleMarker(latLng);
            },
            // set the style for each marker
            style: dataStyle, // calls the data style function and passes in the earthquake data
            // add popups
            onEachFeature: function(feature, layer) {
                layer.bindPopup("Magnitude: " + feature.properties.mag + "<br>Depth: " + feature.geometry.coordinates + "<br>Location: " + feature.properties.place)}
        }).addTo(earthquakes);
    }
);

   // add the earthquake layer to the map
   earthquakes.addTo(myMap);

// add the overlay for the tectonic plates and for the earthquakes
let overlays = {
    "Tectonic Plates": tectonicplates,
    "Earthquake Data": earthquakes
};

// add layer control 
L.control
    .layers(basemaps, overlays)
    .addTo(myMap);

// add the legend to the map
let legend = L.control({
    position: "bottomright"
});

// add properties for legend
legend.onAdd = function() {
    // div for legend to appear in page
    let div = L.DomUtil.create("div", "info legend");

    // set up the intervals
    let intervals = [-10, 10, 30, 50 , 70, 90];
    // set the colors for the intervals
    let colors = [
        "green",
        "#cafc03",
        "#fcad03",
        "#fc8403",
        "#fc4903",
        "red"
    ];

    // loop through intervals and colors to generate label with colored square for each interval
    for(var i = 0; i < intervals.length; i++)
    {
        //inner html that sets the square for each interval and label
        div.innerHTML += "<i style='background: "
            + colors[i]
            +"'></i> "
            + intervals[i]
            + (intervals[i + 1] ? "km &ndash km;" + intervals[i + 1] + "km<br>" : "+");
    }
};

// add legend to map
legend.addTo(myMap);
