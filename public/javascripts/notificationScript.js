var Profile = require("./../../models/Profile");
var Notification = require("./../../models/Notification");
var FirebaseNotification = require("../../notifications/firebase_notification");
var FirebasePushNotification = require("../../utils/firebase_notification.js")
var admin = require("firebase-admin");

module.exports = {
  notifier: function (profileId, publId, userID, type, raisonDelete) {
    if (profileId == userID) return;
    if (type == "reagir") {
      var critere = {
        profileId,
        publId: publId,
        type
      };
      Notification.findOne(critere, function (err, notification) {
        if (err) {
          console.log(err);
        } else if (!notification) {
          var notification = new Notification();
          notification.profileId = profileId;
          notification.publId = publId;
          notification.date_notification = new Date();
          notification.type = type;
          //profile of the owner of the pub
          Profile.findById(profileId)
            .then(p => {

              p.nbNotificationsNotSeen++;

              p.save();


            })

          Profile.findById(userID, function (err, profile) {
            if (err) {
              
              console.log(err);
            } else if (profile) {

              notification.profiles.push(profile);
              notification.isSeen = "false";

              notification.date_notification = new Date();
              notification.save();

              profile.save();
            }
          });
        } else {


          Profile.findById(userID, function (err, profile) {
            if (err) {
               console.log(err);
            } else if (profile) {
              var users = [];
              users = notification.profiles.map(p => {
                return p._id;
              });


              let isExist = false;
              for (let id of users) {
                if (String(id) == String(profile._id)) {
                  isExist = true;
                }
              }

              if (!isExist) {
                Profile.findById(profileId)
                  .then(p => {
                    p.nbNotificationsNotSeen++;
                    p.save();

                  })
                notification.profiles.push(profile);
                notification.isSeen = "false";
                notification.date_notification = new Date();
                notification.save();
                profile.save();
              } else {

                notification.isSeen = "false";
                notification.date_notification = new Date();
                notification.save();
              }
            }
          });
        }

        notifData = {
          userID: notification.profileId,
          notifId: notification._id,
          title: 'Speegar',
          body: 'reagir'
        };
        FirebaseNotification.sendNotif(notifData);


        FirebasePushNotification.sendNotif(notifData);

        var db = admin.database()
        var userRef = db.ref("inotifs").child('/' + notifData.userID)
        userRef.set(notifData);
      });
    } else if (type == "comment") {
      /* commenter sur un publication */
      var critere = {
        profileId: profileId,
        publId: publId,
        type: type
      };
      Notification.findOne(critere, function (err, notification) {
        if (err) {
          console.log(err);
        } else if (!notification) {
          var notification = new Notification();
          notification.profileId = profileId;
          notification.publId = publId;
          notification.date_notification = new Date();
          notification.type = type;

          Profile.findById(userID, function (err, profile) {
            if (err) {
            console.log(err);
            } else if (profile) {

              notification.profiles.push(profile);
              notification.isSeen = "false";
              notification.date_notification = new Date();
              notification.save();
              profile.save();
            }
          });
        } else {
          Profile.findById(userID, function (err, profile) {
            if (err) {
              /*res.send(err);*/
            } else if (profile) {
              var users = [];
              users = notification.profiles.map(p => {
                return p._id;
              });

              let isExist = false;
              for (let id of users) {
                if (String(id) == String(profile._id)) {
                  isExist = true;
                }
              }

              if(!isExist)
              {
              Profile.findById(profileId)
                .then(p => {
                  p.nbNotificationsNotSeen++;
                  p.save();

                })
              notification.profiles.push(profile);
              notification.isSeen = "false";
              notification.date_notification = new Date();
              notification.save();
              }
             else {
              notification.isSeen = "false";
              notification.date_notification = new Date();
              notification.save();
            }}});

      
        }

        notifData = {
          userID: notification.profileId,
          notifId: notification._id,
          title: 'Speegar',
          body: 'comment'
        };
        FirebaseNotification.sendNotif(notifData);


        FirebasePushNotification.sendNotif(notifData);


        var db = admin.database()
        var userRef = db.ref("inotifs").child('/' + notifData.userID)
        userRef.set(notifData);
      });
    } else if (type == "message") {

      var notification = new Notification();
      notification.profileId = profileId;
      notification.date_notification = new Date();
      notification.type = type;

      Profile.findById(userID, function (err, profile) {
        if (err) {
          /*  don't do anything...	res.send(err);*/
        } else if (profile) {
          notification.profiles.push(profile);
          notification.date_notification = new Date();
          notification.isSeen = "false";
          notification.save();
          profile.save();
        }
        Profile.findById(profileId, function (err, pr) {
          if (pr) {
            pr.nbNotificationsNotSeen++;
            pr.save();
          }
        });
      });

      notifData = {
        userID: notification.profileId,
        notifId: notification._id,
        title: 'Speegar',
        body: 'message'
      };
      FirebaseNotification.sendNotif(notifData);


      FirebasePushNotification.sendNotif(notifData);



      var db = admin.database()
      var userRef = db.ref("inotifs").child('/' + notifData.userID)
      userRef.set(notifData);

    }



    //type subscribe
    else {
      var critere = {
        profileId: profileId,
        type: type
      };
      Notification.findOne(critere, function (err, notification) {
        if (err) {
          /*return res.json({
						status : 0,
						err: err
					});	*/
        }

        if (!notification) {
          var notification = new Notification();
          notification.profileId = profileId;
          notification.date_notification = new Date();
          notification.type = type;

          Profile.findById(userID, function (err, profile) {
            if (err) {
              /*  don't do anything...	res.send(err);*/
            } else if (profile) {
              notification.profiles.push(profile);
              notification.date_notification = new Date();
              notification.isSeen = "false";
              notification.save();

              Profile.findById(profileId)
                .then(p => {
                  p.nbNotificationsNotSeen++;
                  p.save();

                })
            }

          });
        }
      });
    }
  },

  removeNotification: function (profileId, publId, userID, type) {
    let critere = "";
    if (type === "subscribe") {
      critere = {
        profileId,
        type
      };
    } else {
      critere = {
        profileId,
        type,
        publId
      };
    }

    Notification.findOne(critere, function (err, notification) {
      if (err) {
        /*return res.json({
							status : 0,
							err: err
					});*/
      } else if (!notification) {
        return
          /*res.json({
							status : 0,
							message : "notification not found"
					})*/
        ;
      } else {
        if (notification.profiles.length >= 1) {
          for (i = 0; i < notification.profiles.length; i++) {
            if (notification.profiles[i].id == userID) {
              notification.profiles.splice(i, 1);
              notification.save();
              return;
            }
          }
        }
        if (notification.profiles.length == 0 || type === "subscribe") {
          notification.remove();
        }
      }
    });

    Profile.findById(profileId, function (err, pr) {
      if (pr) {
        if (pr.nbNotificationsNotSeen > 0) {
          pr.nbNotificationsNotSeen--;
          pr.save();
        }
      }
    });
  }
};