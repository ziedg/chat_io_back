var express = require('express');
var router = express.Router();
var Message = require('../models/Message');
var Profile = require('../models/Profile')
var Notification = require('../models/Notification');
var PropertiesReader = require('properties-reader');
var properties = PropertiesReader('./properties.file');
var jwt = require('jsonwebtoken');
var notificationScript = require("../public/javascripts/notificationScript");
const NotificationSub = require("../models/NotificationSubsciption.js");
var _ = require("lodash");
const webPusher = require("../utils/web_push.js");

var FirebaseNotification = require('../notifications/firebase_notification');

// route middleware to verify a token
require('../middlewars/auth')(router);


router.route('/messages/:_id').get(function (req, res) {
    var _id = req.params._id;
    Message.getMessage(_id, (err, message) => {
        if (err) {
            return res.json({
                status: 3,
                error: 'SP_ER_TECHNICAL_ERROR'
            });
        }
        res.json(message);
    });
});

router.route('/messages').get(function (req, res) {
    var limit = req.query.limit;
    var page = req.query.page;
    Message.getMessagesList((err, messages) => {
        if (err) {
            return res.json({
                status: 3,
                error: 'SP_ER_TECHNICAL_ERROR'
            });
        }
        res.json(messages);
    }, limit, page);
});


router.route('/messages/:fromUser/:toUser/:id?').get(async function (req, res) {
    var fromUser = req.params.fromUser;
    var toUser = req.params.toUser;
    var firstMessageSentId=req.params.id;
   
    try {

         //search for the user 
     const profile = await Profile.findById(fromUser);
   
    // await profile.save()


     //Search for the notifcation and mark it as seen
     const notifcation =  await Notification.findOne({profileId:fromUser,toProfileId:toUser})
   
     if(  notifcation &&  notifcation.isSeen=='false')
     {
        profile.nbMessgeNotifcationNotSeen--;
        await profile.save();
        notifcation.isSeen='true';
        await notifcation.save();

     }
        //new logic to just return the 20 last messages and then the 20 before ...
       Message.
       getMessagesIds(fromUser,toUser,async function(err, docs) {
         if (err) {
           console.log(err);
         } else {
            Message.getMessage(docs[docs.length-1], (err, lastMessage) => {
                if (err) {
                }
                if(lastMessage){
                    lastMessage.isSeen = true
                    lastMessage.seenDate = Date.now()
                    lastMessage.save()
                }
            });
           docs = docs.map(function(doc) {
             return String(doc._id);
           });

           index = _.indexOf(docs, String(firstMessageSentId)) ;
           console.log(index)
               if (index === -1){
                let index2= docs.length-20 >= 0 ? docs.length-20 : 0;
                let results = await Message.getMessages(fromUser,toUser,index2)
                return res.json(results)
                }else {
                    console.log('! index ==-1')
            
                let index2= index-20 > 0 ? index-20 : 0;
                let results = 
                index2 !== 0 ? 
                await Message.getMessages(fromUser,toUser,index2) :
                await Message.getMessages(fromUser,toUser,index2,index)
                return res.json(results)
                }
        }
    }) 

    } catch (e) {
        console.log(e)
        throw new Error("message errror");
    }


});


router.route('/messages').post(function (req, res) {
    var admin = require('../app');
    var message = req.body;

    Message.addMessage(message, (err, message) => {
        if (err) {
            console.log(err)
            return res.json({
                status: 3,
                error: 'SP_ER_TECHNICAL_ERROR'
            });

        }
        FirebaseNotification.sendMessage(message);

        //Ahmed Svp teste mon ici 

        //debut

        notificationScript.notifier(
            message.toUserId,
            "",
            message.fromUserId,
            "message",
            ""
        );


        NotificationSub.findOne({
            userId: message.toUserId
        }).then(sub => {
            Profile.findById(message.fromUserId).then(profile => {
                let subscriptions = [];
                _.forEach(sub.subsciptions, sub => {
                    subscription = {
                        endpoint: sub.endpoint,
                        keys: {
                            auth: sub.keys.auth,
                            p256dh: sub.keys.p256dh
                        }
                    };
                    subscriptions.push(subscription);
                });



                const payload = {
                    title: "Speegar",
                    icon: profile.profilePictureMin,
                    tag: 'msg',

                    body: `${profile.lastName} ${
                      profile.firstName
                    }   ${message.message.length<50?message.message:message.message.substring(0, 100)+'...'}`
                };
                return webPusher(subscriptions, payload, res);
            });
        });

        //fin
        res.json(message);
    });
});

//Delete Message

router.route('/messages').delete(function (req, res) {
    var id = req.body._id;
    Message.removeMessage(id, (err, message) => {
        if (err) {
            return res.json({
                status: 3,
                error: 'SP_ER_TECHNICAL_ERROR'
            });
        }
        res.json(message);
    });
});

//Update Message
router.route('/messages/:_id').put((req, res) => {
    var id = req.params._id;
    Message.seeMessage(id, (err, message) => {
        if (err) {
            return res.json({
                status: 3,
                error: 'SP_ER_TECHNICAL_ERROR'
            });
        }
        res.json(message);
    });
});

//Suggestions. Subscribers that dosen't have previous conversation with me
router.route('/suggestions/:_id').get(async (req, res) => {
    var id = req.params._id;
    const messages = await (Message.haveConversation(id))
    if (messages.length > 0) {
        let HistoryIds = [];
        messages.forEach(message => {
            if (message.fromUserId == id) HistoryIds.push(message.toUserId)
            else HistoryIds.push(message.fromUserId)
        });

        //enlever les redondances dans le tableau
        _.uniqBy(HistoryIds, function (element) {
            element.toString()
        })
        Profile.findOne({
            _id: id
        }, (err, profile) => {
            if (err) {
                return res.json({
                    status: 3,
                    error: 'SP_ER_TECHNICAL_ERROR'
                });
            }
            var suggestions = profile.subscribersDetails.slice();

            suggestions = suggestions.filter(suggestion =>
                !HistoryIds.some(histId => histId.toString() === suggestion._id.toString())
            )
            return res.json(suggestions)

        });
    } else {
        Profile.findOne({
            _id: id
        }, (err, profile) => {
            if (err) {
                return res.json({
                    status: 3,
                    error: 'SP_ER_TECHNICAL_ERROR'
                });
            }

            return res.json(profile.subscribersDetails)
        })

    }




});

//History 
router.route('/messagingHistory/:_id').get(async (req, res) => {
    var id = req.params._id;
    const messages = await (Message.haveConversation(id))
    if (messages.length > 0) {

        let HistoryIds = [];
        messages.forEach(message => {
            if (message.fromUserId == id) HistoryIds.push(message.toUserId)
            else HistoryIds.push(message.fromUserId)
        });
        //enlever les redondances dans le tableau
        _.uniqBy(HistoryIds, function (element) {
            element.toString()
        })

        Profile.find({
            _id: {
                $in: HistoryIds
            }
        }, async (err, profiles) => {
            if (err) {
                return res.json({
                    status: 3,
                    error: 'SP_ER_TECHNICAL_ERROR'
                });
            }

            var results = profiles.map(async (profile) => {
                let conversation = await (Message.getAllMessagesBetween(id, profile._id));
                let lastMessage = conversation[conversation.length - 1];
                return {
                    _id: profile._id,
                    firstName: profile.firstName,
                    lastName: profile.lastName,
                    profilePicture: profile.profilePicture,
                    lastMessage: lastMessage
                }
            })
            let finalProfiles = await Promise.all(results);
            return res.json(finalProfiles);
        })
    } else return res.json([]);

});


module.exports = router;