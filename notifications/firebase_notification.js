var admin = require("firebase-admin");


const FirebaseNotification = module.exports = {};

module.exports.sendMessage = function (data) {
  var db = admin.database()
  var userRef = db.ref("notifications").child('/'+data.toUserId).child("messaging")
  userRef.set({
    senderId: ''+data.fromUserId,
    msgId: ''+data._id
  });
}

module.exports.sendNotif = function (data) {
  var db = admin.database()
  var userRef = db.ref("notifications").child('/'+data.userID).child("notification")
  userRef.set({
    notifId: ''+data.notifId
  });
}