var express = require('express');
var async = require("async");
var multer = require('multer');
var passwordHash = require('password-hash');
var _= require('lodash');

var app = express();

var router = express.Router();

var Profile = require('../models/Profile');
var Comment = require('../models/Comment');
var Publication = require('../models/Publication');
var ProfilesPasswords = require('../models/profilesPasswords');
var notificationScript = require('../public/javascripts/notificationScript');
var popularProfile = require('../models/PopularProfile');
var ObjectId = require('mongodb').ObjectId;

var jwt = require('jsonwebtoken');
var PropertiesReader = require('properties-reader');
var properties = PropertiesReader('properties.file');
const saveImage = require('../utils/save_user_image')

var path = require('path');

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


router.route('/getProfile')
    .get(function (req, res) {

        try {
            Profile.findById(req.query.ProfileId, function (err, profile) {
                if (err) {
                    return res.json({
                        status: 3,
                        error: 'SP_ER_TECHNICAL_ERROR'
                    });
                }
                if (!profile) {
                    return res.json({
                        status: 2,
                        error: 'SP_ER_PROFILE_NOT_FOUND'
                    });
                }

                Profile.findById(req._id, function (err, connectedProfile) {
                    if (err) {
                        return res.json({
                            status: 3,
                            error: 'SP_ER_TECHNICAL_ERROR'
                        });
                    }
                    if (!connectedProfile) {
                        return res.json({
                            status: 2,
                            error: 'SP_ER_PROFILE_NOT_FOUND'
                        });
                    }

                    profile.isFollowed = (connectedProfile.subscribers.indexOf(req.query.ProfileId) > -1);

                    var user = profile.toObject();
                    delete user["password"];

                    return res.json({
                        status: 0,
                        user: user
                    });

                });

            });
        } catch (error) {
            console.log("error when get profile", error);
            return res.json({
                status: 3,
                error: 'SP_ER_TECHNICAL_ERROR'
            });
        }
    });


router.route('/subscribe')
    .post(function (req, res) {
        try {
            
            Profile.findById(req.body.profileId, function (err, targetProfile) {
                if (err) {
                    return res.json({
                        status: 3,
                        error: 'SP_ER_TECHNICAL_ERROR'
                    });
                }
                if (!targetProfile) {
                    return res.json({
                        status: 2,
                        error: 'SP_ER_TARGET_PROFILE_NOT_FOUND'
                    });
                }
                Profile.findById(req._id, function (err, profile) {
                    if (err) {
                        return res.json({
                            status: 3,
                            error: 'SP_ER_TECHNICAL_ERROR'
                        });
                    }
                    if (!profile) {
                        return res.json({
                            status: 2,
                            error: 'SP_ER_PROFILE_NOT_FOUND'
                        });
                    }

                    var index = profile.subscribers.indexOf(req.body.profileId);
                    if (index == -1) {
                        profile.subscribers.push(req.body.profileId);
                        profile.nbSubscribers++;
                        profile.save();

                        Profile.findById(req.body.profileId, function (err, pr) {
                            if (pr) {
                                pr.nbSuivi++;
                                pr.save();
                            }
                        });
                        console.log(req.body)
                        notificationScript.notifier(req.body.profileId, "", req._id, "subscribe", "");

                        return res.json({
                            status: 0,
                            message: 'SUBSCRIBED'
                        });

                    }
                });
            });


        } catch (error) {
            console.log("error when get subscribe", error);
            return res.json({
                status: 3,
                error: 'SP_ER_TECHNICAL_ERROR'
            });
        }
    });


router.route('/unsubscribe')
    .post(function (req, res) {
        try {
            Profile.findById(req.body.profileId, function (err, targetProfile) {
                if (err) {
                    return res.json({
                        status: 3,
                        error: 'SP_ER_TECHNICAL_ERROR'
                    });
                }
                if (!targetProfile) {
                    return res.json({
                        status: 2,
                        error: 'SP_ER_TARGET_PROFILE_NOT_FOUND'
                    });
                }

                Profile.findById(req._id, function (err, profile) {
                    if (err) {
                        return res.json({
                            status: 3,
                            error: 'SP_ER_TECHNICAL_ERROR'
                        });
                    }
                    if (!profile) {
                        return res.json({
                            status: 2,
                            error: 'SP_ER_PROFILE_NOT_FOUND'
                        });
                    }

                    var index = profile.subscribers.indexOf(req.body.profileId);
                    if (index > -1) {
                        profile.subscribers.splice(index, 1);
                        profile.nbSubscribers--;
                    }

                    profile.save();

                    return res.json({
                        status: 0,
                        message: 'UNSUBSCRIBED'
                    });
                });
            });

        } catch (error) {
            console.log("error when get unsubscribe", error);
            return res.json({
                status: 3,
                error: 'SP_ER_TECHNICAL_ERROR'
            });
        }
    });
router.route('/ignore')
    .post(function (req, res) {
        try {
            Profile.findById(req.body.profileId, function (err, targetProfile) {
                if (err) {
                    return res.json({
                        status: 3,
                        error: 'SP_ER_TECHNICAL_ERROR'
                    });
                }
                if (!targetProfile) {
                    return res.json({
                        status: 2,
                        error: 'SP_ER_TARGET_PROFILE_NOT_FOUND'
                    });
                }
                Profile.findById(req._id, function (err, profile) {
                    if (err) {
                        return res.json({
                            status: 3,
                            error: 'SP_ER_TECHNICAL_ERROR'
                        });
                    }
                    if (!profile) {
                        return res.json({
                            status: 2,
                            error: 'SP_ER_PROFILE_NOT_FOUND'
                        });
                    }

                    var index = profile.ignoredProfiles.indexOf(req.body.profileId);

                    if (index == -1) {
                        profile.ignoredProfiles.push(req.body.profileId);
                        profile.save();


                        notificationScript.notifier(req.body.profileId, "", req.body.UserId, "ignore", "");

                        return res.json({
                            status: 0,
                            message: 'IGNORED'
                        });

                    }
                });
            });


        } catch (error) {
            console.log("error when get subscribe", error);
            return res.json({
                status: 3,
                error: 'SP_ER_TECHNICAL_ERROR'
            });
        }
    });


router.route('/updateProfilePicture')
    .post(function (req, res) {
        try {
            
            var profile = new Profile();
            var storage = multer.diskStorage({
                destination: function (req, file, callback) {
                    callback(
                        null,
                        properties.get('pictures.storage.temp')
                            .toString()
                    );
                },
                filename: function (req, file, callback) {
                    callback(
                        null,
                        profile._id + '_' + new Date()
                            .toISOString()
                            .replace(/:/g, "-")
                            .replace(/\./g, '')
                        + path.extname(file.originalname));
                }
            });
            var upload = multer({
                storage: storage
            }).fields([{
                name: 'profilePicture',
                maxCount: 1
            }]);
            upload(req, res, function (err) {
                if (err) {
                    return res.json({
                        status: 3,
                        error: 'SP_ER_TECHNICAL_ERROR'
                    });
                }
                else {
            

                    Profile.findById(req._id, function (err, profile) {
                        if (err) {
                            return res.json({
                                status: 3,
                                error: 'SP_ER_TECHNICAL_ERROR'
                            });
                        }
                        if (!profile) {
                            return res.json({
                                status: 2,
                                error: 'SP_ER_PROFILE_NOT_FOUND'
                            });
                        }


                         const link=  properties.get('pictures.link').toString(); 
                        if (req.files.profilePicture[0]) {
                            
                                const filename = req.files.profilePicture[0].path;
                                const destination = properties.get("pictures.storage.folder").toString()+'/'+req.files.profilePicture[0].filename
                                saveImage(filename,destination)
                                profile.profilePicture= properties.get('pictures.link') +'/'+ req.files.profilePicture[0].filename;
                                profile.profilePictureMin= properties.get('pictures.link') +'/'+ req.files.profilePicture[0].filename;
                                


                            //Update du photo dans les publications anterieures

                            profile.publications.forEach((publicationId)=>{
                                Publication.findById(publicationId,function (err,pub) {
                                    if (!err){
                                        if(pub) {
                                            pub.profilePicture =
                                                properties.get('pictures.link') +'/'+ req.files.profilePicture[0].filename;
                                            pub.profilePictureMin =
                                                properties.get('pictures.link') +'/'+ req.files.profilePicture[0].filename;
                                            pub.save();
                                        }
                                    }
                                })

                            })
                            //Update du photo dans les commentaires anterieures

                            profile.comments.forEach((commentId)=>{
                                Comment.findById(commentId,function (err,comment) {
                                    if (!err){
                                        if (comment) {
                                            comment.profilePicture =
                                                properties.get('pictures.link') +'/' +req.files.profilePicture[0].filename;
                                            comment.profilePictureMin =
                                                properties.get('pictures.link') +'/'+ req.files.profilePicture[0].filename;
                                            comment.save();
                                        }
                                    }
                                })

                            })
                        }
                        profile.save();


                        res.json({
                            status: 0,
                            profile: profile,
                            message: "PROFILE_PICTURE_UPDATED"
                        });

                    });
                }
            });

        } catch (error) {
            console.log("error when update profile picture", error);
            return res.json({
                status: 3,
                error: 'SP_ER_TECHNICAL_ERROR'
            });
        }
    });


router.route('/updateProfile')
    .post(function (req, res) {
        try {
            Profile.findById(req._id, function (err, profile) {
                if (err) {
                    return res.json({
                        status: 3,
                        error: 'SP_ER_TECHNICAL_ERROR'
                    });
                }
                if (!profile) {
                    return res.json({
                        status: 2,
                        error: 'SP_ER_PROFILE_NOT_FOUND'
                    });
                }

                profile.firstName = req.body.firstName;
                profile.lastName = req.body.lastName;
                //profile.gender = req.body.gender;
                profile.birthday = req.body.birthday;
                profile.about = req.body.about;
                profile.facebookLink = req.body.facebookLink;
                profile.youtubeLink = req.body.youtubeLink;
                profile.twitterLink = req.body.twitterLink;
                profile.googleLink = req.body.googleLink;
                profile.name = profile.firstName + ' ' + profile.lastName;
                profile.save();

                res.json({
                    status: 0,
                    profile: profile
                });

                Publication.find({profileId: req._id}, function (err, publications) {
                    for (i = 0; i < publications.length; i++) {
                        publications[i].profileFirstName = req.body.firstName;
                        publications[i].profileLastName = req.body.lastName;
                        publications[i].save();
                    }
                });
                Comment.find({profileId: req._id}, function (err, comments) {
                    for (i = 0; i < comments.length; i++) {
                        comments[i].profileFirstName = req.body.firstName;
                        comments[i].profileLastName = req.body.lastName;
                        comments[i].save();
                    }
                });

                Publication.find({}, function (err, publications) {
                    for (i = 0; i < publications.length; i++) {
                        for (j = 0; j < publications[i].comments.length; j++) {
                            if (publications[i].comments[j].profileId == req._id) {
                                publications[i].comments[j].profileFirstName = req.body.firstName;
                                publications[i].comments[j].profileLastName = req.body.lastName;
                            }
                        }
                        publications[i].save();
                    }
                });

            });


        } catch (error) {
            console.log("error when update profile", error);
            return res.json({
                status: 3,
                error: 'SP_ER_TECHNICAL_ERROR'
            });
        }
    });


router.route('/updateProfileDescription')
    .post(function (req, res) {

        try {
            Profile.findById(req._id, function (err, profile) {
                if (err) {
                    return res.json({
                        status: 3,
                        error: 'SP_ER_TECHNICAL_ERROR'
                    });
                }
                if (!profile) {
                    return res.json({
                        status: 2,
                        error: 'SP_ER_PROFILE_NOT_FOUND'
                    });
                }

                profile.about = req.body.about;
                profile.save();
                res.json({
                    status: 1,
                    message: "PROFILE_DESCRIPTION_UPDATED"
                });

            });
        } catch (error) {
            console.log("error when update description profile", error);
            return res.json({
                status: 3,
                error: 'SP_ER_TECHNICAL_ERROR'
            });
        }
    });


router.route('/updatePassword')
    .post(function (req, res) {
        try {
            if (!req.body.newPassword || req.body.newPassword.length < 5) {
                return res.json({
                    status: 1,
                    error: 'SP_FV_ER_NEW_PASSWORD_NOT_VALID'
                });
            }
            Profile.findById(req._id, function (err, profile) {
                if (err) {
                    return res.json({
                        status: 3,
                        error: 'SP_ER_TECHNICAL_ERROR'
                    });
                }

                if (!profile) {
                    return res.json({
                        status: 2,
                        error: 'SP_ER_PROFILE_NOT_FOUND'
                    });
                }

                ProfilesPasswords.findById(profile.id, function (err, profilePassword) {

                    if ( profilePassword && !(passwordHash.verify(req.body.oldPassword, profilePassword.password))) {
                        return res.json({
                            status: 1,
                            error: "SP_ER_WRONG_PASSWORD"
                        });
                    }

                     if (!profilePassword){
                        return res.json({
                            status: 1,
                            error: "SP_ER_WRONG_PASSWORD"
                        });
                         
                     }
                
    
                    else {
                        profilePassword.password = passwordHash.generate(req.body.newPassword);
                        profilePassword.save();
                        res.json({
                            status: 0,
                            message: "PASSWORD_UPDATED"
                        });
                    }
                });

            });

        } catch (error) {
            console.log("error when update password", error);
            return res.json({
                status: 3,
                error: 'SP_ER_TECHNICAL_ERROR'
            });
        }
    });



router.route('/getPopularProfiles/:id?')
    .get(function (req, res) {
        try {
            var id = req.params.id;
            var index =0 ;
            Profile.findById(String(req._id), function (err, profile) {
                if (err) {
                    return res.json({
                        status: 3,
                        error: `SP_ER_TECHNICAL_ERROR ${err}`

                    });
                }
                if (!profile) {
                    return res.json({
                        status: 2,
                        error: 'SP_ER_PROFILE_NOT_FOUND'
                    });
                }

                var query = {$and: [{_id: {$nin: profile.subscribers}}, {_id: {$ne: profile._id}},
                    {_id: {$nin: profile.ignoredProfiles}}]} ;



                    popularProfile.find()
                        .select('_id')
                        .exec(function(err, docs){
                            if(err){
                               console.log(err);
                            } else {
                                docs = docs.map(function(doc) {
                                    return String(doc._id);
                                });
                                index=_.indexOf(docs,String(id))=== -1? 0 : _.indexOf(docs,String(id))+1 ;

                                var find = popularProfile.find(query)
                                    .where('likers').nin([ObjectId(profile._id)])
                                    .skip(index)
                                    .limit(12)
                                    .sort({
                                        nbLikes :-1
                                    });
                                find.exec(function (err, profiles) {
                                    if (err) {
                                        return res.json({
                                            status: 3,
                                            error: 'SP_ER_TECHNICAL_ERROR2'
                                        });
                                    }
                                    else {
                                        res.json({
                                            status: 0,
                                            profiles: profiles
                                        });
                                    }
                                });

                            }
                        })





            });
        } catch (error) {
            console.log(" error when get profiles suggestions ", error);
            return res.json({
                status: 3,
                error: 'SP_ER_TECHNICAL_ERROR'
            });
        }
    });




router.route('/findProfile')
    .get(function (req, res) {
        try {
            Profile.find({name: {$regex: req.query.ProfileName + '.*', $options: 'i'}})
                .limit(5)
                .exec(function (err, profiles) {
                    if (err) {
                        res.json({
                            status: 3,
                            error: 'SP_ER_TECHNICAL_ERROR'
                        });
                    }
                    else {
                        res.json({
                            status: 0,
                            profiles: profiles
                        });
                    }
                });
        } catch (error) {
            console.log(" error when find profile by name ", error);
            return res.json({
                status: 3,
                error: 'SP_ER_TECHNICAL_ERROR'
            });
        }
    });


router.route('/getSubscribers') //profileId  lastSubscribeId  connectedProfileID
    .get(function (req, res) {
        Profile.findById(req.query.connectedProfileID, function (err, pr) {
            if (pr) {
                Profile.findById(req.query.profileId, function (err, profile) {
                    if (!profile) {
                        res.json({
                            status: 0,
                            message: "profile not found"
                        });
                    }
                    else {
                        var index = 0;
                        if (req.query.lastSubscribeId) {
                            index = profile.subscribers.indexOf(req.query.lastSubscribeId);
                        }
                        if (index > -1) {
                            var limit = index + 5;
                            var first = index;
                            if (index > 0) {
                                first++;
                                ;
                            }
                            if (limit > profile.subscribers.length) {
                                limit = profile.subscribers.length;
                            }
                            var subscribers = profile.subscribers.slice(first, limit);
                            var result = [];

                            function callback() {
                            }

                            async.each(subscribers
                                , function (subscribeId, callback) {
                                    Profile.findById(subscribeId, function (err, subscribe) {
                                        if (subscribe) {
                                            subscribe.isSubscribe = pr.subscribers.indexOf(subscribe._id) > -1;
                                            subscribe.subscribers = [];
                                            result.push(subscribe);
                                            callback();
                                        }
                                    });
                                }
                                , function (err) {
                                    return res.json(result);
                                }
                            );
                        } else {
                            res.json({
                                status: 1,
                                profiles: []
                            });
                        }
                    }

                });
            } else {
                res.json({
                    status: 0,
                    message: "connected profil not found"
                });
            }
        });
    });

router.route('/updateProfilePictureSlimAPI') //profileId //base64Data
    .post(function (req, res) {
        Profile.findById(req.body.profileId, function (err, profile) {
            if (err) {
                res.send(err);
            }
            else if (!profile) {
                res.json({
                    status: 1,
                    message: "profile not found"
                });
            }
            else {
                var base64Data = req.body.base64Data.slice(req.body.base64Data.indexOf("base64") + 6);
                var d = new Date();
                var n = d.getTime();
                var fileName = profile.id + n + ".jpeg";
                require("fs").writeFile("/var/www/html/images/" + fileName, base64Data, 'base64', function (err) {
                    if (err) {
                        res.json({
                            status: 0,
                            message: "an error occurred while saving picture"
                        });
                    } else {
                        res.json({
                            status: 1,
                            message: "profile picture updated"
                        });
                        profile.profilePicture = properties.get('pictures.link') + fileName;
                        profile.profilePictureMin = properties.get('pictures.link') + fileName;
                        profile.save();
                    }
                });
            }

        });
    });


module.exports = router;