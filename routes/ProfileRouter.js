var express = require('express');
var async = require("async");
var bodyParser = require("body-parser");
var multer = require('multer');
var passwordHash = require('password-hash');

var app = express();

var router = express.Router();

var Profile = require('../models/Profile');
var Comment = require('../models/Comment');
var Publication = require('../models/Publication');
var ProfilesPasswords = require('../models/profilesPasswords');
var notificationScript = require('../public/javascripts/notificationScript');

var PropertiesReader = require('properties-reader');
var properties = PropertiesReader('/usr/local/properties.file');

router.route('/getProfileById')
    .get(function(req, res) {
        Profile.findById(req.query.ProfileId, function(err, profile) {
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
				Profile.findById(req.query.connectedProfileId, function(err, pr) {
					
					if (err){
						res.send(err);
					}
					else if (!pr){
						res.json({
							status: 1,
							message: "connected profile not found"
						});
					}
					if(pr){
						profile.isSubscribe=(pr.subscribers.indexOf(req.query.ProfileId)>-1);
					//	profile.subscribers = [];
						var user = profile.toObject();
						delete user["password"];
						res.json(user);
					}
					
				});
				
			}
        });
});


router.route('/getBlagueursPopulaires')
    .get(function(req, res) {
		
		Profile.findById(req.query.ProfileId, function(err, profile) {
            if (err)
                res.send(err);
			if(!profile){
				res.json({
					status: 0,
					message: "profile not found"
				});
			}
			else{
				var query ={ $and : [ { _id : { $nin: profile.subscribers } }, {_id : { $ne : profile._id } } ] }
				var find = Profile.find(query).sort({_id : 1});
				find.execFind( function(err, profiles) {
					if (err)
						res.json({
							status: 0,
							err : err
						});
					else{
						res.json({
							status: 1,
							profiles : profiles
						});
					}
				});
			}
        });
});


router.route('/getProfilesDecouvert')
    .get(function(req, res) {
		
		Profile.findById(req.query.ProfileId, function(err, profile) {
            if (err)
                res.send(err);
			if(!profile){
				res.json({
					status: 0,
					message: "profile not found"
				});
			}
			else{
				var query = { $and : [ { _id : { $nin: profile.subscribers } }, {_id : { $ne : profile._id } } ] }
				var find = Profile.find(query).sort({_id : -1});
				find.execFind(function(err, profiles) {
					if (err)
						res.json({
							status: 0,
							err : err
						});
					else{
						res.json({
							status: 1,
							profiles : profiles
						});
					}
				});
			}
        });
});


router.route('/subscribe')
    .post(function(req, res) {   //userID va abbonner profileId
        var query = Profile.findOne({
            _id: req.body.UserId
        });
        query.exec(function(err, profile) {
            if (err) {
				res.json({
							status: 0,
							err : err
				});
			}
			else if (!profile) {
				res.json({
							status: 0,
							message : "profile not found"
				});
			}else{
				var index = profile.subscribers.indexOf(req.body.profileId);
				if(index==-1){
					profile.subscribers.push(req.body.profileId);
					profile.nbSubscribers++;
					profile.save();
					
					Profile.findById(req.body.profileId, function(err, pr) {
						if(pr){
							pr.nbSuivi++;
							pr.save();
						}
					});
					notificationScript.notifier(req.body.profileId,"",req.body.UserId,"subscribe","");
				}
				res.json(profile);
				
							
			}
        });

    });

	
router.route('/removeSubscribe')
    .post(function(req, res) {   //userID va suprimer son abbonnement à profileId
        var query = Profile.findOne({
            _id: req.body.UserId
        });
        query.exec(function(err, profile) {
            if (err) {
				res.json({
							status: 0,
							err : err
				});
			}
			else if (!profile) {
				res.json({
							status: 0,
							message : "profile not found"
				});
			}else{
				var index = profile.subscribers.indexOf(req.body.profileId);
				if (index>-1){
					profile.subscribers.splice(index, 1);
					profile.nbSubscribers--;
				}
				
				profile.save();
				
				res.json(profile);
							
			}
        });

    });
	
	
router.route('/updateProfilePictureText')
    .post(function(req, res) {
		Profile.findById(req.body.profileId, function(err, profile) {
			if(profile){
				profile.profilePicture=req.body.picture;
				profile.save();
				res.json({
					status: 1,
					profile : profile 
				});
			}else{
				res.json({
					status: 0,
					message : "profile not found"
				});
			}
		});
		
	});	
router.route('/updateProfilePicture')
    .post(function(req, res) {
		var profile = new Profile();
		var storage = multer.diskStorage({
			destination: function(req, file, callback) {
                callback(null, '/var/www/html/images');
            },
            filename: function(req, file, callback) {
                callback(null, file.fieldname + '_' + profile._id + '_' + file.originalname);
            }
        });

        var upload = multer({
            storage: storage
                }).fields([{
                        name: 'profilePicture',
                        maxCount: 1
                    }]);
        upload(req, res, function(err) {
            if (err) {
               res.send(err.status); 
            } 
			else {
				var body = req.body;
				Profile.findById(body.profileId, function(err, profile) {
					if (err)
                    res.json({
                        status: 1,
                        message: err
                    });
					else if(!profile){
						res.json({
                        status: 1,
                        message: 'Profile not found'
						});
					}
					else {
						if (req.files.profilePicture[0]) {
						profile.profilePicture = properties.get('pictures.link')+req.files.profilePicture[0].filename;
						profile.profilePictureMin = "https://speegar.com/images/"+ req.files.profilePicture[0].filename;
						}
						profile.save();
						res.json({
							status: 0,
							profile : profile,
							message: "profile picture updated"
						});
					};
				});
            };

        });

    }); 

router.route('/updateProfile')
    .post(function(req, res) {
		
		Profile.findById(req.body.profileId, function(err, profile) {
            if (err)
                res.json({
                    status: 1, 
                    message: err
                });
			else if(!profile){
				res.json({
                    status: 1,
                    message: 'Profile not found'
				});
			}
			else{
				profile.firstName = req.body.firstName;
				profile.lastName = req.body.lastName;
				profile.gender = req.body.gender;
				profile.birthday = req.body.birthday;
				profile.about = req.body.about;
				profile.facebookLink = req.body.facebookLink;
				profile.youtubeLink = req.body.youtubeLink;
				profile.twitterLink = req.body.twitterLink;
				profile.googleLink = req.body.googleLink;
				profile.name = profile.firstName+' '+profile.lastName;
				profile.save();
				
				res.json({
							status: 1, 
							profile: profile
				});
				
				Publication.find({profileId : req.body.profileId }, function(err, publications) {
					for(i=0;i<publications.length;i++){
						publications[i].profileFirstName = req.body.firstName;
						publications[i].profileLastName = req.body.lastName;
						publications[i].save();
					}
				});
				Comment.find({profileId : req.body.profileId }, function(err, comments) {
					for(i=0;i<comments.length;i++){
						comments[i].profileFirstName = req.body.firstName;
						comments[i].profileLastName = req.body.lastName;
						comments[i].save();
					}
				});			
				
				Publication.find({}, function(err, publications) {
					for(i=0;i<publications.length;i++){
						for(j=0;j<publications[i].comments.length;j++){
							if(publications[i].comments[j].profileId==req.body.profileId){
								publications[i].comments[j].profileFirstName = req.body.firstName;
								publications[i].comments[j].profileLastName = req.body.lastName;
							}
						}
						publications[i].save();
					}
				});
		}
		});
        

    }); 
	


router.route('/updateAboutProfile') //profileId    about
    .post(function(req, res) {
		
		Profile.findById(req.body.profileId, function(err, profile) {
			if (err){
				res.json({
							status: 0,
							err: err
				});
			}else if (!profile){
				res.json({
							status: 0,
							message : "profile not found"
				});
			}else {
				profile.about=req.body.about;
				profile.save();
				res.json({
					status: 1,
					message : "profile updated"
				});
			}
			
		});
	});

	
router.route('/updatePassword') //profileId    oldPassword  newPassword
    .post(function(req, res) {
		
		Profile.findById(req.body.profileId, function(err, profile) {
			if (err){
				res.json({
							status: 0,
							err: err
				});
			}else if (!profile){   
				res.json({
							status: 0,
							message : "profile not found"
				});
			}else {
				ProfilesPasswords.findById(profile.id, function(err,profilePassword) {
					if (!(passwordHash.verify(req.body.oldPassword , profilePassword.password))){
						res.json({
									status: 0,
									message : "err password"
						});
					}
					else {
						profilePassword.password= passwordHash.generate(req.body.newPassword);
						profilePassword.save();
						res.json({
							status: 1,
							message : "password updated"
						});
					}
				});
			}	
		});
	});
	
router.route('/findProfile')
    .get(function(req, res) {
		
		
		Profile.find({ name: { $regex: req.query.ProfileName+'.*', $options: 'i' } })
		.limit(5)
		.exec( function(err, profiles) {
            if (err){
				res.json({
							status: 0,
							err: err
				});
			}
			else{
				res.json({
					status: 1,
					profiles: profiles
				});
			}
        });
	});

router.route('/getSubscribers') //profileId  lastSubscribeId  connectedProfileID
    .get(function(req, res) {
		Profile.findById(req.query.connectedProfileID, function(err, pr) {
			if(pr){
				Profile.findById(req.query.profileId, function(err, profile) {
					if(!profile){
						res.json({
								status: 0,
								message: "profile not found"
						});
					}
					else{
						var index = 0;
						if(req.query.lastSubscribeId){
							index = profile.subscribers.indexOf(req.query.lastSubscribeId);
						}
						if (index>-1){
									var limit = index +5;
									var first = index ;
									if (index >0){
										first++;;
									}
									if(limit>profile.subscribers.length){
										limit = profile.subscribers.length;
									}							 
									var subscribers = profile.subscribers.slice(first,limit);
									var result = [];
									function callback(){ }
									async.each(subscribers
										,function(subscribeId, callback){
											Profile.findById(subscribeId, function(err, subscribe) {
												if (subscribe){
													subscribe.isSubscribe=pr.subscribers.indexOf(subscribe._id)>-1;
													subscribe.subscribers=[];
													result.push(subscribe);
													callback();
												}
											});
										}
										,function(err){
											return res.json(result);
										}
									);	
						}else{
							res.json({
								status: 1,
								profiles: []
							});
						}
					}
					
				});
			}else{
				res.json({
					status: 0,
					message : "connected profil not found"
				});
			}
		});
	});	
    
router.route('/updateProfilePictureSlimAPI') //profileId //base64Data
    .post(function(req, res) {
	Profile.findById(req.body.profileId, function(err, profile) {
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
			var base64Data = req.body.base64Data.slice(req.body.base64Data.indexOf("base64")+6);
			var d = new Date();
			var n = d.getTime(); 
			var fileName = profile.id+n+".jpeg";
			require("fs").writeFile("/var/www/html/images/"+fileName, base64Data, 'base64', function(err) {
				if(err){
					res.json({
						status: 0,
						message : "an error occurred while saving picture"
					});
				}else{
					res.json({
						status: 1,
						message : "profile picture updated"
					});
					profile.profilePicture= properties.get('pictures.link')+fileName;
					profile.profilePictureMin= properties.get('pictures.link')+fileName;
					profile.save();
				}
			});
		}	

	});
});

router.route('/testKhalil') //profileId //base64Data
    .post(function(req, res) {
		console.log("*************************************************************************");
		console.log("********************************POST*************************************");
		console.log("*************************************************************************");
		console.log(req);

		console.log("*************************************************************************");
		console.log("*************************************************************************");
		console.log("*************************************************************************");
				
	});
	
router.route('/testKhalil') //profileId //base64Data
    .get(function(req, res) {
		console.log("*************************************************************************");
		console.log("*******************************GET***************************************");
		console.log("*************************************************************************");
		console.log(req);

		console.log("*************************************************************************");
		console.log("*************************************************************************");
		console.log("*************************************************************************");
				
	});
	
	
module.exports = router;