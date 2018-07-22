var Profile = require("./../../models/Profile");
var Publication = require('./../../models/Publication');
var Notification = require("./../../models/Notification");
var FirebaseNotification = require("../../notifications/firebase_notification");
var FirebasePushNotification = require("../../utils/firebase_notification.js")
var _ = require('lodash');

module.exports = {
  notifier: async function (profileId, publId, userID, type, raisonDelete) {

    var globalRemove = false;
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
              notification.isActive='false'

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





              if(notification.isActive=='true')
              {
              notifData = {
                userID: notification.profileId,
                notifId: notification._id,
                title: 'Speegar',
                body: 'reagir'
              };
              FirebaseNotification.sendNotif(notifData);
              FirebasePushNotification.sendNotif(notifData);
            }

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
                 
                  p.nbNotificationsNotSeen += 1;
                  p.save();




                })
              if (!isExist) {

            






                notification.profiles.push(profile);
                notification.isSeen = "false";
                notification.isActive='false'
                notification.publText = content.text,
                  notification.publType = content.type,

                  notification.date_notification = new Date();
                notification.save();
                profile.save();
              } else {
              


                  
                notification.isSeen = "false";
                notification.isActive='false'
                notification.date_notification = new Date();
                notification.save();
              }
            }
          });



        }





      });


    } else if (type == 'joindre') {
      Notification.findOne(critere, function (err, notification) {
        if (err) {
          console.log(err);
        } else {
          var notification = new Notification();
          notification.profileId = profileId;
          notification.date_notification = new Date();
          notification.type = type;


          Profile.findById(userID, function (err, profile) {
            if (err) {
              console.log(err);
            } else if (profile) {

              notification.profiles.push(profile);
              notification.isSeen = "false";
              notification.save();
              profile.save();
            }
          });
          Profile.findById(profileId)
            .then(p => {
              if (!p) return;


              p.nbNotificationsNotSeen++;
              p.save();


            })
          notifData = {
            userID: notification.profileId,
            notifId: notification._id,
            title: 'Speegar',
            body: 'facebook rejoindre'
          };
          FirebaseNotification.sendNotif(notifData);
          FirebasePushNotification.sendNotif(notifData);




        }
      })
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
          notification.isActive='false'
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
          Profile.findById(profileId)
          .then(p => {
            if (!p) return;
             p.nbNotificationsNotSeen++;
            p.save();

          })
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
              notification.isActive='false'
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



              if(notification.isActive=='true')
              {

              Profile.findById(profileId)
              .then(p => {
                if (!p) return;
               
               p.nbNotificationsNotSeen++;
                p.save();

              })
              
              FirebaseNotification.sendNotif(notifData);
              FirebasePushNotification.sendNotif(notifData);
            }



              if (!isExist) {
                
               



                notification.profiles.push(profile);
                notification.isSeen = "false";
                notification.date_notification = new Date();
                notification.publText = content.text;
                notification.publType = content.type;
                notification.isActive='false'
                notification.save();
              } else {


                notification.isSeen = "false";
                notification.isActive='false'
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
        


          var notification = new Notification();
          notification.profileId = profileId;
          notification.toProfileId = userID;
          notification.date_notification = new Date();
          notification.type = type;
          notification.isActive = 'false'

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
          notification.date_notification = new Date();
          notification.isActive = 'false'
          notification.save();
          notifData = {
            userID: notification.profileId,
            notifId: notification._id,
            title: 'Speegar',
            body: 'message'
          };

          FirebaseNotification.sendNotif(notifData);


          FirebasePushNotification.sendNotif(notifData);


        } else {

     

          if (notification.isActive == 'true') {
            notification.date_notification = new Date();
            notification.isActive = 'false'
            notification.save();
            notifData = {
              userID: notification.profileId,
              notifId: notification._id,
              title: 'Speegar',
              body: 'message'
            };

            FirebaseNotification.sendNotif(notifData);


            FirebasePushNotification.sendNotif(notifData);
            Profile.findById(profileId, function (err, pr) {
              if (pr) {

                pr.nbMessgeNotifcationNotSeen++;
                pr.save();

              }
            });


          } else {
           // console.log('False');

          }







          //           if (notification.isSeen == 'true') {
          //             console.log('enter seen')
          //             notification.date_notification = new Date();
          //             notification.isSeen = "false";
          //             notification.save();
          //             Profile.findById(profileId, function (err, pr) {
          //               if (pr) {
          //                 console.log('here')






          //  pr.nbMessgeNotifcationNotSeen++;
          //                 pr.save();

          //               }
          //             });






          //           } else {

          //             console.log('enter not seen')
          //             Profile.findById(profileId, function (err, pr) {
          //               if (pr) { const user = notification.profiles.map(item => String(item._id));



          //                 if (!_.includes(user, String(userID))) {
          //                         pr.nbMessgeNotifcationNotSeen++;
          //                            pr.save();
          //                 } 
          //               }
          //             });

          //           }











          //         }
        }





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





              p.nbNotificationsNotSeen += 1;
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


    Profile.findById(profileId, function (err, pr) {
      if (pr) {




 
        console.log(pr.nbMessgeNotifcationNotSeen)
        console.log(type)
        // pr.nbNotificationsNotSeen--;
        // pr.save();

      }
    });
  }
};