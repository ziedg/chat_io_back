var express = require('express');
var router = express.Router();

var multer = require('multer');
const sharp = require('sharp');
const path = require('path')
const fs = require('fs');
const mv = require('mv')

var Comment = require('../models/Comment');
var Publication = require('../models/Publication');
const saveImage = require('../utils/save_image');
var Profile = require('../models/Profile');
var notificationScript = require('../public/javascripts/notificationScript');

var jwt = require('jsonwebtoken');
var PropertiesReader = require('properties-reader');
var properties = PropertiesReader('./properties.file');


var app = express();


// route middleware to verify a token!
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

router.route('/addComment')
    .post(function (req, res) {
        try {

            var comment = new Comment();

            var storage = multer.diskStorage({
                destination: function (req, file, callback) {
                    callback(null,  properties.get('pictures.storage.temp').toString());
                },
                filename: function (req, file, callback) {
                    callback(null, comment.id + '_' + file.originalname);
                }
            });

            var upload = multer({
                storage: storage
            }).fields([{
                name: 'publPicture',
                maxCount: 1
            }]);

            upload(req, res, function (err) {

                var body = req.body;
                comment.profileId =  req._id ;
                Profile.findById(req._id, function (err, profile) {
                    if (err) {
                        return res.json({
                            status: 3,
                            error: 'SP_ER_TECHNICAL_ERROR'
                        });
                    }
                    else if (!profile) {
                        return res.json({
                            status: 2,
                            error: 'SP_ER_PROFILE_NOT_FOUND'
                        });
                    } else {
                        comment.profileFirstName = profile.firstName;
                        comment.profileLastName = profile.lastName;
                        comment.profilePicture = profile.profilePicture;
                        comment.profilePictureMin = profile.profilePictureMin;

                        comment.publId = body.publId;
                        comment.dateComment = new Date();
                        comment.nbLikes = 0;
                        comment.nbDislikes = 0;
                        comment.nbSignals = 0;
                        comment.commentText = body.commentText;
                        comment.commentLink = body.commentLink;
                        
                        //compression of commented images...
                        
           
                      if (req.files.publPicture) 
                   
                       {
                        const commentLink=files.publPicture[0].filename;
                        comment.commentPicture =commentLink

                       }






                        comment.save(function (err) {
                            if (err) {
                                return res.json({
                                    status: 3,
                                    error: 'SP_ER_TECHNICAL_ERROR'
                                });
                            }
                            Publication.findById(comment.publId, function (err, publication) {
                                if (err) {
                                    return res.json({
                                        status: 3,
                                        error: 'SP_ER_TECHNICAL_ERROR'
                                    });
                                } else if (!publication) {
                                    return res.json({
                                        status: 2,
                                        error: 'SP_ER_PUBLICATION_NOT_FOUND'
                                    });
                                } else {
                                    publication.comments.unshift(comment);
                                    publication.nbComments++;
                                    publication.save();
                                    const response = {
                                        status: 0,
                                        message: "COMMENT_ADDED",
                                        comment: comment
                                    }
                                    saveImage(comment,req.files,res,response,"comt");
                                 

                                    notificationScript.notifier(publication.profileId, comment.publId, req._id, "comment", "");
                                }
                            });
                        });
                    }
                });
            });


        } catch (error) {
            console.log("error when addComment", error);
            return res.json({
                status: 3,
                error: 'SP_ER_TECHNICAL_ERROR'
            });
        }
    });


router.route('/likeComment')
    .post(function (req, res) {
        try {

            Comment.findById(req.body.commentId, function (err, comment) {

                if (err) {
                    return res.json({
                        status: 3,
                        error: 'SP_ER_TECHNICAL_ERROR'
                    });
                } else if (!comment) {
                    return res.json({
                        status: 2,
                        error: 'SP_ER_COMMENT_NOT_FOUND'
                    });
                } else {

                    comment.nbLikes++;
                    comment.likes.unshift(req._id);

                    Publication.findById(req.body.publId, function (err, publication) {
                        if (err) {
                            return res.json({
                                status: 3,
                                error: 'SP_ER_TECHNICAL_ERROR'
                            });
                        } else if (!publication) {
                            return res.json({
                                status: 2,
                                error: 'SP_ER_PUBLICATION_NOT_FOUND'
                            });
                        } else {
                            var j = -1;
                            for (i = 0; i < publication.comments.length; i++) {
                                if (publication.comments[i].id == req.body.commentId) {
                                    j = i;
                                }
                            }
                            if (j > -1) {
                                publication.comments[j].nbLikes++;
                                publication.comments[j].likes.unshift(req._id);
                                publication.save();
                            }
                            comment.save();
                        }

                    });

                    return res.json({
                        status: 0,
                        message: 'COMMENT_LIKED'
                    });
                };

            });

        } catch (error) {
            console.log("error when likeComment", error);
            return res.json({
                status: 3,
                error: 'SP_ER_TECHNICAL_ERROR'
            });
        }
    });

router.route('/dislikeComment')
    .post(function (req, res) {
        try {
            Comment.findById(req.body.commentId, function (err, comment) {

                if (err) {
                    return res.json({
                        status: 3,
                        error: 'SP_ER_TECHNICAL_ERROR'
                    });
                } else if (!comment) {
                    return res.json({
                        status: 2,
                        error: 'SP_ER_COMMENT_NOT_FOUND'
                    });
                } else {

                    comment.nbDislikes++;
                    comment.dislikes.unshift(req._id);

                    Publication.findById(req.body.publId, function (err, publication) {
                        if (err) {
                            return res.json({
                                status: 3,
                                error: 'SP_ER_TECHNICAL_ERROR'
                            });
                        } else if (!publication) {
                            return res.json({
                                status: 2,
                                error: 'SP_ER_PUBLICATION_NOT_FOUND'
                            });
                        } else {
                            var j = -1;
                            for (i = 0; i < publication.comments.length; i++) {
                                if (publication.comments[i].id == req.body.commentId) {
                                    j = i;
                                }
                            }
                            if (j > -1) {
                                publication.comments[j].nbDislikes++;
                                publication.comments[j].dislikes.unshift(req._id);
                                publication.save();
                            }
                            comment.save();
                        }

                    });

                    return res.json({
                        status: 0,
                        message: 'COMMENT_DISLIKED'
                    });


                }
                ;

            });


        } catch (error) {
            console.log("error when dislikeComment", error);
            return res.json({
                status: 3,
                error: 'SP_ER_TECHNICAL_ERROR'
            });
        }
    });

router.route('/removeLikeComment')
    .post(function (req, res) {
        try {
            Comment.findById(req.body.commentId, function (err, comment) {

                if (err) {
                    return res.json({
                        status: 3,
                        error: 'SP_ER_TECHNICAL_ERROR'
                    });
                } else if (!comment) {
                    return res.json({
                        status: 2,
                        error: 'SP_ER_COMMENT_NOT_FOUND'
                    });
                } else {

                    comment.nbLikes--;
                    var index = comment.likes.indexOf(req._id);
                    if (index > -1) {
                        comment.likes.splice(index, 1);
                    }

                    Publication.findById(req.body.publId, function (err, publication) {
                        if (err) {
                            return res.json({
                                status: 3,
                                error: 'SP_ER_TECHNICAL_ERROR'
                            });
                        } else if (!publication) {
                            return res.json({
                                status: 2,
                                error: 'SP_ER_PUBLICATION_NOT_FOUND'
                            });
                        } else {
                            var j = -1;
                            for (i = 0; i < publication.comments.length; i++) {
                                if (publication.comments[i].id == req.body.commentId) {
                                    j = i;
                                }
                            }

                            if (j > -1) {
                                publication.comments[j].nbLikes--;
                                var index = publication.comments[j].likes.indexOf(req._id);
                                if (index > -1) {
                                    publication.comments[j].likes.splice(index, 1);
                                }
                                publication.save();
                            }
                            comment.save();
                        }

                    });

                    return res.json({
                        status: 0,
                        message: 'LIKE_COMMENT_REMOVED'
                    });


                }
                ;

            });


        } catch (error) {
            console.log("error when removeLikeComment", error);
            return res.json({
                status: 3,
                error: 'SP_ER_TECHNICAL_ERROR'
            });
        }
    });

router.route('/removeDislikeComment')
    .post(function (req, res) {
        try {
            Comment.findById(req.body.commentId, function (err, comment) {

                if (err) {
                    return res.json({
                        status: 3,
                        error: 'SP_ER_TECHNICAL_ERROR'
                    });
                } else if (!comment) {
                    return res.json({
                        status: 2,
                        error: 'SP_ER_COMMENT_NOT_FOUND'
                    });
                } else {

                    comment.nbDislikes--;
                    var index = comment.dislikes.indexOf(req._id);
                    if (index > -1) {
                        comment.dislikes.splice(index, 1);
                    }

                    Publication.findById(req.body.publId, function (err, publication) {
                        if (err) {
                            return res.json({
                                status: 3,
                                error: 'SP_ER_TECHNICAL_ERROR'
                            });
                        } else if (!publication) {
                            return res.json({
                                status: 2,
                                error: 'SP_ER_PUBLICATION_NOT_FOUND'
                            });
                        } else {
                            var j = -1;
                            for (i = 0; i < publication.comments.length; i++) {
                                if (publication.comments[i].id == req.body.commentId) {
                                    j = i;
                                }
                            }

                            if (j > -1) {
                                publication.comments[j].nbDislikes--;
                                var index = publication.comments[j].dislikes.indexOf(req._id);
                                if (index > -1) {
                                    publication.comments[j].dislikes.splice(index, 1);
                                }
                                publication.save();
                            }
                            comment.save();
                        }

                    });

                    return res.json({
                        status: 0,
                        message: 'DISLIKE_COMMENT_REMOVED'
                    });
                }
                ;
            });


        } catch (error) {
            console.log("error when removeDislikeComment", error);
            return res.json({
                status: 3,
                error: 'SP_ER_TECHNICAL_ERROR'
            });
        }
    });
router.route('/removeComment')
    .post(function (req, res) {
        try {
            Comment.findById(req.body.commentId, function (err, comment) {
                if (err) {
                    return res.json({
                        status: 3,
                        error: 'SP_ER_TECHNICAL_ERROR'
                    });
                } else if (!comment) {
                    return res.json({
                        status: 2,
                        error: 'SP_ER_COMMENT_NOT_FOUND'
                    });
                }
                else {

                    if (!comment.profileId.equals(req._id)) {
                        return res.json({
                            status: 2,
                            error: 'SP_ER_USER_NOT_HAVE_PERMISSION'
                        });
                    }

                    comment.remove();
                    Publication.findById(req.body.publId, function (err, publication) {
                        if (err) {
                            return res.json({
                                status: 3,
                                error: 'SP_ER_TECHNICAL_ERROR'
                            });
                        } else if (publication) {
                            for (i = 0; i < publication.comments.length; i++) {
                                if (publication.comments[i].id == req.body.commentId) {
                                    publication.comments.splice(i, 1);
                                    break;
                                }
                            }
                            publication.save();
                            return res.json({
                                status: 0,
                                message: 'COMMENT_REMOVED'
                            });
                        }
                    });

                }
            });

        } catch (error) {
            console.log("error when removeComment", error);
            return res.json({
                status: 3,
                error: 'SP_ER_TECHNICAL_ERROR'
            });
        }
    });


module.exports = router;