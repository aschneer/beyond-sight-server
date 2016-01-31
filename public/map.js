var timesSquare = {lat: 40.759168, lng: -73.985071};
var map;
var marker;
var searchBox;
var autoComplete;
var beyondSightServerURL = "http://beyond-sight-server.herokuapp.com";

$(document).ready(function() {
	init();
});

function init()
{
	// Object containing initial options for the map.
	var mapOptions = {
		zoom: 13,
		center: new google.maps.LatLng(timesSquare.lat, timesSquare.lng),
		mapTypeId: google.maps.MapTypeId.ROADMAP
	};
	// Create the map object.  This is global.
	map = new google.maps.Map(document.getElementById('map-canvas'),
		mapOptions);
	// Create search box.
	searchBox = addSearchBox("Type a location...");
	// Set up auto complete for places search box.
	autoComplete = new google.maps.places.Autocomplete(searchBox);
	// Create event listener for when autocomplete
	// items show up in the search box and one is clicked.
	google.maps.event.addListener(autoComplete,"place_changed",search);
}

function addSearchBox(initialText)
{
	// Create the HTML input element.
	var searchBox = document.getElementById("searchBox");
	// Add attributes and values to search box.
	var att1 = document.createAttribute("placeholder");
	att1.value = initialText;
	searchBox.setAttributeNode(att1);
	// Register the search box.
	// Set the index of the search box input amongst
	// its siblings in the HTML DOM tree.
	map.controls[google.maps.ControlPosition.TOP_LEFT].push(searchBox);
	// Return the search box HTML element
	// so an event can be run when something
	// is searched.
	return searchBox;
}

function search()
{
	// Convert search box entry to
	// latitude and longitude.
	// This is done using "Place"
	// library for Google Maps API.
	var place = autoComplete.getPlace();
	// Push lat/lng location to database.
	newDestination(place);
}

function newDestination(place)
{
	var timestamp = new Date(Date.now());
	var ajaxObj = $.ajax({
		type: "POST",
		method: "POST",
		url: (beyondSightServerURL + "/newdestination"),
		contentType: "application/x-www-form-urlencoded; charset=UTF-8",
		dataType: "text",
		data: ('timestamp=' + timestamp + '&lat=' + place.geometry.location.lat() + '&lng=' + place.geometry.location.lng()),
		async: true,
		error: function(jqXHR, textStatus, errorThrown){
			console.log("Error: " + textStatus);
			console.log(errorThrown);
		},
		success: function(data, textStatus, jqXHR){
			console.log(data);
			console.log(textStatus);
		}
	});
}





/*


// Add click event listener for info window.
classMarkerClickListeners[index] = google.maps.event.addListener(classMarkers[index],"click",function(){
	classInfoWindows[index].open(map,classMarkers[index]);
});

// Check if data was received.
if((ajaxObj.readyState == 4) && (ajaxObj.status == 200))
{
	// Parse data from JSON file.
	var parsedData = JSON.parse(ajaxObj.responseText);
	// Call function to add markers for
	// the rest of the class.
	addClassMarkers(parsedData);
}

// Add marker to the destination location.
function addUserMarker(LatLngObj)
{
	// Define options for my marker.
	var markerOptions = {
		map: map,
		title: myInfo.login,
		position: LatLngObj,
		visible: true,
		icon: "./assets/rickles_noBack_small.png"
	};
	// Create user's marker object and
	// update global "myMarker"
	// with the marker object.
	myMarker = new google.maps.Marker(markerOptions);
	// Create an info window
	// for user's marker and update
	// global "myInfoWindow" variable.
	myInfoWindow = new google.maps.InfoWindow({
		content: ("<h3>"+myMarker.getTitle()+"</h3>")
	});
	// Open the user's info window
	// by default.
	myInfoWindow.open(map,myMarker);
	// Add a click event listener
	// for the user's marker.
	myMarkerClickListener = google.maps.event.addListener(myMarker,"click",function(){
		myInfoWindow.open(map,myMarker);		
	});
	// Center the map on the user's marker.
	// NOTE: This won't work if the info
	// windows for all the markers are opened
	// by default, as they are here.  Comment
	// that line out in order for this to work.
	map.setCenter(myMarker.getPosition());
}



*/