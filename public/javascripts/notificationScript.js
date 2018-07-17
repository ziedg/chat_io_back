var Profile = require("./../../models/Profile");
var Publication = require('./../../models/Publication');
var Notification = require("./../../models/Notification");
var FirebaseNotification = require("../../notifications/firebase_notification");
var FirebasePushNotification = require("../../utils/firebase_notification.js")
var _ = require('lodash');

module.exports = {
  notifier: async function (profileId, publId, userID, type, raisonDelete) {
    if (profileId == userID) return;

    //always do this..
    if (publId) {
      const publication = await Publication.findById(publId);
      var content = {};
      if (publication.publText) {
        content.text = publication.publText.slice(0, 20);
        content.type = 'text'

      } else if (publication.publExternalLink) {
        content.link = publication.publExternalLink
        content.type = "link"
      } else {

        content.link = publication.publPictureLink
        content.type = "pictureLink"

      }


      console.log(content)

    }

    if (type == "reagir") {
      var critere = {
        profileId,
        publId: publId,
        type
      };





      Notification.findOne(critere, async function (err, notification) {
 if (err) {
          console.log('there is an error');
        } else if (!notification) {

          console.log("! notif")







          var notification = new Notification();
          notification.profileId = profileId;
          notification.publId = publId;
          notification.date_notification = new Date();
          notification.type = type;
          notification.publText = content.text;
          notification.publType = content.type;


          notifData = {
            userID: notification.profileId,
            notifId: notification._id,
            title: 'Speegar',
            body: 'reagir'
          };
          FirebaseNotification.sendNotif(notifData);
          //profile of the owner of the pub
          Profile.findById(profileId)
            .then(p => {
              if (!p) return;

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





              for (let id of users) {
                if (String(id) == String(profile._id)) {
                  isExist = true;
                }
              }





               
              Profile.findById(profileId)
              .then(p => {
                if (!p) return;
                
                p.nbNotificationsNotSeen++;
                p.save();

              })
              if (!isExist ) {

              


              
             
                notification.profiles.push(profile);
                notification.isSeen = "false";
                notification.publText = content.text,
                  notification.publType = content.type,

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
          notification.publText = content.text;
          notification.publType = content.type;
          notification.type = type;
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

          Profile.findById(userID, function (err, profile) {
            if (err) {
              console.log(err);
            } else if (profile) {

              notification.profiles.push(profile);
              notification.isSeen = "false";
              notification.publText = content.text;
              notification.publType = content.type;
              notification.date_notification = new Date();
              notification.save();
              profile.save();
            }
          });
        } else {

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


             
            
              
             

              if (!isExist) {
                Profile.findById(profileId)
                .then(p => {
                  if (!p) return;

                  
               
                  p.nbNotificationsNotSeen++;
                  p.save();

                })




                notification.profiles.push(profile);
                notification.isSeen = "false";
                notification.date_notification = new Date();
                notification.publText = content.text;
                notification.publType = content.type;
                notification.save();
              } else {
                
                  Profile.findById(profileId)
                .then(p => {
                  if (!p) return;

                  if(p.nbNotificationsNotSeen ==0)
                  { p.nbNotificationsNotSeen++;
                  p.save();
                  }

                })

                
                notification.isSeen = "false";
                notification.date_notification = new Date();
                notification.save();
              }
            }
          });




        }






      });
    } else if (type == "message") {




      var critere = {
        profileId: profileId,
        type: type,
        toProfileId: userID
      };
      Notification.findOne(critere, function (err, notification) {
        if (err) {
          console.log(err)
        }

        if (!notification) {

          console.log('cas ot notification')
          var notification = new Notification();
          notification.profileId = profileId;
          notification.toProfileId = userID;
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
                pr.nbMessgeNotifcationNotSeen++;
                pr.save();
              }
            });
          });
        } else {
          if (notification.isSeen == 'true') {
            notification.date_notification = new Date();
            notification.isSeen = "false";
            notification.save();
            Profile.findById(profileId, function (err, pr) {
              if (pr) {






 pr.nbMessgeNotifcationNotSeen++;
                pr.save();

              }
            });






          } else {
            Profile.findById(profileId, function (err, pr) {
              if (pr) {




                const user = notification.profiles.map(item => String(item._id));



                if (!_.includes(user, String(userID))) {
                  pr.nbMessgeNotifcationNotSeen++;
                  pr.save();
                }
              }
            });

          }











        }


        notifData = {
          userID: notification.profileId,
          notifId: notification._id,
          title: 'Speegar',
          body: 'message'
        };

        FirebaseNotification.sendNotif(notifData);


        FirebasePushNotification.sendNotif(notifData);


      })
    }



    //type subscribe
    else {
      var critere = {
        profileId: profileId,
        type: type,
        toProfileId: userID,

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
          notification.toProfileId = userID
          notification.date_notification = new Date();
          notification.type = type;

          notifData = {
            userID: notification.profileId,
            notifId: notification._id,
            title: 'Speegar',
            body: 'subscribe'
          };
          FirebaseNotification.sendNotif(notifData);

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
        } else {

          notifData = {
            userID: notification.profileId,
            notifId: notification._id,
            title: 'Speegar',
            body: 'subscribe'
          };

          Profile.findById(profileId)
          .then(p => {

          

            p.nbNotificationsNotSeen++;
            p.save();

          })
          FirebaseNotification.sendNotif(notifData);
          FirebasePushNotification.sendNotif(notifData);

          var db = admin.database()
          var userRef = db.ref("inotifs").child('/' + notifData.userID)
          userRef.set(notifData);
          Profile.findById(userID).then((p) => {
            if (notification.profiles.length == 0)
              notification.profiles.push(p);
            notification.isSeen = "false";
            notification.date_notification = new Date();

            notification.save();

          })





       
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
        return;

      } else {




        if (type == 'message') {

          Profile.findById(profileId, function (err, pr) {
            if (pr) {
              if (pr.nbMessgeNotifcationNotSeen > 0) {
                pr.nbMessgeNotifcationNotSeen--;
                pr.save();
              }
            }
          });


        }
        //notifcation length >=1;
        // if (notification.profiles.length >= 1) {
        //   for (i = 0; i < notification.profiles.length; i++) {
        //     if (notification.profiles[i].id == userID) {
        //       notification.profiles.splice(i, 1);
        //       notification.save();
        //       return;
        //     }
        //   }
        // }

      }
    });



    Profile.findById(profileId, function (err, pr) {
      if (pr) {

        console.log("remove")
        console.log(pr.firstName)
        if (pr.nbNotificationsNotSeen > 0) {

          console.log(pr.nbNotificationsNotSeen);
          pr.nbNotificationsNotSeen--;
          pr.save();
        }
      }
    });
  }
};