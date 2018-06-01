
const keys = require('./config/keys.js');
const webPush = require('web-push');
module.exports =  (subscription,{title,body,icon},res)=> {
   

   const vapidKeys = keys.VAPIDKEYS;
  
    webPush.setVapidDetails(
        'mailto:ziedsaidig@gmail.com',
        vapidKeys.publicKey,
        vapidKeys.privateKey
    );

     const  payload = {
        "notification": {
            "title": title,
            "body": body,
            "icon":icon,
             "vibrate": [100, 50, 100],
             "data": {
                "dateOfArrival": Date.now(),
                "primaryKey": 1
            },
            
        }


    };

    webPush.sendNotification(
        subscription
      , JSON.stringify(payload) )
      .then(() => res.status(200).end({message: "notification sent succussfully"}))
      .catch(err => {
             console.error("Error sending notification, reason: ", err);
             return  res.status(500).end({message:"error occured push notification"});
      })




}