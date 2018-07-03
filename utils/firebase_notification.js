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

    IonicNotificationSub.findOne({ userId }).then(sub => {
        if (sub) {
            admin.messaging().sendToDevice(sub.tokens, payload, options)
            .then(function(response) {
                console.log('Successfully sent message:', response);
            })
            .catch(function(error) {
                console.log('Error sending message:', error);
            });
        }
    });

}
