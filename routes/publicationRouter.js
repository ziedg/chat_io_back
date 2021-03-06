var express = require("express");
var router = express.Router();
var async = require("async");
var ogs = require("open-graph-scraper");
var sizeOf = require("image-size");
ObjectID = require("mongodb").ObjectID;
var sharp = require("sharp");
const fs = require("fs");
const mv = require("mv");
const client = require("scp2");
const webPusher = require("../utils/web_push.js");
const NotificationSub = require("../models/NotificationSubsciption.js");

var bodyParser = require("body-parser");
var multer = require("multer");

var Publication = require("../models/Publication");
var Signal = require("../models/signal");
var Profile = require("../models/Profile");
var PublicationLikes = require("../models/PublicationLikes");
var Comment = require("../models/Comment");
var notificationScript = require("../public/javascripts/notificationScript");
var Notification = require("../models/Notification");

var PropertiesReader = require("properties-reader");
var properties = PropertiesReader("./properties.file");

var app = express();
var path = require("path");

var jwt = require("jsonwebtoken");
const util = require("util");
var _ = require("lodash");

//require save publication function
const saveImage = require("../utils/save_image");

// route middleware to verify a token
require("../middlewars/auth")(router);
router.route("/getOpenGraphData").get(function(req, res) {
  try {
    ogs(
      {
        url: req.query.url,
        timeout: 8000
      },
      function(er, results) {
        res.json({
          results: results
        });
      }
    );
  } catch (error) {
    console.log("error when getOpenGraphData", error);
    return res.json({
      status: 3,
      error: "SP_ER_TECHNICAL_ERROR"
    });
  }
});

router
  .route("/publish")

  .post(function(req, res) {
    try {
      var publication = new Publication();

      var storage = multer.diskStorage({
        destination: function(req, file, callback) {
          callback(null, properties.get("pictures.storage.temp").toString());
        },
        filename: function(req, file, callback) {
          callback(null, publication.id + path.extname(file.originalname));
        }
      });

      var upload = multer({
        storage: storage
      }).fields([
        {
          name: "publPicture",
          maxCount: 2
        }
      ]);

      upload(req, res, function(err) {
        if (err) {
          console.log(err);

          res.json({
            status: 3,
            error: "SP_ER_TECHNICAL_ERROR1"
          });
        } else {
          var body = req.body;

          publication.profileId = req._id;
          publication.datePublication = new Date();
          Profile.findById(req._id, function(err, profile) {
            if (err) {
              res.json({
                status: 3,
                error: "SP_ER_TECHNICAL_ERROR2"
              });
              return;
            }
            if (!profile) {
              res.json({
                status: 2,
                error: "SP_ER_PROFILE_NOT_FOUND"
              });
              return;
            }
            profile.nbPublications++;
            profile.publications.push(publication._id);
            profile.save();
            publication.profileFirstName = profile.firstName;
            publication.profileLastName = profile.lastName;
            publication.profilePicture = profile.profilePicture;
            publication.profilePictureMin = profile.profilePictureMin;

            publication.confidentiality = body.confidentiality;
            publication.nbLikes = 0;
            publication.nbDislikes = 0;
            publication.nbSignals = 0;
            publication.nbComments = 0;
            publication.nbShare = 0;
            publication.isShared = false;
            publication.publTitle = body.publTitle;
            publication.publText = body.publText;
            publication.publClass = body.publClass;
            publication.publyoutubeLink = body.publyoutubeLink;
            publication.publfacebookLink = body.publfacebookLink;
            publication.publfacebookLinkWidth = body.publfacebookLinkWidth;
            publication.publfacebookLinkHeight = body.publfacebookLinkHeight;
            publication.publExternalLink = body.publExternalLink;
            publication.nbFcbkShare = 0;
            publication.nbTwitterShare = 0;

            const response = {
              status: 0,
              message: "PUBLISHED_SUCCESSFULLY",
              publication: publication
            };

            saveImage(publication, req.files.publPicture, res, response, "pub");

            var publicationLikes = new PublicationLikes();
            publicationLikes.save();
            publicationLikes._id = publication._id;
            publication.save();
          });
        }
      });
    } catch (error) {
      console.log("error when getNbNotificationsNotSeen", error);
      return res.json({
        status: 3,
        error: "SP_ER_TECHNICAL_ERROR3"
      });
    }
  });

router.route("/getPublications").get(function(req, res) {
  try {
    var profileQuery = Profile.findOne({
      _id: req._id
    });
    profileQuery.exec(function(err, profile) {
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
      }
      var subscriptions = profile.subscriptions;
      if (!req.query.last_publication_id) {
        var publicationQuery = Publication.find({
          $or: [
            {
              profileId: req._id
            },
            {
              profileId: {
                $in: subscriptions
              }
            }
          ]
        })
          .limit(10)
          .sort({
            _id: -1
          });
      } else {
        var publicationQuery = Publication.find({
          $and: [
            {
              _id: {
                $lt: req.query.last_publication_id
              }
            },
            {
              $or: [
                {
                  profileId: req._id
                },
                {
                  profileId: {
                    $in: subscriptions
                  }
                }
              ]
            }
          ]
        })
          .limit(10)
          .sort({
            _id: -1
          });
      }

      publicationQuery.exec(function(err, publications) {
        if (err) {
          res.json({
            status: 3,
            error: "SP_ER_TECHNICAL_ERROR"
          });
          return;
        }

        async.each(
          publications,
          function(publication, callback) {
            PublicationLikes.findById(publication._id, function(
              err,
              publicationLikes
            ) {
              if (publicationLikes) {
                publication.isLiked =
                  publicationLikes.likes.indexOf(req._id) > -1;
                publication.isDisliked =
                  publicationLikes.dislikes.indexOf(req._id) > -1;
              }
              for (j = 0; j < publication.comments.length; j++) {
                publication.comments[j].isLiked =
                  publication.comments[j].likes.indexOf(req._id) > -1;
                publication.comments[j].isDisliked =
                  publication.comments[j].dislikes.indexOf(req._id) > -1;
              }
              callback();
            });
          },
          function(err) {
            return res.json(publications);
          }
        );
      });
    });
  } catch (error) {
    console.log("error when get publications", error);
    return res.json({
      status: 3,
      error: "SP_ER_TECHNICAL_ERROR"
    });
  }
});

router.route("/likePublication").post(function(req, res) {
  try {
    var publication = new Publication();

    Publication.findById(req.body.publId, function(err, publication) {
      if (err) {
        res.json({
          status: 3,
          error: "SP_ER_TECHNICAL_ERROR"
        });
        return;
      }
      if (!publication) {
        return res.json({
          status: 2,
          error: "SP_ER_PUBLICATION_NOT_FOUND"
        });
      } else {
        PublicationLikes.findById(req.body.publId, function(
          err,
          publicationLikes
        ) {
          if (  publicationLikes.dislikes.indexOf(req._id) == -1  && publicationLikes.likes.indexOf(req._id) == -1) {
            var userInteractions = new Object();
            userInteractions.userId = req.body.profileId;
            userInteractions.profilefirstname = req.body.profilefirstname;
            userInteractions.profilelastname = req.body.profilelastname;
            userInteractions.profilepicture = req.body.profilepicture;

            //console.log('used pushed like'+userInteractions);

            publicationLikes.userlikes.unshift(userInteractions);
            publicationLikes.likes.unshift(req._id);

            publicationLikes.save();

            publication.nbLikes++;
            publication.save();
          }
        });

        res.json({
          status: 0,
          message: "PUBLICATION_LIKED"
        });

        notificationScript.notifier(
    
          publication.profileId,
          req.body.publId,
          req._id,
          "reagir",
          ""
        );

        if (publication.profileId != req._id) {
          Profile.findById(req._id).then(profile => {
            NotificationSub.findOne({ userId: publication.profileId }).then(
             
              sub => {
                if(!sub ) return;
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
                  tag:publication._id,
                  body: `${profile.lastName} ${
                    profile.firstName
                  } a réagi a votre publication`
                };
                return webPusher(subscriptions, payload, res);
              }
            );
          });
        }
        Profile.findById(publication.profileId, function(err, profile) {
          if (!err) {
            profile.nbLikes++;
            profile.save();

            var result = false;
            _.map(profile.likers, function(liker_id) {
              if (String(req.body.profileId) === String(liker_id))
                result = true;
            });
            if (!result) {
              profile.likers.unshift(req.body.profileId);
              profile.save();
            }
          }
        });
      }
    });
  } catch (error) {
    console.log("error when like publication", error);
    return res.json({
      status: 3,
      error: "SP_ER_TECHNICAL_ERROR"
    });
  }
});

router.route("/removeLikePublication").post(function(req, res) {
  try {
    var publication = new Publication();
    Publication.findById(req.body.publId, function(err, publication) {
      if (err) {
        res.json({
          status: 3,
          error: "SP_ER_TECHNICAL_ERROR"
        });
        return;
      }
      if (!publication) {
        return res.json({
          status: 2,
          error: "SP_ER_PUBLICATION_NOT_FOUND"
        });
      } else {
        PublicationLikes.findById(req.body.publId, function(
          err,
          publicationLikes
        ) {
          if (publicationLikes.likes.indexOf(req._id) > -1) {
            publicationLikes.userlikes = publicationLikes.userlikes.filter(
              x => x.userId !== req._id
            );

            var index = publicationLikes.likes.indexOf(req._id);
            publicationLikes.likes.splice(index, 1);
            publicationLikes.save();

            publication.nbLikes--;
            publication.save();
          }
        });
        /*Profile.findById(publication.profileId, function(err, profile) {
          if (!err) {
            profile.nbLikes--;
            profile.save();
          }
        });*/

        notificationScript.removeNotification(
          publication.profileId,
          req.body.publId,
          req._id,
          "reagir"
        );
        return res.json({
          status: 0,
          message: "LIKE_REMOVED"
        });
      }
    });
  } catch (error) {
    console.log("error when remove like publication ", error);
    return res.json({
      status: 3,
      error: "SP_ER_TECHNICAL_ERROR"
    });
  }
});

router.route("/dislikePublication").post( async function(req, res) {
  try {


   
    var publication = new Publication();

    Publication.findById(req.body.publId,  async function(err, publication) {
      if (err) {
        res.json({
          status: 3,
          error: "SP_ER_TECHNICAL_ERROR"
        });
        return;
      }
      if (!publication) {
        return res.json({
          status: 2,
          error: "SP_ER_PUBLICATION_NOT_FOUND"
        });
        return;
      }

      PublicationLikes.findById(req.body.publId,  async   function(
        err,
        publicationLikes
      ) {
        if (  publicationLikes.dislikes.indexOf(req._id) == -1 && publicationLikes.likes.indexOf(req._id)==-1 ) {
          var userInteractions = new Object();
          userInteractions.userId = req.body.profileId;
          userInteractions.profilefirstname = req.body.profilefirstname;
          userInteractions.profilelastname = req.body.profilelastname;
          userInteractions.profilepicture = req.body.profilepicture;

          //console.log('user push dislike'+userInteractions);

          publicationLikes.userdislikes.unshift(userInteractions);
          publicationLikes.dislikes.unshift(req._id);
          publicationLikes.save();

          publication.nbDislikes++;

          publication.save();
        }
      });

      res.json({
        status: 0,
        message: "PUBLICATION_DISLIKED"
      });

      if (publication.profileId != req._id) {

        const profile = await Profile.findById(publication.profileId);
        profile.nbLoves++;
        await profile.save();


     
        Profile.findById(req._id).then(profile => {
          NotificationSub.findOne({ userId: publication.profileId }).then(
            sub => {
              if(! sub) return;
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
                tag:publication._id,
                body: `${profile.lastName} ${
                  profile.firstName
                } a réagi a votre publication`
              };
              return webPusher(subscriptions, payload, res);
            }
          );
        });
      }
      notificationScript.notifier(
        publication.profileId,
        req.body.publId,
        req._id,
        "reagir",
        ""
      );
    });
  } catch (error) {
    console.log("error when dislike publication", error);
    return res.json({
      status: 3,
      error: "SP_ER_TECHNICAL_ERROR"
    });
  }
});

router.route("/removeDislikePublication").post(function(req, res) {
  try {
    var publication = new Publication();

    Publication.findById(req.body.publId, function(err, publication) {
      if (err) {
        res.json({
          status: 3,
          error: "SP_ER_TECHNICAL_ERROR"
        });
        return;
      }
      if (!publication) {
        return res.json({
          status: 2,
          error: "SP_ER_PUBLICATION_NOT_FOUND"
        });
        return;
      }

      PublicationLikes.findById(req.body.publId, async  function(
        err,
        publicationLikes
      ) {
        if (publicationLikes.dislikes.indexOf(req._id) > -1) {
          publicationLikes.userdislikes = publicationLikes.userdislikes.filter(
            x => x.userId !== req._id
          );

          var index = publicationLikes.dislikes.indexOf(req._id);
          publicationLikes.dislikes.splice(index, 1);
          publicationLikes.save();

          publication.nbDislikes--;
          const profile = await Profile.findById(publication.profileId);
          profile.nbLoves--;
          await profile.save();
          publication.save();
        }
      });

      notificationScript.removeNotification(
        publication.profileId,
        req.body.publId,
        req._id,
        "reagir"
      );
      return res.json({
        status: 0,
        message: "DISLIKE_REMOVED"
      });
    });
  } catch (error) {
    console.log("error when remove dislike publication", error);
    return res.json({
      status: 3,
      error: "SP_ER_TECHNICAL_ERROR"
    });
  }
});

router.route("/getInteractions").post(function(req, res) {
  try {
    var publication = new Publication();
    var page = parseInt(req.body.page);

    Publication.findById(req.body.publId, function(err, publication) {
      if (err) {
        res.json({
          status: 3,
          error: "SP_ER_TECHNICAL_ERROR"
        });
        return;
      }
      if (!publication) {
        return res.json({
          status: 2,
          error: "SP_ER_PUBLICATION_NOT_FOUND"
        });
        return;
      }

      PublicationLikes.findById(req.body.publId, async function(
        err,
        publicationLikes
      ) {
        if (publicationLikes && publicationLikes != undefined) {
          var likes = publicationLikes.userlikes.slice(
            page * 30,
            (page + 1) * 30
          );

          const profile = await Profile.findById(req._id);
    
          likes.map(user => {
            user.isSubscribed = false;
            if (profile.subscriptions.indexOf(user.userId) > -1) {
              user.isSubscribed = true;
            }
          });

          var dislikes = publicationLikes.userdislikes.slice(
            page * 30,
            (page + 1) * 30
          );
     
          dislikes.map(user => {
            user.isSubscribed = false;
            if (profile.subscriptions.indexOf(user.userId) >-1) {
              user.isSubscribed = true;
            }
          });

          return res.json({
            status: 0,
            message: {
              likes: likes,
              dislikes: dislikes
            }
          });
        }
      });
    });
  } catch (error) {
    console.log("Error when getting interactions", error);
    return res.json({
      status: 3,
      error: "SP_ER_TECHNICAL_ERROR"
    });
  }
});

router.route("/reportPublication").post(function(req, res) {
  try {
    var publication = new Publication();

    Publication.findById(req.body.publId, function(err, publication) {
      if (err) {
        res.json({
          status: 3,
          error: "SP_ER_TECHNICAL_ERROR"
        });
        return;
      }
      if (!publication) {
        return res.json({
          status: 2,
          error: "SP_ER_PUBLICATION_NOT_FOUND"
        });
      }

      publication.nbSignals++;
      publication.save();
      var mongoose = require("mongoose");
      var signal = new Signal();
      signal.publicationId = req.body.publId;
      signal.dateSignal = new Date();
      signal.signalText = req.body.signalText;
      signal.profileId = req._id;
      signal.save();
      return res.json({
        status: 0,
        message: "PUBLICATION_REPORTED"
      });
    });
  } catch (error) {
    console.log("error when report publication", error);
    return res.json({
      status: 3,
      error: "SP_ER_TECHNICAL_ERROR"
    });
  }
});

router.route("/removePublication").post(function(req, res) {
  try {
    var publication = new Publication();

    Publication.findById(req.body.publId, function(err, publication) {
      if (err) {
        res.json({
          status: 3,
          error: "SP_ER_TECHNICAL_ERROR"
        });
        return;
      }
      if (!publication) {
        return res.json({
          status: 2,
          error: "SP_ER_PUBLICATION_NOT_FOUND"
        });
      }

      if (!publication.profileId.equals(req._id)) {
        return res.json({
          status: 2,
          error: "SP_ER_USER_NOT_HAVE_PERMISSION"
        });
      }

      Profile.findById(publication.profileId, function(err, profile) {
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
        }

        profile.nbPublications--;
        profile.nbLikes -= publication.nbLikes;
        profile.publications.splice(
          profile.publications.indexOf(req.body.publId),
          1
        );
        profile.save();
      });
      publication.remove();
      res.json({
        status: 0,
        message: "PUBLICATION_REMOVED"
      });

      Notification.find(
        {
          publId: req.body.publId
        },
        function(err, notifications) {
          for (i = 0; i < notifications.length; i++) {
            notifications[i].remove();
          }
        }
      );
    });
  } catch (error) {
    console.log("error when remove publication", error);
    return res.json({
      status: 3,
      error: "SP_ER_TECHNICAL_ERROR"
    });
  }
});

router.route("/sharePublication").post(function(req, res) {
  try {
   // console.log("sharing");
   // console.log(req.body);
    Publication.findById(req.body.publId, function(err, pub) {
      if (err) {
        res.json({
          status: 3,
          error: "SP_ER_TECHNICAL_ERROR"
        });
        return;
      }
      if (!pub) {
        return res.json({
          status: 2,
          error: "SP_ER_PUBLICATION_NOT_FOUND"
        });
      }

      var publication = new Publication();
      Profile.findById(req.body.profileId, function(err, profile) {
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
        }

        profile.nbPublications++;
        profile.publications.push(publication._id);
        profile.save();
        publication.profileId = req._id;
        publication.originalPublicationId = pub._id;
        publication.originalProfileId = pub.profileId;
        publication.datePublication = new Date();
        publication.originalDatePublication = pub.datePublication;
        publication.profileFirstName = profile.firstName;
        publication.originalProfileFirstName = pub.profileFirstName;
        publication.profileLastName = profile.lastName;
        publication.originalProfileLastName = pub.profileLastName;
        publication.profilePicture = profile.profilePicture;
        publication.profilePictureMin = profile.profilePictureMin;
        publication.originalProfilePicture = pub.profilePicture;
        publication.originalProfilePictureMin = pub.profilePictureMin;
        publication.confidentiality = pub.confidentiality;
        publication.publText = pub.publText;
        publication.publTitle = pub.publTitle;
        publication.publClass = pub.publClass;
        publication.publExternalLink = pub.publExternalLink;
        publication.publPictureLink = pub.publPictureLink;
        publication.publyoutubeLink = pub.publyoutubeLink;
        publication.publfacebookLink = pub.publfacebookLink;
        publication.publfacebookLinkWidth = pub.publfacebookLinkWidth;
        publication.publfacebookLinkHeight = pub.publfacebookLinkHeight;
        publication.isShared = true;
        publication.nbLikes = 0;
        publication.nbDislikes = 0;
        publication.nbSignals = 0;
        publication.nbComments = 0;
        publication.nbShare = 0;
        publication.save();
        var publicationLikes = new PublicationLikes();
        publicationLikes._id = publication._id;
        publicationLikes.save();
        pub.nbShare++;
        pub.save();

        if (req.body.alreadySharedPubId) {
          Publication.findById(req.body.alreadySharedPubId, function(
            err,
            pub2
          ) {
            if (err) {
              res.json({
                status: 3,
                error: "SP_ER_TECHNICAL_ERROR"
              });
              return;
            }
            if (!pub2) {
              return res.json({
                status: 2,
                error: "SP_ER_PUBLICATION_NOT_FOUND"
              });
            }
            pub2.nbShare++;
            pub2.save();
          });
        }
        return res.json({
          status: 0,
          message: "PUBLICATION_SHARED",
          publication: publication
        });
      });
    });
  } catch (error) {
    console.log("error when share publication", error);
    return res.json({
      status: 3,
      error: "SP_ER_TECHNICAL_ERROR"
    });
  }
});

router.route("/getProfilePublications").get(function(req, res) {
  try {
    var profileId;
    if (req.query.profileId) {
      profileId = req.query.profileId;
    } else {
      profileId = req._id;
    }

    var profileQuery = Profile.findOne({
      _id: profileId
    });

    profileQuery.exec(function(err, profile) {
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
      }
      var index = profile.subscribers.indexOf(req._id);
      if (index>-1||profile._id==req._id){
      if (!req.query.last_publication_id) {
        var publicationQuery = Publication.find({
          profileId: profileId
        })
          .limit(10)
          .sort({
            _id: -1
          });
      } else {
        var publicationQuery = Publication.find({
          $and: [
            {
              _id: {
                $lt: req.query.last_publication_id
              }
            },
            {
              profileId: profileId
            }
          ]
        })
          .limit(10)
          .sort({
            _id: -1
          });
      }}else {
        if (!req.query.last_publication_id) {
          var publicationQuery = Publication.find({
            $and:[ {profileId: profileId}, { confidentiality:{ $eq: "PUBLIC"} }]
          })
            .limit(10)
            .sort({
              _id: -1
            });
        } else {
          var publicationQuery = Publication.find({
            $and: [
              {
                _id: {
                  $lt: req.query.last_publication_id
                }
              },
              {
                profileId: profileId
              },
              { confidentiality:{ $eq: "PUBLIC"} }
            ]
          })
            .limit(10)
            .sort({
              _id: -1
            });
        }
      }

      publicationQuery.exec(function(err, publications) {
        if (err) {
          res.json({
            status: 3,
            error: "SP_ER_TECHNICAL_ERROR"
          });
          return;
        }

        async.each(
          publications,
          function(publication, callback) {
            PublicationLikes.findById(publication._id, function(
              err,
              publicationLikes
            ) {
              if (publicationLikes) {
                publication.isLiked =
                  publicationLikes.likes.indexOf(req._id) > -1;
                publication.isDisliked =
                  publicationLikes.dislikes.indexOf(req._id) > -1;
              }
              for (j = 0; j < publication.comments.length; j++) {
                publication.comments[j].isLiked =
                  publication.comments[j].likes.indexOf(req._id) > -1;
                publication.comments[j].isDisliked =
                  publication.comments[j].dislikes.indexOf(req._id) > -1;
              }
              callback();
            });
          },
          function(err) {
            return res.json(publications);
          }
        );
      });
    });
  } catch (error) {
    console.log("error when get publications", error);
    return res.json({
      status: 3,
      error: "SP_ER_TECHNICAL_ERROR"
    });
  }
});

router.route("/getPublicationsForOneProfileByID").get(function(req, res) {
  try {
    var criteria = {};
    if (!req.query.last_publication_id) {
      criteria = {
        profileId: req.query.ProfileId
      };
    } else {
      criteria = {
        $and: [
          {
            profileId: req.query.ProfileId
          },
          {
            _id: {
              $lt: req.query.last_publication_id
            }
          }
        ]
      };
    }

    var query = Publication.find(criteria)
      .sort({
        _id: -1
      })
      .limit(10);
    query.execFind(function(err, publications) {
      if (err)
        return res.json({
          status: 0,
          err: err
        });
      else {
        function callback() {}

        async.each(
          publications,
          function(publication, callback) {
            PublicationLikes.findById(publication._id, function(
              err,
              publicationLikes
            ) {
              if (publicationLikes) {
                publication.isLiked =
                  publicationLikes.likes.indexOf(req.query.connectedProfileID) >
                  -1;
                publication.isDisliked =
                  publicationLikes.dislikes.indexOf(
                    req.query.connectedProfileID
                  ) > -1;
              }
              for (j = 0; j < publication.comments.length; j++) {
                publication.comments[j].isLiked =
                  publication.comments[j].likes.indexOf(
                    req.query.connectedProfileID
                  ) > -1;
                publication.comments[j].isDisliked =
                  publication.comments[j].dislikes.indexOf(
                    req.query.connectedProfileID
                  ) > -1;
              }
              callback();
            });
          },
          function(err) {
            return res.json({
              status: 1,
              publication: publications
            });
          }
        );
      }
    });
  } catch (error) {
    console.log("error when getPublicationsForOneProfileByID", error);
    return res.json({
      status: 3,
      error: "SP_ER_TECHNICAL_ERROR"
    });
  }
});

router.route("/getPublicationById/:publicationId").get(function(req, res) {
  try {
    Publication.findById(req.params.publicationId, function(err, publication) {
      if (err) {
        res.json({
          status: 3,
          error: "SP_ER_TECHNICAL_ERROR"
        });
        return;
      }
      if (!publication) {
        return res.json({
          status: 2,
          error: "SP_ER_PUBLICATION_NOT_FOUND"
        });
      }

      PublicationLikes.findById(publication._id, function(
        err,
        publicationLikes
      ) {
        if (publicationLikes) {
          publication.isLiked =
            publicationLikes.likes.indexOf(req.query.profileID) > -1;
          publication.isDisliked =
            publicationLikes.dislikes.indexOf(req.query.profileID) > -1;
        }
        for (j = 0; j < publication.comments.length; j++) {
          publication.comments[j].isLiked =
            publication.comments[j].likes.indexOf(req.query.profileID) > -1;
          publication.comments[j].isDisliked =
            publication.comments[j].dislikes.indexOf(req.query.profileID) > -1;
        }
        return res.json({
          status: 0,
          publication: publication
        });
      });
    });
  } catch (error) {
    console.log("error when getPublicationById", error);
    return res.json({
      status: 3,
      error: "SP_ER_TECHNICAL_ERROR"
    });
  }
});
module.exports = router;
