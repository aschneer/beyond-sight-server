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

	res.sendFile('./index.html',{root: __dirname});
	
});

// Run app:
app.listen(app.get('port'), function() {
	console.log('Node app is running on port', app.get('port'));
});