var express = require('express');
var passport = require('passport');
var flash    = require('connect-flash');
var passwordHash = require('password-hash');
var jwt  = require('jsonwebtoken');
var Cookies = require( "cookies" );


var email = require('emailjs')
var nodemailer = require("nodemailer");
var smtpTransport = require('nodemailer-smtp-transport');


var router = express.Router();

var Comment = require('../models/Comment');
var Publication = require('../models/Publication');
var Profile = require('../models/Profile');
var ProfilesPasswords = require('../models/profilesPasswords');
var PublicationLikes = require('../models/PublicationLikes');

var PropertiesReader = require('properties-reader');
var properties = PropertiesReader('/usr/local/properties.file');


var app = express();
var jwt = require('jsonwebtoken'); // used to create, sign, and verify tokens
var jwtScript = require('../public/javascripts/jwtScript');
const util = require('util');

require('./passport')(passport); // pass passport for configuration


router.route('/signin')

.post(function(req, res) {
    // find the user
    Profile.findOne({
        email: req.body.email
    }, function(err, user) {
		
        if (err) res.json({
            status: 3,
            message: err
        });

        if (!user) {
            res.json({
                status: 2,
                message: 'Authentication failed. User not found.'
            });
        } else if (user) {
			ProfilesPasswords.findById(user.id, function(err,profilePassword) {
				// check if password matches
				if(profilePassword){
					if (!(passwordHash.verify(req.body.password,profilePassword.password))) {
						res.json({
							status: 1,
							message: 'Authentication failed. Wrong password.'
						});
					} else {

						var jwtSecret = properties.get('security.jwt.secret').toString();
						var token = jwt.sign(user.toObject(), jwtSecret, {});

						//new Cookies(req,res).set('ACCESS_TOKEN_COOKIE',token, {
						//	httpOnly: true, //cookie not available through client js code
						//	secure: false // true to force https
						//});
						//res.setHeader('X_SECRET', jwtSecret);

						user.isNewInscri="false";

						res.json({
							status: 0,
							token : token,
							user : user
						});
					}
			}
			});
        }

    });
});

router.route('/signup')

.post(function(req, res) {
	
	
	var email = req.body.email+"";
    var profile = new Profile(); // create a new instance of the Profile model
    if (email == "" || email == "undefined")
        res.json({
            status: 1,
            message: "Email not found"
        });
    else {
        Profile.findOne({
            email: req.body.email
        }, function(err, user) {
            if (err)
                res.json({
                    status: 1,
                    message: err
                });

            else if (user) {
                res.json({
                    status: 1,
                    message: 'Email existe deja'
                });
            } else {
                profile.firstName = req.body.firstName;
                profile.lastName = req.body.lastName;
                profile.email = req.body.email;
                profile.nbSubscribers = 0;
                profile.nbSuivi = 0;
                profile.nbPublications = 0;
                profile.nbLikes = 0;
                profile.nbNotificationsNotSeen = 0;
                profile.isAdmin = 0;
				profile.name = profile.firstName+' '+profile.lastName;
				profile.dateInscription = new Date().toJSON().slice(0,10);
				var d = new Date();
				var n = d.getTime();
				if(n%3==0){
					profile.profilePicture= properties.get('pictures.avatars.link')+"alien.png";
					profile.profilePictureMin=properties.get('pictures.avatars.link')+"alien_min.png";
				}
				else if(n%3==1){
					profile.profilePicture=properties.get('pictures.avatars.link')+"clown1.png";
					profile.profilePictureMin=properties.get('pictures.avatars.link')+"clown1_min.png";
				}
				else{
					profile.profilePicture=properties.get('pictures.avatars.link')+"clown2.png";
					profile.profilePictureMin=properties.get('pictures.avatars.link')+"clown2_min.png";
				}

				profile.save(function(err) {
					if (err){
						res.json({
							status: 1,
							message: err
						});
					}
					profile.isNewInscri="true";
					var jwtSecret = properties.get('security.jwt.secret').toString();
					var token = jwt.sign(profile.toObject(), jwtSecret, {});
					res.json({
						status: 0,
						token: token,
						user : profile
					});
				});

				var profilePassword = new ProfilesPasswords();
				profilePassword._id=profile._id;
				profilePassword.password=passwordHash.generate(req.body.password);
				profilePassword.save();
					

                
            }
        });
    }
});



router.route('/signWithFacebook')

.post(function(req, res) {
    // find the user with facebookId
    Profile.findOne({
        facebookId: req.body.facebookId
    }, function(err, user) {

        if (err) res.json({
            status: 3,
            message: err
        });

        if (!user) {
			
			var profile = new Profile();
			profile.facebookId = req.body.facebookId;
			profile.firstName = req.body.firstName;
            profile.lastName = req.body.lastName;
            profile.email = req.body.email;
            profile.nbSubscribers = 0;
            profile.nbSuivi = 0;
            profile.nbPublications = 0;
            profile.nbLikes = 0;
            profile.nbNotificationsNotSeen = 0;
			profile.isAdmin = 0;
			profile.birthday = req.body.birthday;
			profile.location = req.body.location;
			profile.gender = req.body.gender;
			profile.profilePicture = req.body.profilePicture;
			profile.profilePictureMin = req.body.profilePictureMin;
			profile.coverPicture = req.body.coverPicture;
			profile.name = profile.firstName+' '+profile.lastName;
			profile.dateInscription = new Date().toJSON().slice(0,10);
			profile.save();
			profile.isNewInscri="true";

			var jwtSecret = properties.get('security.jwt.secret').toString();
			var token = jwt.sign(profile.toObject(), jwtSecret, {});

			
                res.json({
                    status: 0,
                    token: token,
					user : profile
                });
			
        } else if (user) {
				user.isNewInscri="false";
				var jwtSecret = properties.get('security.jwt.secret').toString();
				var token = jwt.sign(user.toObject(), jwtSecret, {});

                res.json({
                    status: 0,
                    token: token,
					user : user
                });
           

        }

    });
});


router.route('/signWithGoogle')

.post(function(req, res) {
    // find the user with googleId
    Profile.findOne({
        googleId: req.body.googleId
    }, function(err, user) {

        if (err) res.json({
            status: 3,
            message: err
        });

        if (!user) {
			
			var profile = new Profile();
			profile.googleId = req.body.googleId;
			profile.firstName = req.body.firstName;
            profile.lastName = req.body.lastName;
            profile.email = req.body.email;
            profile.nbSubscribers = 0;
            profile.nbSuivi = 0;
            profile.nbPublications = 0;
            profile.nbLikes = 0;
            profile.nbNotificationsNotSeen = 0;
			profile.isAdmin = 0;
			profile.birthday = req.body.birthday;
			profile.gender = req.body.gender;
			profile.profilePicture = req.body.profilePicture;
			profile.profilePictureMin = req.body.profilePictureMin;
			profile.name = profile.firstName+' '+profile.lastName;
			profile.dateInscription = new Date().toJSON().slice(0,10);
			profile.save();
			profile.isNewInscri="true";

			var jwtSecret = properties.get('security.jwt.secret').toString();
			var token = jwt.sign(profile.toObject(), jwtSecret, {});
                res.json({
                    status: 0,
                    token: token,
					user : profile
                });
			
        } else if (user) {

                // create a token

				var jwtSecret = properties.get('security.jwt.secret').toString();
				var token = jwt.sign(user.toObject(), jwtSecret, {});
				user.isNewInscri="false";
                res.json({
                    status: 0,
                    token: token,
					user : user
                });
           

        }

    });
});


router.route('/resetPwdMail')  //email
.post(function(req, res) {
	var email = require('emailjs');
	Profile.findOne({
        email: req.body.email
        }, function(err, user) {
			if(user){

				var d = new Date();
				var n = d.getTime();
				var randomString = passwordHash.generate(user.email+user.id+n).slice(16)+user.id;

				var transporter = nodemailer.createTransport(smtpTransport({
				    host: 'speegar.com',
				    port: 25,
				    auth: {
				        user: 'contact@speegar.com',
				        pass: 'contact'
				    },
				    tls:{
				        rejectUnauthorized: false
				    }
				}));


				var mailOptions = {
				    from: "contact@speegar.com", 
				    to: user.email, 
				    subject: "Speegar Reset Password", // Subject line
				    text: 'votre liens de reinitialisation de mot de passe est  www.speegar.com/login/reset-password/'+randomString 
				}

				// send mail with defined transport object
				transporter.sendMail(mailOptions, function(error, response){
				    if(error){
				    	res.json({
							status : 1,
							message :"Error when sent mail" 
						});
				    }else{
				        res.json({
							status : 0,
							message :"mail sended"
						});
				    }
				});
				
			}else{
				res.json({
					status : 1,
					message :"Profile not found" 
				});
			}
	});
});
		

router.route('/getPublicationById/:publicationId')
    .get(function(req, res) {
        try {
            Publication.findById(req.params.publicationId, function(err, publication) {
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

                    PublicationLikes.findById(publication._id, function(err, publicationLikes) {
                        if (publicationLikes) {
                            publication.isLiked = publicationLikes.likes.indexOf(req.query.profileID) > -1;
                            publication.isDisliked = publicationLikes.dislikes.indexOf(req.query.profileID) > -1;
                        }
                        for (j = 0; j < publication.comments.length; j++) {

                            publication.comments[j].isLiked = publication.comments[j].likes.indexOf(req.query.profileID) > -1;
                            publication.comments[j].isDisliked = publication.comments[j].dislikes.indexOf(req.query.profileID) > -1;

                        }
                        return res.json({
                            status: 1,
                            publication: publication
                        });
                    });


                }
            });
        } catch (err) {
            console.log(" getPublicationById " + err);
            return res.json({
                err
            });
        }
    });
	

module.exports = router;