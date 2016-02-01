var defaultLoc = {lat: 40.759168, lng: -73.985071};
var map;
var marker;
var searchBox;
var confirmBox;
var autoComplete;
var beyondSightServerURL = "http://beyond-sight-server.herokuapp.com";
var map_marker = new google.maps.Marker({map: null, visible: false});
var map_infoWindow = new google.maps.InfoWindow({content: ""});

$(document).ready(function() {
	init();
});

function init()
{
	// Object containing initial options for the map.
	var mapOptions = {
		zoom: 13,
		center: new google.maps.LatLng(defaultLoc.lat, defaultLoc.lng),
		mapTypeId: google.maps.MapTypeId.ROADMAP
	};
	// Create the map object.  This is global.
	map = new google.maps.Map(document.getElementById('map-canvas'),
		mapOptions);
	// Create search box.
	searchBox = addSearchBox("Type a location...");
	// Create confirm box for destination setting feedback.
	confirmBox = addConfirmBox();
	// Set up auto complete for places search box.
	autoComplete = new google.maps.places.Autocomplete(searchBox);
	// Create event listener for when autocomplete
	// items show up in the search box and one is clicked.
	google.maps.event.addListener(autoComplete,"place_changed",search);
}

// Create searchbox for choosing destination.
function addSearchBox(initialText)
{
	// Create the HTML input element.
	var searchBox = document.getElementById("searchBox");
	// Add attributes and values to search box.
	var att = document.createAttribute("placeholder");
	att.value = initialText;
	searchBox.setAttributeNode(att);
	// Register the search box.
	// Set the index of the search box input amongst
	// its siblings in the HTML DOM tree.
	map.controls[google.maps.ControlPosition.TOP_CENTER].push(searchBox);
	// Return the search box HTML element
	// so an event can be run when something
	// is searched.
	return searchBox;
}

// Create box that confirms for the user
// that the destination has been successfully
// selected.
function addConfirmBox()
{
	// Create the HTML input element.
	var confirmBox = document.getElementById("confirmBox");
	// Register the search box.
	// Set the index of the search box input amongst
	// its siblings in the HTML DOM tree.
	map.controls[google.maps.ControlPosition.BOTTOM_CENTER].push(confirmBox);
	// Return the search box HTML element
	// so an event can be run when something
	// is searched.
	return confirmBox;
}

function search()
{
	// Start by changing the confirm box
	// back to "failure" state.
	$("p#confirmBoxText").html("Failure.");
	// Set background color to red.
	$("div#confirmBox").css("background-color", "#ff6666");
	$("div#confirmBox").css("border-style", "none");
	// Convert search box entry to
	// latitude and longitude.
	// This is done using "Place"
	// library for Google Maps API.
	var place = autoComplete.getPlace();
	// Push lat/lng location to database.
	setNewDestination(place);
}

function setNewDestination(place)
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
			updateMap();
		}
	});
}

// Update the map with the new destination,
// and also confirm that the location was
// successfully stored in the database.
// If successful, update confirmBox object
// so user can see that the destination
// selection was successful.
function updateMap()
{
	var ajaxObj = $.ajax({
		type: "GET",
		method: "GET",
		url: (beyondSightServerURL + "/getdestination"),
		contentType: "application/x-www-form-urlencoded; charset=UTF-8",
		dataType: "text",
		async: true,
		error: function(jqXHR, textStatus, errorThrown){
			console.log("Error: " + textStatus);
			console.log(errorThrown);
			// Update confirm box with "Failure" message.
			$("p#confirmBoxText").html("Failure.");
			// Set confirm box to red.
			$("div#confirmBox").css("background-color", "#ff6666");
			$("div#confirmBox").css("border-style", "none");
		},
		success: function(data, textStatus, jqXHR){
			console.log(data);
			console.log(textStatus);
			// Get returned data from server/database.
			var newLat = JSON.parse(data).lat;
			var newLng = JSON.parse(data).lng;
			// Add marker at newly set destination.
			// If a marker already exists, this
			// should overwrite it.
			addMarker(newLat, newLng);
			// Re-center map on this new location.
			map.setCenter({lat: newLat, lng: newLng});
			// Update confirm box with "success" message.
			$("p#confirmBoxText").html("SUCCESS!");
			// Set confirm box to green.
			$("div#confirmBox").css("background-color", "#66ff66");
			$("div#confirmBox").css("border-style", "solid");
			$("div#confirmBox").css("border-width", "2px");
			$("div#confirmBox").css("border-color", "black");
		}
	});
}

// Add marker to the destination location.
function addMarker(myLat, myLng)
{
	var location = new google.maps.LatLng({lat: myLat, lng: myLng});
	// Erase old marker.
	map_marker.setMap(null);
	// Define options for my marker.
	var markerOptions = {
		map: map,
		title: "Destination",
		position: location,
		visible: true,
//		icon: "./assets/..."
	};
	// Create user's marker object and
	// update global "map_marker"
	// with the marker object.
	map_marker = new google.maps.Marker(markerOptions);
	// Create an info window
	// for user's marker and update
	// global "map_infoWindow" variable.
	map_infoWindow = new google.maps.InfoWindow({
		content: ("<h3>"+map_marker.getTitle()+"</h3>"+"<p>"+myLat+", "+myLng+"</p>")
	});
	// Open the user's info window
	// by default.
	map_infoWindow.open(map,map_marker);
	// Add a click event listener
	// for the user's marker.
	myMarkerClickListener = google.maps.event.addListener(map_marker,"click",function(){
		map_infoWindow.open(map,map_marker);		
	});
	// Center the map on the user's marker.
	// NOTE: This won't work if the info
	// windows for all the markers are opened
	// by default, as they are here.  Comment
	// that line out in order for this to work.
//	map.setCenter(map_marker.getPosition());
	// Add click event listener for info window.
	google.maps.event.addListener(map_infoWindow,"click",function(){
		map_infoWindow.open(map, map_marker);
	});
}






/*

// Check if data was received.
if((ajaxObj.readyState == 4) && (ajaxObj.status == 200))
{
	// Parse data from JSON file.
	var parsedData = JSON.parse(ajaxObj.responseText);
	// Call function to add markers for
	// the rest of the class.
	addClassMarkers(parsedData);
}

*/