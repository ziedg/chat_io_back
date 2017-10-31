var express = require('express');
var router = express.Router();
var async = require("async");
var ogs = require('open-graph-scraper');
var sizeOf = require('image-size');

var bodyParser = require("body-parser");
var multer = require('multer');

var Publication = require('../models/Publication');
var Signal = require('../models/signal');
var Profile = require('../models/Profile');
var PublicationLikes = require('../models/PublicationLikes');
var Comment = require('../models/Comment');
var notificationScript = require('../public/javascripts/notificationScript');
var Notification = require('../models/Notification');

var PropertiesReader = require('properties-reader');
var properties = PropertiesReader('./properties.file');

var app = express();


router.route('/publish')
    .post(function(req, res) {
        try {
            var publication = new Publication(); //create a new instance of the Publication model

            var storage = multer.diskStorage({
                destination: function(req, file, callback) {
                    callback(null, '/var/www/html/images');
                },
                filename: function(req, file, callback) {
                    callback(null, publication.id + file.originalname.slice(file.originalname.lastIndexOf(".") * -1 + 1));
                }
            });

            var upload = multer({
                storage: storage
            }).fields([{
                name: 'publPicture',
                maxCount: 1
            }]);

            upload(req, res, function(err) {

                if (err) {
                    return res.json({
                        status: 1,
                        message: err
                    });
                } else {
                    var body = req.body;
                    publication.profileId = body.profileId;
                    publication.datePublication = new Date();

                    Profile.findById(body.profileId, function(err, profile) {

                        if (err) {
                            return res.json({
                                status: 1,
                                message: err
                            });
                        } else {
                            if (!profile) {
                                return res.json({
                                    status: 1,
                                    message: "profile not found"
                                });
                            } else {
                                profile.nbPublications++;
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
                                publication.publyoutubeLink = body.publyoutubeLink;
                                publication.publExternalLink = body.publExternalLink;
                                publication.nbFcbkShare = 0;
                                publication.nbTwitterShare = 0;
                                if (req.files.publPicture) {
                                    publication.publPictureLink = req.files.publPicture[0].filename;
                                }


                                var publicationLikes = new PublicationLikes();
                                publicationLikes.save();
                                publicationLikes._id = publication._id;
                                publication.save();
                                return res.json({
                                    status: 0,
                                    message: 'publication created',
                                    publication: publication
                                });
                            }

                        }

                    });
                }
            });
        } catch (err) {
            console.log(" publish " + err);
            return res.json({
                err
            });
        }
    });


router.route('/likePublication')
    .post(function(req, res) {
        try {
            var publication = new Publication();

            Publication.findById(req.body.publId, function(err, publication) {
                if (err) {
                    return res.json({
                        status: 0,
                        err: err
                    });
                } else if (!publication) {
                    return res.json({
                        status: 0,
                        message: 'Publication not found'
                    });
                } else {
                    PublicationLikes.findById(req.body.publId, function(err, publicationLikes) {
                        publicationLikes.likes.unshift(req.body.profileId);
                        publicationLikes.save();
                    });
                    publication.nbLikes++;
                    publication.save();
                    res.json({
                        status: 1,
                        message: 'Publication liked'
                    });
                    notificationScript.notifier(publication.profileId, req.body.publId, req.body.profileId, "like","");
                }
            });
        } catch (err) {
            console.log(" likePublication " + err);
            return res.json({
                err
            });
        }
    });

router.route('/removeLikePublication')
    .post(function(req, res) {
        try {
            var publication = new Publication();

            Publication.findById(req.body.publId, function(err, publication) {
                if (err) {
                    return res.json({
                        status: 0,
                        err: err
                    });
                } else if (!publication) {
                    return res.json({
                        status: 0,
                        message: 'Publication not found'
                    });
                } else {
                    PublicationLikes.findById(req.body.publId, function(err, publicationLikes) {

                        var index = publicationLikes.likes.indexOf(req.body.profileId);
                        publicationLikes.likes.splice(index, 1);
                        publicationLikes.save();
                    });


                    publication.nbLikes--;
                    publication.save();
                    notificationScript.removeNotification(publication.profileId, req.body.publId, req.body.profileId, "like");
                    return res.json({
                        message: 'like removed'
                    });
                }
            });
        } catch (err) {
            console.log(" removeLikePublication " + err);
            return res.json({
                err
            });
        }

    });



router.route('/dislikePublication')
    .post(function(req, res) {
        try {
            var publication = new Publication();

            Publication.findById(req.body.publId, function(err, publication) {
                if (err) {
                    return res.json({
                        status: 0,
                        err: err
                    });
                } else if (!publication) {
                    return res.json({
                        status: 0,
                        message: 'Publication not found'
                    });
                } else {

                    PublicationLikes.findById(req.body.publId, function(err, publicationLikes) {
                        publicationLikes.dislikes.unshift(req.body.profileId);
                        publicationLikes.save();
                    });

                    publication.nbDislikes++;
                    publication.save();
                    res.json({
                        message: 'Publication disliked'
                    });
                    notificationScript.notifier(publication.profileId, req.body.publId, req.body.profileId, "dislike","");
                }
            });
        } catch (err) {
            console.log(" dislikePublication " + err);
            return res.json({
                err
            });
        }
    });

router.route('/removeDislikePublication')
    .post(function(req, res) {
        try {
            var publication = new Publication();

            Publication.findById(req.body.publId, function(err, publication) {
                if (err) {
                    return res.json({
                        status: 0,
                        err: err
                    });
                } else if (!publication) {
                    return res.json({
                        status: 0,
                        message: 'Publication not found'
                    });
                } else {

                    PublicationLikes.findById(req.body.publId, function(err, publicationDislikes) {

                        var index = publicationDislikes.dislikes.indexOf(req.body.profileId);
                        publicationDislikes.dislikes.splice(index, 1);
                        publicationDislikes.save();
                    });


                    publication.nbDislikes--;
                    publication.save();
                    notificationScript.removeNotification(publication.profileId, req.body.publId, req.body.profileId, "dislike");
                    return res.json({
                        message: 'dislike removed'
                    });
                }
            });
        } catch (err) {
            console.log(" removeDislikePublication " + err);
            return res.json({
                err
            });
        }
    });


router.route('/signalerPublication') 	//signalText  //profileId   //publId
	.post(function(req, res) {
        try {
            var publication = new Publication();

            Publication.findById(req.body.publId, function(err, publication) {
                try{
					if (err) {
						return res.json({
							status: 0,
							err: err
						});
					} else if (!publication) {
						return res.json({
							status: 0,
							message: 'Publication not found'
						});
					} else {

						res.json({
							message: 'Publication signaled'
						});

						publication.nbSignals++;
						publication.save();
						var mongoose = require('mongoose');
						var signal = new Signal();
						signal.publicationId= req.body.publId;
						signal.dateSignal = new Date();
						signal.signalText = req.body.signalText;
						signal.save();
						if(mongoose.Types.ObjectId.isValid(req.body.profileId.toString()))
							signal.profileId = req.body.profileId;
						
						signal.save();
						//signalText  //profileId   //publId
					}
				}
				catch (err) {
					signal.save();	
				}
            });
        } catch (err) {
            console.log(" signalPublication " + err);
            return res.json({
                err
            });
        }
    });

router.route('/removePublication')
    .post(function(req, res) {
        try {
            var publication = new Publication();

            Publication.findById(req.body.publId, function(err, publication) {
                if (err) {
                    return res.json({
                        status: 0,
                        err: err
                    });
                } else if (!publication)
                    return res.json({
                        status: 0,
                        message: 'publication not found'
                    });
                else if (publication) {
                    Profile.findById(publication.profileId, function(err, profile) {
                        profile.nbPublications--;
                        profile.save();
                    });
                    publication.remove();
                    res.json({
                        status: 1,
                        message: 'publication removed'
                    });
                }
                Notification.find({
                    publId: req.body.publId
                }, function(err, notifications) {
                    for (i = 0; i < notifications.length; i++) {
                        notifications[i].remove();
                    }
                });
            });
        } catch (err) {
            console.log(" removePublication " + err);
            return res.json({
                err
            });
        }
    });


router.route('/removePublicationAdmin')
    .post(function(req, res) {
        try {
            Profile.findById(req.body.userID, function(err, profile) {
                if (!profile) {
                    return res.json({
                        status: 0,
                        message: 'profile not found'
                    });
                } else if (profile.isAdmin == 1) {
                    var publication = new Publication();

                    Publication.findById(req.body.publId, function(err, publication) {
                        if (err) {
                            return res.json({
                                status: 0,
                                err: err
                            });
                        } else if (!publication)
                            return res.json({
                                status: 0,
                                message: 'publication not found'
                            });
                        else if (publication) {
                            
                            publication.remove();
                            res.json({
                                status: 1,
                                message: 'publication removed'
                            });
                            Profile.findById(publication.profileId, function(err, profile) {
                                profile.nbPublications--;
                                profile.save();
                            });
							notificationScript.notifier(publication.profileId, publication.profileId, publication.profileId, "removePublication",req.body.raisonDelete);
                            Notification.find({
                                publId: req.body.publId
                            }, function(err, notifications) {
                                for (i = 0; i < notifications.length; i++) {
                                    notifications[i].remove();
                                }
                            });
                        }
                    });
                } else {

                    res.json({
                        status: 0,
                        message: ' not authorized '
                    });
                }
            });
        } catch (err) {
            console.log(" removePublicationAdmin " + err);
            return res.json({
                err
            });
        }
    });


router.route('/getPublicationByProfileId')
    .get(function(req, res) {
        try {
            var publication = new Publication();
            var profileQuery = Profile.findOne({
                _id: req.query.profileID
            });
            profileQuery.exec(function(err, profile) {
                if (err) {
                    return res.json({
                        status: 1,
                        message: err
                    });
                } else {
                    if (!profile) {
                        return res.json({
                            status: 1,
                            message: "profile not found"
                        });
                    } else {
                        var subscribers = profile.subscribers;

                        if (!req.query.last_publication_id) {
                            var publicationQuery = Publication.find({
                                    $or: [{
                                        confidentiality: 'PUBLIC'
                                    }, {
                                        $and: [{
                                            profileId: {
                                                $in: subscribers
                                            }
                                        }, {
                                            confidentiality: 'PRIVATE'
                                        }]
                                    }]
                                })
                                .limit(10)
                                .sort({
                                    _id: -1
                                });


                        } else {
                            var publicationQuery = Publication.find({
                                    $and: [{
                                        _id: {
                                            $lt: req.query.last_publication_id
                                        }
                                    }, {
                                        $or: [{
                                            confidentiality: 'PUBLIC'
                                        }, {
                                            $and: [{
                                                profileId: {
                                                    $in: subscribers
                                                }
                                            }, {
                                                confidentiality: 'PRIVATE'
                                            }]
                                        }]
                                    }]
                                })
                                .limit(10)
                                .sort({
                                    _id: -1
                                });
                        }


                        publicationQuery.exec(function(err, publications) {
                            if (err) {
                                return res.json({
                                    status: 1,
                                    message: err
                                });
                            } else {
                                var i = 0;

                                function callback() {}
                                async.each(publications, function(publication, callback) {
                                    PublicationLikes.findById(publication._id, function(err, publicationLikes) {
                                        if (publicationLikes) {
                                            publication.isLiked = publicationLikes.likes.indexOf(req.query.profileID) > -1;
                                            publication.isDisliked = publicationLikes.dislikes.indexOf(req.query.profileID) > -1;
                                        }
                                        for (j = 0; j < publication.comments.length; j++) {

                                            publication.comments[j].isLiked = publication.comments[j].likes.indexOf(req.query.profileID) > -1;
                                            publication.comments[j].isDisliked = publication.comments[j].dislikes.indexOf(req.query.profileID) > -1;

                                        }
                                        callback();
                                    });

                                }, function(err) {
                                    return res.json(publications);
                                });

                            }
                        });
                    }


                }
            });
        } catch (err) {
            console.log(" getPublicationByProfileId " + err);
            return res.json({
                err
            });
        }
    });

router.route('/getPublicationsForOneProfileByID')
    .get(function(req, res) {
        try {
            var criteria = {};
            if (!req.query.last_publication_id) {
                criteria = {
                    profileId: req.query.ProfileId
                }
            } else {
                criteria = {
                    $and: [{
                        profileId: req.query.ProfileId
                    }, {
                        _id: {
                            $lt: req.query.last_publication_id
                        }
                    }]
                }
            }

            var query = Publication.find(criteria).sort({
                _id: -1
            }).limit(10);
            query.execFind(function(err, publications) {
                if (err)
                    return res.json({
                        status: 0,
                        err: err
                    });

                else {


                    function callback() {}
                    async.each(publications, function(publication, callback) {
                        PublicationLikes.findById(publication._id, function(err, publicationLikes) {
                            if (publicationLikes) {
                                publication.isLiked = publicationLikes.likes.indexOf(req.query.connectedProfileID) > -1;
                                publication.isDisliked = publicationLikes.dislikes.indexOf(req.query.connectedProfileID) > -1;
                            }
                            for (j = 0; j < publication.comments.length; j++) {

                                publication.comments[j].isLiked = publication.comments[j].likes.indexOf(req.query.connectedProfileID) > -1;
                                publication.comments[j].isDisliked = publication.comments[j].dislikes.indexOf(req.query.connectedProfileID) > -1;

                            }
                            callback();
                        });

                    }, function(err) {
                        return res.json({
                            status: 1,
                            publication: publications
                        });
                    });

                }
            });
        } catch (err) {
            console.log(" getPublicationsForOneProfileByID " + err);
            return res.json({
                err
            });
        }
    });


router.route('/getPublicationPopulaireByProfileId')
    .get(function(req, res) {
        try {
            var publication = new Publication();
            var profileQuery = Profile.findOne({
                _id: req.query.profileID
            });
            profileQuery.exec(function(err, profile) {
                if (err) {
                    return res.json({
                        status: 1,
                        message: err
                    });
                } else {
                    if (!profile) {
                        return res.json({
                            status: 1,
                            message: "profile not found"
                        });
                    } else {
                        var subscribers = profile.subscribers;

                        if (!req.query.last_publication_id) {
                            var publicationQuery = Publication.find({
                                    $or: [{
                                        confidentiality: 'PUBLIC'
                                    }, {
                                        $and: [{
                                            profileId: {
                                                $in: subscribers
                                            }
                                        }, {
                                            confidentiality: 'PRIVATE'
                                        }]
                                    }]
                                })
                                .limit(10)
                                .sort({ nbLikes : -1 });


                        } else {
                            var publicationQuery = Publication.find({
                                    $and: [{
                                        _id: {
                                            $lt: req.query.last_publication_id
                                        }
                                    }, {
                                        $or: [{
                                            confidentiality: 'PUBLIC'
                                        }, {
                                            $and: [{
                                                profileId: {
                                                    $in: subscribers
                                                }
                                            }, {
                                                confidentiality: 'PRIVATE'
                                            }]
                                        }]
                                    }]
                                })
                                .limit(10)
                                .sort({ nbLikes : -1 });
                        } 


                        publicationQuery.exec(function(err, publications) {
                            if (err) {
                                return res.json({
                                    status: 1,
                                    message: err
                                });
                            } else {
                                var i = 0;

                                function callback() {}
                                async.each(publications, function(publication, callback) {
                                    PublicationLikes.findById(publication._id, function(err, publicationLikes) {
                                        if (publicationLikes) {
                                            publication.isLiked = publicationLikes.likes.indexOf(req.query.profileID) > -1;
                                            publication.isDisliked = publicationLikes.dislikes.indexOf(req.query.profileID) > -1;
                                        }
                                        for (j = 0; j < publication.comments.length; j++) {

                                            publication.comments[j].isLiked = publication.comments[j].likes.indexOf(req.query.profileID) > -1;
                                            publication.comments[j].isDisliked = publication.comments[j].dislikes.indexOf(req.query.profileID) > -1;

                                        }
                                        callback();
                                    });

                                }, function(err) {
                                    return res.json(publications);
                                });

                            }
                        });
                    }


                }
            });
        } catch (err) {
            console.log(" getPublicationPopulaireByProfileId " + err);
            return res.json({
                err
            });
        }
    });

router.route('/sharePublication') //publId profileId
    .post(function(req, res) {
        try {
            Publication.findById(req.body.publId, function(err, pub) {
                try {
                    console.log(4 / 0);
                    if (pub) {
                        var publication = new Publication();
                        Profile.findById(req.body.profileId, function(err, profile) {

                            if (err) {
                                return res.json({
                                    status: 1,
                                    message: err
                                });
                            } else {
                                if (!profile) {
                                    return res.json({
                                        status: 1,
                                        message: "profile not found"
                                    });
                                } else {
                                    profile.nbPublications++;
                                    profile.save();
                                    publication.profileId = req.body.profileId;
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
                                    publication.publExternalLink = pub.publExternalLink;
                                    publication.publPictureLink = pub.publPictureLink;
                                    publication.publyoutubeLink = pub.publyoutubeLink;
                                    publication.isShared = true;
                                    publication.nbLikes = 0;
                                    publication.nbDislikes = 0;
                                    publication.nbSignals = 0;
                                    publication.nbComments = 0;
                                    var publicationLikes = new PublicationLikes();
                                    publication.save();
                                    publicationLikes._id = publication._id;
                                    publicationLikes.save();
                                    pub.nbShare++;
                                    pub.save();
                                    return res.json({
                                        status: 1,
                                        message: 'publication shared',
                                        publication: publication
                                    });
                                }

                            }

                        });
                    } else {
                        return res.json({
                            status: 0,
                            message: 'publication not found'
                        });
                    }
                } catch (err) {
                    console.log(" getOpenGraphData " + err);
                    return res.json({
                        err
                    });
                }

            });
        } catch (err) {
            console.log(" sharePublication " + err);
            return res.json({
                err
            });
        }

    });


router.route('/masquerPublicationAdmin') //publId
    .post(function(req, res) {
        try {
            Profile.findById(req.body.userID, function(err, profile) {

                if (!profile) {
                    return res.json({
                        status: 0,
                        message: 'profile not found'
                    });
                } else if (profile.isAdmin == 1) {
                    Publication.findById(req.body.publId, function(err, publication) {
                        if (err) {
                            return res.json({
                                status: 0,
                                err: err
                            });
                        } else if (!publication) {
                            return res.json({
                                status: 0,
                                message: "publication not found"
                            });
                        } else {
                            publication.confidentiality = "PRIVATE";
                            publication.save();
                            return res.json({
                                status: 1,
                                publication: publication
                            });
                        }
                    });
                } else {
                    res.json({
                        status: 0,
                        message: ' not authorized '
                    });
                }

            });
        } catch (err) {
            console.log(" masquerPublicationAdmin " + err);
            return res.json({
                err
            });
        }
    });

router.route('/updatePublication') //publId
    .post(function(req, res) {
        Publication.findById(req.body.publId, function(err, publication) {
            if (err) {
                return res.json({
                    status: 0,
                    err: err
                });
            } else if (!publication) {
                return res.json({
                    status: 0,
                    message: "publication not found"
                });
            } else {
                publication.publTitle = req.body.publTitle;
                publication.publText = req.body.publText;
                publication.save();

                return res.json({
                    status: 1,
                    publication: publication
                });



            }
        });
    });


router.route('/getOpenGraphData')

.get(function(req, res) {
    try {
        ogs({
                url: req.query.url,
                timeout: 8000
            },
            function(er, results) {
                res.json({
                    results
                });
            }
        );
    } catch (err) {
        console.log(" getOpenGraphData " + err);
        return res.json({
            err
        });
    }

});

router.route('/getPublicationMeta')
    .get(function(req, res) {
        Publication.findById(req.query.publId, function(err, publication) {

            if (err) {
                return res.json({
                    status: 0,
                    err: err
                });
            } else if (!publication) {
                return res.json({
                    status: 0,
                    message: "publication not found"
                });
            } else {
                try {
                    if (publication.publText == "undefined") {
                        publication.publText = "";
                    }
                    if (publication.publPictureLink) {

                        var dimensions = sizeOf('/var/www/html/images/' + publication.publPictureLink);

                        var title = "Speegar";
                        if (publication.publTitle != "null") {
                            title = publication.publTitle;
                        }
                        return res.json({
                            title: title,
                            description: publication.publText,
                            profile: publication.profileFirstName + " " + publication.profileLastName,
                            image: properties.get('pictures.link') + publication.publPictureLink,
                            height: dimensions.height,
                            width: dimensions.width
                        });

                    } else if (publication.publyoutubeLink.includes("youtube")) {
                        var title = "Speegar";
                        if (publication.publTitle != "null") {
                            title = publication.publTitle;
                        }
                        var description = "";
                        if (publication.publText != "") {
                            description = publication.publText;
                        }
                        ogs({
                                url: publication.publyoutubeLink,
                                timeout: 8000
                            },
                            function(er, results) {
								if (results.data) {
                                
									if (description == "") {
										description = results.data.ogTitle;
									}
								}
                                return res.json({
                                    title: title,
                                    description: description,
                                    profile: publication.profileFirstName + " " + publication.profileLastName,
                                    image: results.data.ogImage.url,
                                    height: results.data.ogVideo.height,
                                    width: results.data.ogVideo.width
                                });
                            }
                        );
                    } else if (publication.publExternalLink) {
                        var title = "Speegar";
                        if (publication.publTitle != "null") {
                            title = publication.publTitle;
                        }
                        var description = "";
                        if (publication.publText != "") {
                            description = publication.publText;
                        }
                        ogs({
                                url: publication.publExternalLink,
                                timeout: 8000
                            },
                            function(er, results) {
								if(results.data){
									if (description == "") {
										description = results.data.ogDescription;
									}
									if (title == "Speegar" && results.data.ogTitle) {
										title = results.data.ogTitle;
									}
									
									return res.json({
										title: title,
										description: description,
										profile: publication.profileFirstName + " " + publication.profileLastName,
										image: results.data.ogImage.url,
										height: results.data.ogImage.height,
										width: results.data.ogImage.width
									});
								}

                            }
                        );
                    } else {
                        var title = "Speegar";
                        if (publication.publTitle != "null") {
                            title = publication.publTitle;
                        }
                        return res.json({
                            title: title,
                            description: publication.publText,
                            profile: publication.profileFirstName + " " + publication.profileLastName,
                            image: properties.get('pictures.link')+"speegar.png",
                            height: 161,
                            width: 201
                        });
                    }
                } catch (err) {
                    console.log(" getOpenGraphData " + err);
                    return res.json({
                        err
                    });
                }

            }
        });


    });
module.exports = router;