// For easier server coding.
var express = require('express');
// For parsing JSON.
var bodyParser = require('body-parser');
// For validating client POST content.
var validator = require("validator");
// For parsing multi-part form data (unused right now).
var multer = require('multer'); // v1.0.5
var upload = multer(); // for parsing multipart/form-data
// Create MongoDB objects.
var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');
// Create Express app.
var app = express();

// Declare location of static files.
app.use(express.static(__dirname + "/public"));

// MongoDB connection URL.
// Start MongoDB server.
var mongoURI = (process.env.MONGOLAB_URI || process.env.MONGOHQ_URL || 'mongodb://localhost:27017/');

// Create MongoDB database object.
var db = MongoClient.connect(mongoURI, function(err, connection) {
	assert.equal(null, err);
	console.log("Database server ready.");
	db = connection;
});

// Set the port for the server to listen on.
app.set('port', (process.env.PORT || 5000));

// MOUNT MIDDLEWARE:
// Middleware are functions that run
// whenever a request is sent to the route "path" specified.
// Middleware is mounted
// with the "app.use()".  The first argument to "app.use()"
// is the route path as a string.  The second argument is
// the function that should run when that route is
// requested.  It's basically like an event handler for
// request routes.  If no path is specified, the
// function runs whenever any request is made to the server.

// Set middleware for parsing JSON.
// This will cause every request body
// to be automatically parsed to JSON.
app.use(bodyParser.json()); // for parsing application/json
// Set same middleware, but for parsing application/x-www-form-urlencoded.
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded
// Middleware to allow cross-origin-resource-sharing (CORS).
// Run whenever any request is made to the server.
app.use(function(req, res, next) {
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
	next();
});

// ROUTES:

// Route to display introductory page.
app.get("/",function(req,res) {
	// Set options for sending file.
	var options = {
		root: __dirname + '/public/',
		headers: {
				'x-timestamp': Date.now(),
				'x-sent': true
		}
	};
	res.set("Content-Type","text/html");
	res.status(200);
	res.sendFile("intro.html", options, function (err) {
    if (err) {
      console.log(err);
      res.status(err.status).end();
    }
    else {
      console.log("Successfully displayed intro page.");
    }
  });
});

// Route to store new lat/lng values in database.
app.post('/newdestination', function(req,res) {
	// Retrieve body parameters.
	var input = req.body;
	// Validate input, and convert to proper data types.
	if(validator.isDate(input.timestamp) && validator.isFloat(input.lat) && validator.isFloat(input.lng)) {
		input.timestamp = validator.toDate(input.timestamp);
		input.lat = validator.toFloat(input.lat);
		input.lng = validator.toFloat(input.lng);
		console.log(input);
/*
		// Grab current time.
		t = new Date();
		t = new Date(t.getTime());
		t = t.toJSON();
*/
		// Prepare new data for insertion
		// into database (upsert).
		var newDoc = {timestamp: input.timestamp, lat: input.lat, lng: input.lng};
		// Open the "locations" collection.
		db.collection("destinations", function(err,coll) {
			if(err === null) {
				// Perform upsert on data provided by user.
				coll.updateOne({timestamp: input.timestamp}, newDoc, {upsert: true, w: 1}, function(err,result){
					if(err === null) {
						// Read document that was just inserted
						// and return it to the client.
						coll.findOne({timestamp: input.timestamp}, function(err,doc){
							if(err === null) {
								res.set("Content-Type","application/json");
								res.status(200);
								res.json({
									html: ('<span><h2>Latitude = ' + doc.lat + '</h2></span>' + '<span><h2>Longitude = ' + doc.lng + '</h2></span>'),
									success: true,
									timestamp: doc.timestamp,
									lat: doc.lat,
									lng: doc.lng,
								});
							}
							else {
								res.set("Content-Type","text/html");
								res.status(500);
								res.send("Database server error: Document not found.");
							}
						});
					}
					else {
						res.set("Content-Type","text/html");
						res.status(500);
						res.send("Database server error: Failed to update document.");
					}
				});
			}
			else {
				res.set("Content-Type","text/html");
				res.status(500);
				res.send("Database server error: Collection not found.");
			}
		});
	}
	else {
		console.log("\n\nInvalid POST input!\n\n");
		res.set("Content-Type","text/html");
		res.status(400);
		res.send("Invalid input to POST request.");
	}
});

// Route to get the most recent destination
// added to the database.  This will be the
// one that the device will navigate the
// user to.  It is very important for there
// to be a unique timestamp on all database
// entries so the latest entry can always be
// determined absolutely.
// The response format will be JSON.
app.get("/getdestination",function(req,res){
	db.collection("destinations", function(err,coll) {
		if(err === null) {
			// Get latest document, determined by
			// timestamp sent from client, not
			// necessarily the time when it was
			// added to the database.
			coll.find().sort({timestamp: -1}).toArray(function(err,docs) {
				if(err === null) {
					// Check if database is empty.
					if(docs.length > 0) {
						res.set("Content-Type","application/json");
						res.status(200);
						res.json({lat: docs[0].lat, lng: docs[0].lng});
					}
					else {
						// Send output string response "Empty".
						res.set("Content-Type","text/html");
						res.status(200);
						res.send("The database is empty.");
					}
				}
				else {
					res.set("Content-Type","text/html");
					res.status(500);
					res.send("Database server error: Failed to query collection.");
				}
			});
		}
		else {
			res.set("Content-Type","text/html");
			res.status(500);
			res.send("Database server error: Collection not found.");
		}
	});
});

// Route to print entire database to HTML page.
app.get("/dbcontents",function(req,res){
	db.collection("destinations", function(err,coll) {
		if(err === null) {
			// Get all documents in the database collection,
			// sorted in descending order by timestamp.
			coll.find().sort({timestamp: -1}).toArray(function(err,docs) {
				if(err === null) {
					// Check if database is empty.
					if(docs.length > 0) {
						// Prepare output string.
						var output = "<style>p#latest{font-weight: bold}</style>";
						output += "<h3>Database Contents:</h3>";
						output += "<div><ul>";
						for (var i = 0; i < docs.length; i++) {
							// Make the most recent entry BOLD.
							if(i == 0) {
								output += "<li><p id='latest'>" + JSON.stringify(docs[i]) + "</p></li>";
							}
							else {
								output += "<li><p>" + JSON.stringify(docs[i]) + "</p></li>";
							}
						};
						output += "</ul></div>";
						// Send output string response.
						res.set("Content-Type","text/html");
						res.status(200);
						res.send(output);
					}
					else {
						// Send output string response "Empty".
						res.set("Content-Type","text/html");
						res.status(200);
						res.send("The database is empty.");
					}
				}
				else {
					res.set("Content-Type","text/html");
					res.status(500);
					res.send("Database server error: Failed to query collection.");
				}
			});
		}
		else {
			res.set("Content-Type","text/html");
			res.status(500);
			res.send("Database server error: Collection not found.");
		}
	});
});

// Route to clear database.
app.get("/dbclear",function(req,res) {
	//Grab route query parameters.
	var input = req.query;
	if(input.pswd === "beyondsight") {
		db.collection("destinations", function(err,coll) {
			if(err === null) {
				coll.remove({},{},function(err,arg2) {
					if(err === null) {
						res.set("Content-Type","text/html");
						res.status(200);
						res.send("Success: Database cleared.");
					}
					else {
						res.set("Content-Type","text/html");
						res.status(500);
						res.send("Failure: Couldn't remove from collection.");
					}
				});
			}
			else {
				res.set("Content-Type","text/html");
				res.status(500);
				res.send("Failure: Couldn't open database collection.");
			}
		});
	}
	else {
		res.set("Content-Type","text/html");
		res.status(403);
		res.send("Failure: Access denied.");
	}
});


// Run app:
app.listen(app.get('port'), function() {
	console.log('Node app is running on port', app.get('port'));
});