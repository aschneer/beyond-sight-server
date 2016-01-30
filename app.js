var express = require('express');
var bodyParser = require('body-parser');
var multer = require('multer'); // v1.0.5
var upload = multer(); // for parsing multipart/form-data
var app = express();

app.set('port', (process.env.PORT || 5000));

app.use(express.static(__dirname));
app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded

// Routes:
app.get('/', function(req,res) {

//	res.sendFile('./static/index.html',{root: __dirname});
	res.status(200).send('<span><h2>Latitude = ' + req.query.lat + '</h2></span>' + '<span><h2>Longitude = ' + req.query.lng + '</h2></span>');

});

// Run app:
app.listen(app.get('port'), function() {
	console.log('Node app is running on port', app.get('port'));
});