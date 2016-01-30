// For easier server coding.
var express = require('express');
// For parsing JSON.
var bodyParser = require('body-parser');
// ?
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

// Route to store new lat/lng values in database.
app.post('/newdestination', function(req,res) {

	// Retrieve URL query parameters.
	var input = req.body;

	// Grab current time.
	t = new Date();
	t = new Date(t.getTime());
	t = t.toJSON();

	// Prepare new data for insertion
	// into database (upsert).
	var newDoc = {id: input.timestamp, lat: input.lat, lng: input.lng, created_at: t};
	// Open the "locations" collection.
	db.collection("destinations", function(err,coll) {
		if(err === null) {
			// Perform upsert on data provided by user.
			coll.updateOne({id: input.timestamp}, newDoc, {upsert: true, w: 1}, function(err,result){
				if(err === null) {
					// Read document that was just inserted
					// and return it to the client.
					coll.findOne({id: input.timestamp}).toArray(function(err,doc){
						if(err === null) {
							res.set("Content-Type","application/json");
							res.status(200);
							res.json({
								html: ('<span><h2>Latitude = ' + doc.lat + '</h2></span>' + '<span><h2>Longitude = ' + doc.lng + '</h2></span>'),
								success: true,
								lat: doc.lat,
								lng: doc.lng,
								id: doc.id,
								created_at: doc.created_at
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
});

// Route to print entire database to HTML page.
app.get("/dbcontents",function(req,res){
	db.collection("destinations", function(err,coll) {
		if(err === null) {
			coll.find().toArray(function(err,docs) {
				if(err === null) {
					res.set("Content-Type","application/json");
					res.status(500);
					res.json(docs);
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
						res.send("Success: Database cleared."); {
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