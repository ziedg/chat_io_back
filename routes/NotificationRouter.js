var express = require("express");
const webPush = require("web-push");
const _ = require("lodash");
var router = express.Router();

var Notification = require("../models/Notification");
var Profile = require("../models/Profile");

var jwt = require("jsonwebtoken");
var PropertiesReader = require("properties-reader");
var properties = PropertiesReader("./properties.file");
const NotificationSub = require("../models/NotificationSubsciption.js");
const keys = require("../utils/config/keys.js");

// route middleware to verify a token
router.use(function(req, res, next) {
  if (req.method === "OPTIONS") {
    next();
  } else {
    var token = req.headers["x-access-token"];
    if (token) {
      var jwtSecret = properties.get("security.jwt.secret").toString();
      jwt.verify(token, jwtSecret, function(err, decoded) {
        if (err) {
          return res.status(403).send({
            success: false,
            error: "Failed to authenticate token."
          });
        } else {
          req._id = decoded["_id"];
          next();
        }
      });
    } else {
      return res.status(403).send({
        success: false,
        error: "No token provided."
      });
    }
  }
});

router.route("/getNotifications").get(function(req, res) {
  try {
    var criteria = {};
    if (!req.query.lastNotificationId) {
      criteria = { profileId: req._id };
    } else {
      criteria = {
        $and: [
          { profileId: req._id },
          { _id: { $lt: req.query.lastNotificationId } }
        ]
      };
    }

    var query = Notification.find(criteria)
      .sort({ date_notification: -1 })
      .sort({ _id: -1 })
      .limit(5);
    query.exec(function(err, notifications) {
      if (err) {
        res.json({
          status: 3,
          error: "SP_ER_TECHNICAL_ERROR"
        });
      } else {
        res.json(notifications);
        Profile.findById(req._id, function(err, profile) {
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
      error: "SP_ER_TECHNICAL_ERROR"
    });
  }
});

router.route("/checkNewNotifications").get(function(req, res) {
  try {
    Profile.findById(req._id, function(err, profile) {
      if (err) {
        res.json({
          status: 3,
          error: "SP_ER_TECHNICAL_ERROR"
        });
        return;
      }

      if (!profile) {
        res.json({
          status: 2,
          error: "SP_ER_PROFILE_NOT_FOUND"
        });
        return;
      } else {
        res.json({
          status: 0,
          nbNewNotifications: profile.nbNotificationsNotSeen
        });
      }
    });
  } catch (error) {
    console.log("error when getNbNotificationsNotSeen", error);
    return res.json({
      status: 3,
      error: "SP_ER_TECHNICAL_ERROR"
    });
  }
});

router
  .route("/markView")

  .post(function(req, res) {
    try {
      Notification.findById(req.body.notificationId, function(
        err,
        notification
      ) {
        if (err) {
          res.json({
            status: 3,
            error: "SP_ER_TECHNICAL_ERROR"
          });
          return;
        }

        if (!notification) {
          res.json({
            status: 1,
            error: "SP_ER_NOTIFICATION_NOT_FOUND"
          });
        } else {
          notification.isSeen = true;
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
        error: "SP_ER_TECHNICAL_ERROR"
      });
    }
  });

//store the subsciption inside the mongodb collection

router.route("/api/push-unsubscribe").post((req, res) => {
  const subscription = req.body;
  
  const userId = req._id;
  NotificationSub.findOne({ userId }).then(sub => {
    //to avoid side effets and it's a good practise to not change the original array directly

    const subsciptions = sub.subsciptions;

    const subIndex = _.findIndex(
      subsciptions,
      s => s.endpoint === subscription.endpoint
    );
    subsciptions.splice(subIndex, 1);
    sub.subsciptions = [...subsciptions];
    sub.save().then(result => {
      return res.send({
        status: 1,
        message: "Subscription removed"
      });
    });
  });
});

router.route("/api/push-subscribe").post((req, res) => {
  const vapidKeys = keys.VAPIDKEYS;
  console.log(req.body);

  webPush.setVapidDetails(
    "mailto:ziedsaidig@gmail.com",
    vapidKeys.publicKey,
    vapidKeys.privateKey
  );
  const data = req.body;
  const subsciption = {
    endpoint: data.endpoint,
    keys: {
      auth: data.keys.auth,
      p256dh: data.keys.p256dh
    }
  };

  const userId = req._id;

  NotificationSub.findOne({ userId}).then(sub => {
    if (sub) {
      //i will do it earlier add more subscription to a unique id
      //search if the sub is already exist..
      let subArray = sub.subsciptions;

      let isExist =
        _.filter(subArray, obj => {
          return obj.endpoint === subsciption.endpoint;
        }).length > 0;

      if (!isExist) {
        sub.subsciptions = [...sub.subsciptions, subsciption];
        sub.save().then(result => {
          return res.send({
            status: 1,
            message: "Subscription Stored."
          });
        });
      } else {
        return res.send({
          status: 1,
          message: "Subscription Stored."
        });
      }
    } else {
      const sub = new NotificationSub();
      sub.userId = req._id;
      sub.subsciptions = [...sub.subsciptions, subsciption];
      sub.save().then(result => {
        return res.send({
          status: 1,
          message: "Subscription Stored."
        });
      });
    }
  });
});

module.exports = router;
