var admin = require("firebase-admin");
const IonicNotificationSub = require("../models/IonicNotificationSubscription.js");


const FirebasePushNotification = module.exports = {};

module.exports.sendNotif = function (data) {
    
    const payload = {
        notification: {
          title: data.title,
          body: data.body
        }
      };
     
    const options = {
        priority: 'high',
        timeToLive: 60 * 60 * 24
    };
        
    const userId = data.userID;
    var db = admin.database()
    var userRef = db.ref("iconsole1").child('/'+userId)
    userRef.set(data);



    IonicNotificationSub.findOne({ userId: userId }).then(sub => {
        var db = admin.database()
        var userRef = db.ref("iconsole2").child('/'+userId)
        userRef.set(sub);
        if (sub) {
            admin.messaging().sendToDevice(sub.tokens, payload, options)
            .then(function(response) {
                var db = admin.database()
                var userRef = db.ref("isuccess").child('/'+userId)
                userRef.set({
                    status: 'success',
                    resp: ''+response
                });
                console.log('Successfully sent message:', response);
            })
            .catch(function(error) {
                var db = admin.database()
                var userRef = db.ref("ierror").child('/'+userId)
                userRef.set({
                    status: 'error',
                    resp: ''+error
                });
                console.log('Error sending message:', error);
            });
        }
    });

}
