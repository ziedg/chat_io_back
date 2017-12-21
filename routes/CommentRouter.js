var express = require('express');
var router = express.Router();

var multer = require('multer');

var Comment = require('../models/Comment');
var Publication = require('../models/Publication');
var Profile = require('../models/Profile');
var notificationScript = require('../public/javascripts/notificationScript');

var jwt = require('jsonwebtoken');
var PropertiesReader = require('properties-reader');
var properties = PropertiesReader('./properties.file');


var app = express();



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

router.route('/addComment')

.post(function(req, res) {
    var comment = new Comment(); // create a new instance of the comment model

    var storage = multer.diskStorage({
        destination: function(req, file, callback) {
            callback(null, '/var/www/html/images');
        },
        filename: function(req, file, callback) {
            callback(null, comment.id + '_' + file.originalname);
        }
    });

    var upload = multer({
        storage: storage
    }).fields([{
        name: 'commentPicture',
        maxCount: 1
    }]);
	
	upload(req, res, function(err) {
		
		var body = req.body;
		comment.profileId = body.profileId;
		Profile.findById(body.profileId, function(err, profile) {
			if (err){
				res.json({
					status: 1,
					message: err
				});
			}
			else if (!profile){
				res.json({
					status: 1,
					message: "profile not found"
				});
			}
			else {
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
				if(req.files){
					if(req.files.commentPicture){
						comment.commentPicture = req.files.commentPicture[0].filename;
					}
				}
				comment.save(function(err) {
					if (err)
						res.json({
							status: 1,
							message: err
						});
					Publication.findById(comment.publId, function(err, publication) {
						if (err)
							res.json({
								status: 1,
								message: err
							});
						else if(!publication){
							res.json({
								status: 0,
								message: "publication not found"
							});
						}
						else if (publication.comments.length <10){
							publication.comments.unshift(comment);
							publication.nbComments++;
							publication.save();
							res.json({
								status: 1,
								message: "comment added",
								comment : comment
							});	
							
							notificationScript.notifier(publication.profileId,comment.publId,body.profileId,"comment","");	
						}
						else {
							publication.comments.pop();
							publication.comments.unshift(comment); 
							publication.nbComments++;
							publication.save();
							res.json({
								status: 1,
								message: "comment added",
								comment : comment
							});	
							
							notificationScript.notifier(publication.profileId,comment.publId,body.profileId,"comment","");	
						}
					});
				});
			}
		});
	});

});

router.route('/likeComment') // commentId   publId    profileId 

.post(function(req, res) {
	
	// on recuppere le commentaire et on incremente nblike et on push le profileId dans la liste
	
	Comment.findById(req.body.commentId, function(err,comment) {

            if (err){
                return res.json({
					status : 0,
					err: err
				});		
			}
			else if (!comment){
				return res.json({
					status : 0,
					message: 'comment not found'
				});
			}
			else {	
	
				comment.nbLikes++;
				comment.likes.unshift(req.body.profileId);
				
				Publication.findById(req.body.publId, function(err, publication) {
					if (err){
						return res.json({
							status : 0,
							err: err
						});		
					}
					else if (!publication){
						return res.json({
							status : 0,
							message: 'Publication not found'
						});
					}
					else {
						var j = -1;
						for(i=0;i<publication.comments.length ;i++ ){
							if(publication.comments[i].id == req.body.commentId){
								j=i;
							}
						}
						if(j>-1){
							publication.comments[j].nbLikes++;
							publication.comments[j].likes.unshift(req.body.profileId);
							publication.save();
						}
						comment.save();
					}
				
			});
			
			return res.json({
				status : 1,
				message: 'comment liked'
			});
		
		 
	};
	
	});
	
});


router.route('/dislikeComment') // commentId   publId    profileId 

.post(function(req, res) {
	
	// on recuppere le commentaire et on incremente nblike et on push le profileId dans la liste
	
	Comment.findById(req.body.commentId, function(err,comment) {

            if (err){
                return res.json({
					status : 0,
					err: err
				});		
			}
			else if (!comment){
				return res.json({
					status : 0,
					message: 'comment not found'
				});
			}
			else {	
	
				comment.nbDislikes++;
				comment.dislikes.unshift(req.body.profileId);
				
				Publication.findById(req.body.publId, function(err, publication) {
					if (err){
						return res.json({
							status : 0,
							err: err
						});		
					}
					else if (!publication){
						return res.json({
							status : 0,
							message: 'Publication not found'
						});
					}
					else {
						var j = -1;
						for(i=0;i<publication.comments.length ;i++ ){
							if(publication.comments[i].id == req.body.commentId){
								j=i;
							}
						}
						if(j>-1){
							publication.comments[j].nbDislikes++;
							publication.comments[j].dislikes.unshift(req.body.profileId);
							publication.save();
						}
						comment.save();
					}
				
			});
			
			return res.json({
				status : 1,
				message: 'comment disliked'
			});
		
		 
	};
	
	});
	
});

router.route('/removeLikeComment') // commentId   publId    profileId 

.post(function(req, res) {
	
	// on recuppere le commentaire et on incremente nblike et on push le profileId dans la liste
	
	Comment.findById(req.body.commentId, function(err,comment) {

            if (err){
                return res.json({
					status : 0,
					err: err
				});		
			}
			else if (!comment){
				return res.json({
					status : 0,
					message: 'comment not found'
				});
			}
			else {	
	
				comment.nbLikes--;
				var index = comment.likes.indexOf(req.body.profileId);
				if (index > -1) {
					comment.likes.splice(index, 1);
				}
				
				Publication.findById(req.body.publId, function(err, publication) {
					if (err){
						return res.json({
							status : 0,
							err: err
						});		
					}
					else if (!publication){
						return res.json({
							status : 0,
							message: 'Publication not found'
						});
					}
					else {
						var j = -1;
						for(i=0;i<publication.comments.length ;i++ ){
							if(publication.comments[i].id == req.body.commentId){
								j=i;
							}
						}
		
						if(j>-1){
							publication.comments[j].nbLikes--;
							var index = publication.comments[j].likes.indexOf(req.body.profileId);
							if (index > -1) {
								publication.comments[j].likes.splice(index, 1);
							}
							publication.save();
						}
						comment.save();
					}
				
			});
			
			return res.json({
				status : 1,
				message: 'comment like removed'
			});
		
		 
	};
	
	});
	
});


router.route('/removeDislikeComment') // commentId   publId    profileId 

.post(function(req, res) {
	
	// on recuppere le commentaire et on incremente nblike et on push le profileId dans la liste
	
	Comment.findById(req.body.commentId, function(err,comment) {

            if (err){
                return res.json({
					status : 0,
					err: err
				});		
			}
			else if (!comment){
				return res.json({
					status : 0,
					message: 'comment not found'
				});
			}
			else {	
	
				comment.nbDislikes--;
				var index = comment.dislikes.indexOf(req.body.profileId);
				if (index > -1) {
					comment.dislikes.splice(index, 1);
				}
				
				Publication.findById(req.body.publId, function(err, publication) {
					if (err){
						return res.json({
							status : 0,
							err: err
						});		
					}
					else if (!publication){
						return res.json({
							status : 0,
							message: 'Publication not found'
						});
					}
					else {
						var j = -1;
						for(i=0;i<publication.comments.length ;i++ ){
							if(publication.comments[i].id == req.body.commentId){
								j=i;
							}
						}
		
						if(j>-1){
							publication.comments[j].nbDislikes--;
							var index = publication.comments[j].dislikes.indexOf(req.body.profileId);
							if (index > -1) {
								publication.comments[j].dislikes.splice(index, 1);
							}
							publication.save();
						}
						comment.save();
					}
				
			});
			
			return res.json({
				status : 1,
				message: 'comment dislike removed'
			});
		
		 
	};
	
	});
	
});

router.route('/removeComment')

.post(function(req, res) { // commentId  // publId
	Comment.findById(req.body.commentId, function(err,comment) {
		if (err){
                return res.json({
					status : 0,
					err: err
				});		
		}
		else if (!comment){
				return res.json({
					status : 0,
					message: 'comment not found'
				});
		}
		else {	
			comment.remove();	
			Publication.findById(req.body.publId, function(err, publication) {
				if (err){
					return res.json({
						status : 0,
						err: err
					});		
				}
				else if (publication){
					for(i=0; i<publication.comments.length; i++){
						if(publication.comments[i].id==req.body.commentId){
							publication.comments.splice(i, 1);
							break;
						}
					}
					publication.save();
					return res.json({
						status : 1,
						message: 'comment removed'
					});
				}
			});
			
		}
	});
});

router.route('/removeCommentAdmin')

.post(function(req, res) { // commentId  // publId  //userID
	Profile.findById(req.body.userID, function(err, profile) {
		if(!profile){
			return res.json({
				status : 0,
				message: 'profile not found'
			});
		}
		else if(profile.isAdmin==1){
			Comment.findById(req.body.commentId, function(err,comment) {
				if (err){
						return res.json({
							status : 0,
							err: err
						});		
				}
				else if (!comment){
						return res.json({
							status : 0,
							message: 'comment not found'
						});
				}
				else {	
					comment.remove();	
					Publication.findById(req.body.publId, function(err, publication) {
						if (err){
							return res.json({
								status : 0,
								err: err
							});		
						}
						else if (publication){
							for(i=0; i<publication.comments.length; i++){
								if(publication.comments[i].id==req.body.commentId){
									publication.comments.splice(i, 1);
									break;
								}
							}
							publication.save();
							notificationScript.notifier(publication.profileId,publication.profileId,publication.profileId,"removeComment","");
							return res.json({
								status : 1,
								message: 'comment removed'
							});
						}
					});
					
				}
			});
		}
		else{
				res.json({
					status : 0,
					message: ' not authorized '
				});
		}
	});
});


module.exports = router;