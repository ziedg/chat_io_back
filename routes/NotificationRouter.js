var express = require('express');
var router = express.Router();

var Notification     = require('../models/Notification');
var Profile = require('../models/Profile');


var jwt = require('jsonwebtoken');
var PropertiesReader = require('properties-reader');
var properties = PropertiesReader('./properties.file');


// route middleware to verify a token
router.use(function(req, res, next) {
	if(req.method === 'OPTIONS'){
		next();
	}else {
		var token = req.headers['x-access-token'];
		if (token) {
			var jwtSecret = properties.get('security.jwt.secret').toString();
			jwt.verify(token, jwtSecret, function (err, decoded) {
				if (err) {
					return res.status(403).send({
						success: false,
						message: 'Failed to authenticate token.'
					});
				} else {
					req._id = decoded['_id'];
					next();
				}
			});
		} else {
			return res.status(403).send({
				success: false,
				message: 'No token provided.'
			});
		}
	}
});


router.route('/getNotifications')
	.get(function(req, res) {
		
		var criteria ={};
		if(!req.query.lastNotificationId){
			criteria = {profileId : req.query.profileId }
		}
		else {
			criteria = { $and: [ {profileId : req.query.profileId } , {_id : { $lt : req.query.lastNotificationId } } ] }
		}
		
		var query = Notification.find(criteria).sort({_id : -1}).limit(5);
		query.execFind(function(err, notifications) {
            if (err)
                res.send(err);
			else{
				res.json(notifications);
				Profile.findById(req.query.profileId, function(err, profile) {
					if(profile){
						profile.nbNotificationsNotSeen=0;
						profile.save();
					}
				});				
				
			}
        });
    });

router.route('/getNbNotificationsNotSeen')
	.get(function(req, res) {
		Profile.findById(req.query.profileId, function(err, profile) {
            if (err){
                res.send(err);
			}
			else if(!profile){
				res.json({
					status: 1,
					message: "profile not found"
				});
			}
			else{
				res.json(
					{nbNotificationsNotSeen : profile.nbNotificationsNotSeen}
				);
				/*profile.nbNotificationsNotSeen=0;
				profile.save();*/
			}
        });
	});

router.route('/setNotificationSeen')
	.post(function(req, res) {
		Notification.findById(req.body.notificationId, function(err, notification) {
            if (err){
                res.send(err);
			}
			else if(!notification){
				res.json({
					status: 0,
					message: "notification not found"
				});
			}
			else{
				notification.isSeen="true";
				notification.save();
				res.json({
					status: 1,
					message : "notification updated"
				});
			}
        });
	});
	
module.exports = router;