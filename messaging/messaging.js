var admin = require("firebase-admin");

//var serviceAccount = require('./speegar-6deca-firebase-adminsdk-wsx66-e216c5663c.json');

/*
var config = {
    apiKey: "AIzaSyAnCqxH5CTNWksJH6j59jIKjxkVJOyEyIk",
    authDomain: "speegar-6deca.firebaseapp.com",
    databaseURL: "https://speegar-6deca.firebaseio.com",
    projectId: "speegar-6deca",
    storageBucket: "speegar-6deca.appspot.com",
    messagingSenderId: "861552240215"
  };
*/
/*
var init = module.exports = function init(){
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: "https://speegar-6deca.firebaseio.com"
      });
}
*/
admin = require("firebase-admin");
const Messaging = module.exports = {};
module.exports.sendMessage = function (data) {
  var db = admin.database()
  console.log(data.toUserId)
  var userRef = db.ref("messaging").child('/'+data.toUserId)
  userRef.set({
    senderId: ''+data.fromUserId,
    msgId: ''+data._id
  });
}

