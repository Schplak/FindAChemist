var express = require('express');
var fs = require('fs');
var bodyParser = require('body-parser');
var multer = require('multer'); 
var app = express();

//server connection variables
var port = 3000;
var url = "http://192.168.0.2";
var serverAddress = url + ":" + port;

//file and user details variables
var filename = "UserDetails.dat";
var userDetailsArray = [];
var suppliedUsername;
var suppliedPassword;

//function to read username and password array from file
function readUserDataFromFile() {
	//read file "filename" using fs
	fs.readFile('./'+ filename, 'utf8', function (err,data) {
		//if there is an error, print it
		if (err) {
			return console.log(err);
		}
		//put file contents into array
		userDetailsArray = JSON.parse(data);
		//display file load success msg
		console.log("Data loaded successfully from: " + filename);
		//display server listening msg
		console.log(`FindAChemist Server listening on: ${serverAddress}`);
	});	
}

//function to check username and password against userDetails array
function checkUserDetails() {
	//count through the userDetailsArray
	for (x = 0; x > userDetailsArray.length; x++) {
		//if both the username and password match the database, return true
		if ((userDetailsArray.username === suppliedUsername) && (userDetailsArray.password === suppliedPassword)) {
			return true;
		}	
	}
	//if there was no match, return false
	return false;
}

// JSON functions send and read not fully implemented as of yet

readjson = function(req,win) {
  var bodyarr = [];
  req.on('data',function(chunk){
    bodyarr.push(chunk);
  })
  req.on('end',function(){
    var bodystr = bodyarr.join('');
    console.error('READJSON:'+req.url+':'+bodystr);
    var body = JSON.parse(bodystr);
    win && win(body);
  })
}

sendjson = function(res,obj){
	var objstr = JSON.stringify(obj);
	console.error('SENDJSON:'+objstr);
	res.status(200).json(obj);
}

//node.js server functions not fully implemented as of yet
/*
function(res){
    
    console.error('In server')
    var prefix = '/cow/user/'
    app = express()
 	app.use(bodyParser.json());
    var multer=require('multer')
    var upload = multer({ dest: './uploads' }).any();

    app.get(  prefix+'search/:query', search)
    app.post( prefix+':cow/log', log)
    app.post( prefix+'test', test)

    app.listen(3009)
    console.error('Server listening on port 3009')
  }
app.use(bodyParser.json())
app.get('/', (req, res) => res.send(userDetails));
*/

app.listen(port, () => {
	
	console.log(`Loading file data from: ${filename}`);
	readUserDataFromFile();
});


