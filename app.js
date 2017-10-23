var express = require('express'); // call express
var app = express(); // define our app using express
var bodyParser = require('body-parser');
var jwtScript = require('./public/javascripts/jwtScript');
var path = require('path');
var passport = require('passport');
var flash    = require('connect-flash');

var http = require('http');
var https = require('https');
var fs = require('fs');

app.use(bodyParser.urlencoded());
app.use(bodyParser.json({limit: '50mb'}));



var Abonnee = require('./models/Profile');
var Publication = require('./models/Publication');
var Notification = require('./models/Notification');


	// required for passport
	//app.use(express.session({ secret: 'ilovescotchscotchyscotchscotch' })); // session secret
	app.use(passport.initialize()); 
	app.use(passport.session()); // persistent login sessions
	app.use(flash()); // use connect-flash for flash messages stored in session

                                                    

// connect to our database with mongoose
var mongoose = require('mongoose');
var db = mongoose.connect('mongodb://127.0.0.1/SpeegarDB');


// ROUTES FOR OUR API
// ============================================================================

app.use(function(req, res, next) { 
	res.header('Access-Control-Allow-Origin', "*");
	res.header('Access-Control-Allow-Methods','GET,POST'); 
	res.header('Access-Control-Allow-Headers', 'Content-Type,Accept,token'); 
	next();
	//jwtScript.JWT(req, res, next);
})

var router = require('./routes/signRouter');
app.use('/', router);

	

/*
app.use(function(req, res, next) {
    jwtScript.JWT(req, res, next);
});*/

var router = require('./routes/CommentRouter');
app.use('/', router);

var router = require('./routes/publicationRouter'); 
app.use('/', router);

var router = require('./routes/ProfileRouter');
app.use('/', router);

var router = require('./routes/NotificationRouter');
app.use('/', router);

// START THE SERVER
// =============================================================================


var http_port = 3000;
var https_port = 3005;

http.createServer(function(req, res) {
	res.writeHead(301, {"Location": "https://" + req.headers['host'] + req.url});
	res.end();
}).listen(http_port);

https.createServer({ 
        key: fs.readFileSync("/etc/letsencrypt/archive/speegar.com/privkey1.pem"),
        cert: fs.readFileSync("/etc/letsencrypt/archive/speegar.com/fullchain1.pem"),
        ca: fs.readFileSync("/etc/letsencrypt/archive/speegar.com/chain1.pem")
}, app).listen(https_port);
