var express = require("express");
var bodyParser = require("body-parser");
var jwtScript = require("./public/javascripts/jwtScript");
var path = require("path");
var passport = require("passport");
var flash = require("connect-flash");
var https = require("https");
var http = require("http");
var fs = require("fs");
var cors = require("cors");

var PropertiesReader = require("properties-reader");
var properties = PropertiesReader("properties.file");

const app = express();

//includes the middlewares
app.use(bodyParser.json({ limit: "50mb" }));
app.use(express.static(path.join(__dirname, "public")));
app.use(cors());

//requieres the application models
var Abonnee = require("./models/Profile");
var Publication = require("./models/Publication");
var Notification = require("./models/Notification");

// required for passport
//app.use(express.session({ secret: 'ilovescotchscotchyscotchscotch' })); // session secret
app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions
app.use(flash()); // use connect-flash for flash messages stored in session

// connection to mongoose database
var mongoose = require("mongoose");
mongoose.connect(
  `mongodb://${properties.get("mongo.url")}/${properties.get("mongo.db.name")}`
).then(()=>{
  console.log("connect TO DB...")
})
.catch((e)=>{ console.log("Unable to connect to DB.",e)})


app.use(function(req, res, next) {
  var allowedOrigins = [
    "https://integration.speegar.com",
    "http://localhost:4200"
  ];

  var origin = req.headers.origin;
  if (allowedOrigins.indexOf(origin) > -1) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }

  res.header(
    "Access-Control-Allow-Methods",
    "GET, POST, OPTIONS, PUT, PATCH, DELETE"
  );
  res.header("Access-Control-Allow-Headers", "*");
  // Request headers you wish to allow
  res.setHeader(
    "Access-Control-Allow-Headers",
    "content-type,x-access-token,X-Requested-With"
  );

  // Set to true if you need the website to include cookies in the requests sent
  // to the API (e.g. in case you use sessions)
  res.setHeader("Access-Control-Allow-Credentials", true);

  next();
  //jwtScript.JWT(req, res, next);
});

/*

app.use(function(req, res, next) {
    jwtScript.JWT(req, res, next);
});*/

// ROUTES FOR OUR API
//============================================
var router = require("./routes/signRouter");
app.use("/", router);

var router = require("./routes/CommentRouter");
app.use("/", router);

var router = require("./routes/publicationRouter");
app.use("/", router);

var router = require("./routes/ProfileRouter");
app.use("/", router);

var router = require("./routes/NotificationRouter");
app.use("/", router);

var router = require("./routes/MessageRouter");
app.use("/", router);


// START SERVER
//============================================
//cron





  admin = require("firebase-admin");

  var serviceAccount = require("./speegar-6deca-firebase-adminsdk-wsx66-e216c5663c.json");

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://speegar-6deca.firebaseio.com"
  });

  // cron
  if (process.env.pm_id == 0) {
    require("./helpers/PopularProfiles");
  }


var http_port = properties.get('server.port.http');

if (properties.get("ssl.enable")) {
  server = https.createServer(
      {
        key: fs.readFileSync(properties.get("ssl.privkey1").toString()),
        cert: fs.readFileSync(properties.get("ssl.fullchain1").toString()),
        ca: fs.readFileSync(properties.get("ssl.chain1").toString())
      },
      app
  );
} else {
  server = http.createServer(app);
}


if('local' == properties.get('server.environment').toString()){

    server.listen(http_port);
    console.log('the server is launched with local environment configuration on the port ' + http_port+ ', '+new Date());
}  else {

    var httpport = parseInt(http_port) + parseInt(process.env.NODE_APP_INSTANCE) ;
    server.listen(httpport);
    console.log('the server is launched on the port ' + httpport +', mode ssl is '+ properties.get("ssl.enable") + ', '+new Date());

}

module.exports = { app, admin };
