var express = require('express');
var router = express.Router();

var Notification = require('../models/Notification');
var Profile = require('../models/Profile');


var jwt = require('jsonwebtoken');
var PropertiesReader = require('properties-reader');
var properties = PropertiesReader('./properties.file');


// route middleware to verify a token
router.use(function (req, res, next) {
    if (req.method === 'OPTIONS') {
        next();
    } else {
        var token = req.headers['x-access-token'];
        if (token) {
            var jwtSecret = properties.get('security.jwt.secret').toString();
            jwt.verify(token, jwtSecret, function (err, decoded) {
                if (err) {
                    return res.status(403).send({
                        success: false,
                        error: 'Failed to authenticate token.'
                    });
                } else {
                    req._id = decoded['_id'];
                    next();
                }
            });
        } else {
            return res.status(403).send({
                success: false,
                error: 'No token provided.'
            });
        }
    }
});


router.route('/getNotifications')
    .get(function (req, res) {
        try {
            var criteria = {};
            if (!req.query.lastNotificationId) {
                criteria = {profileId: req._id}
            }
            else {
                criteria = {$and: [{profileId: req._id}, {_id: {$lt: req.query.lastNotificationId}}]}
            }

            var query = Notification.find(criteria).sort({date_notification :-1}).sort({_id : -1}).limit(5);
            query.exec(function (err, notifications) {
                if (err) {
                    res.json({
                        status: 3,
                        error: 'SP_ER_TECHNICAL_ERROR'
                    });
                }
                else {
                    res.json(notifications);
                    Profile.findById(req._id, function (err, profile) {
                        if (profile) {
                            profile.nbNotificationsNotSeen = 0;
                            profile.save();
                        }
                    });
                }
            });
        } catch (error) {
            console.log("error when get notifications", error);
            return res.json({
                status: 3,
                error: 'SP_ER_TECHNICAL_ERROR'
            });
        }
    });

router.route('/checkNewNotifications')
    .get(function (req, res) {
        try {
            Profile.findById(req._id, function (err, profile) {
                if (err) {
                    res.json({
                        status: 3,
                        error: 'SP_ER_TECHNICAL_ERROR'
                    });
                    return;
                }

                if (!profile) {
                    res.json({
                        status: 2,
                        error: 'SP_ER_PROFILE_NOT_FOUND'
                    });
                    return;
                }
                else {
                    res.json({
                            status: 0,
                            nbNewNotifications: profile.nbNotificationsNotSeen
                        }
                    );
                }
            });
        } catch (error) {
            console.log("error when getNbNotificationsNotSeen", error);
            return res.json({
                status: 3,
                error: 'SP_ER_TECHNICAL_ERROR'
            });
        }
    });

router.route('/markView')

    .post(function (req, res) {
        try {

           
            Notification.findById(req.body.notificationId, function (err, notification) {
                if (err) {
                    res.json({
                        status: 3,
                        error: 'SP_ER_TECHNICAL_ERROR'
                    });
                    return;
                }

                if (!notification) {
                    res.json({
                        status: 1,
                        error: 'SP_ER_NOTIFICATION_NOT_FOUND'
                    });
                }
                else {
                    notification.isSeen=true;
                    notification.save();
                   
                    res.json({
                        status: 1,
                        message: "NOTIFICATION_UPDATED"
                    });
                }
            });
        } catch (error) {
            console.log("error when mark notification view", error);
            return res.json({
                status: 3,
                error: 'SP_ER_TECHNICAL_ERROR'
            });
        }
    });

module.exports = router;