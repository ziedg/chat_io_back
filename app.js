
var express = require('express'); 
var bodyParser = require('body-parser');
var jwtScript = require('./public/javascripts/jwtScript');
var path = require('path');
var passport = require('passport');
var flash    = require('connect-flash');
var https = require('https');
var http = require('http');
var fs = require('fs');


var PropertiesReader = require('properties-reader');
var properties = PropertiesReader('properties.file');



//configure socket.io and express server

const app = express();
const server = http.createServer(app);
const io = require('socket.io')(server);
require('./sockets/notification.js')(io);


//includes the middlewars
app.use(bodyParser.urlencoded());
app.use(bodyParser.json({limit: '50mb'}));
app.use(express.static(path.join(__dirname,'public')));


//requieres the application models
var Abonnee = require('./models/Profile');
var Publication = require('./models/Publication');
var Notification = require('./models/Notification');


	// required for passport
	//app.use(express.session({ secret: 'ilovescotchscotchyscotchscotch' })); // session secret
	app.use(passport.initialize()); 
	app.use(passport.session()); // persistent login sessions
	app.use(flash()); // use connect-flash for flash messages stored in session


// connection to mongoose database
var mongoose = require('mongoose');
mongoose.connect(`mongodb://${properties.get('mongo.url')}/${properties.get('mongo.db.name')}`);

var db =mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
    console.log("connect to MongoDB Successfullllly!")
});


app.use(function(req, res, next) { 
	res.header('Access-Control-Allow-Origin', "*");
	res.header('Access-Control-Allow-Methods','GET, POST, OPTIONS, PUT, PATCH, DELETE');
	res.header('Access-Control-Allow-Headers', "*");
	// Request headers you wish to allow
	res.setHeader('Access-Control-Allow-Headers', 'content-type,x-access-token');

	// Set to true if you need the website to include cookies in the requests sent
	// to the API (e.g. in case you use sessions)
	res.setHeader('Access-Control-Allow-Credentials', true);



	next();
	//jwtScript.JWT(req, res, next);
})


/*

app.use(function(req, res, next) {
    jwtScript.JWT(req, res, next);
});*/


// ROUTES FOR OUR API
//============================================

var router = require('./routes/signRouter');
app.use('/', router);

var router = require('./routes/CommentRouter');
app.use('/', router);

var router = require('./routes/publicationRouter'); 
app.use('/', router);

var router = require('./routes/ProfileRouter');
app.use('/', router);

var router = require('./routes/NotificationRouter');
app.use('/', router);


// START SERVER
//============================================
//cron 
var cronJob =require('./helpers/PopularProfiles');
var https_port = properties.get('server.port.https');
var http_port = properties.get('server.port.http');

	

if(properties.get('ssl.enable')){
	https.createServer({
		key: fs.readFileSync(properties.get('ssl.privkey1').toString()),
		cert: fs.readFileSync(properties.get('ssl.fullchain1').toString()),
		ca: fs.readFileSync(properties.get('ssl.chain1').toString())
	}, app).listen(https_port);
} else {
	server.listen(http_port);
	//app.listen(3000);
	console.log('the server is launched on the port ' + http_port+', mode ssl is disabled, '+new Date());
}
module.exports = app;

