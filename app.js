var express = require('express'); // call express
var app = express(); // define our app using express
var bodyParser = require('body-parser');
var jwtScript = require('./public/javascripts/jwtScript');
var path = require('path');
var passport = require('passport');
var flash    = require('connect-flash');

var https = require('https'),
	fs = require('fs');

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

var port = 3000; // set our port (3000 pour l'integration et 7000 pour la producttion )

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


var secureServer = https.createServer({
	key: fs.readFileSync('/usr/local/ssl/server.key'),
	cert: fs.readFileSync('/usr/local/ssl/server.crt'),
	ca: fs.readFileSync('/usr/local/ssl/ca.crt'),
	requestCert: true,
	rejectUnauthorized: false
}, app).listen(port, function() {
	console.log("Secure Express server listening on port" + port+'  '+new Date());
});
//app.listen(port);