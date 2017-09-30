var express = require('express');
var passport = require('passport');
var flash    = require('connect-flash');
var passwordHash = require('password-hash');
var email = require('emailjs');

var router = express.Router();

var Comment = require('../models/Comment');
var Publication = require('../models/Publication');
var Profile = require('../models/Profile');
var ProfilesPasswords = require('../models/profilesPasswords');
var PublicationLikes = require('../models/PublicationLikes');


var app = express();
var jwt = require('jsonwebtoken'); // used to create, sign, and verify tokens
var jwtScript = require('../public/javascripts/jwtScript');
app.set('superSecret', 'balgard');


	require('./passport')(passport); // pass passport for configuration

	// required for passport
	//app.use(express.session({ secret: 'ilovescotchscotchyscotchscotch' })); // session secret
	/*app.use(passport.initialize()); 
	app.use(passport.session()); // persistent login sessions
	app.use(flash()); // use connect-flash for flash messages stored in session
*/



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

						// if user is found and password is right
						// create a token
						
						var token = jwt.sign(user, app.get('superSecret'), {
							//expiresIn: '1440m' // expires in 24 hours
						});
						user.isNewInscri="false";
						res.json({
							status: 0,
							token: token,
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
					profile.profilePicture="http://91.121.69.130/images/avatars/alien.png";
					profile.profilePictureMin="http://91.121.69.130/images/avatars/alien_min.png";
				}
				else if(n%3==1){
					profile.profilePicture="http://91.121.69.130/images/avatars/clown1.png";
					profile.profilePictureMin="http://91.121.69.130/images/avatars/clown1_min.png";
				}
				else{
					profile.profilePicture="http://91.121.69.130/images/avatars/clown2.png";
					profile.profilePictureMin="http://91.121.69.130/images/avatars/clown2_min.png";
				}
				profile.save(function(err) {
					if (err){
						res.json({
							status: 1,
							message: err
						});
					}
					var token = jwt.sign(profile, app.get('superSecret'), {
					});
					profile.isNewInscri="true";
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
			
			 var token = jwt.sign(profile, app.get('superSecret'), {
                    //expiresIn: '1440m' // expires in 24 hours
            });

			
                res.json({
                    status: 0,
                    token: token,
					user : profile
                });
			
        } else if (user) {

                // create a token
				
                var token = jwt.sign(user, app.get('superSecret'), {
                    //expiresIn: '1440m' // expires in 24 hours
                });
				user.isNewInscri="false";
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
			
			 var token = jwt.sign(profile, app.get('superSecret'), {
                    //expiresIn: '1440m' // expires in 24 hours
            });

			profile.isNewInscri="true";
                res.json({
                    status: 0,
                    token: token,
					user : profile
                });
			
        } else if (user) {

                // create a token
				
                var token = jwt.sign(user, app.get('superSecret'), {
                    //expiresIn: '1440m' // expires in 24 hours
                });
				user.isNewInscri="false";
                res.json({
                    status: 0,
                    token: token,
					user : user
                });
           

        }

    });
});

router.route('/signupAdmin')

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
                profile.isAdmin = 1;
				profile.name = profile.firstName+' '+profile.lastName;
				profile.dateInscription = new Date().toJSON().slice(0,10);
				profile.profilePicture="http://91.121.69.130/speegar/assets/pictures/man.png";
				profile.profilePictureMin="http://www.speegar.com/speegar/assets/pictures/manMin.png";
                
				profile.save(function(err) {
					if (err){
						res.json({
							status: 1,
							message: err
						});
					}
					var token = jwt.sign(profile, app.get('superSecret'), {
					});
					profile.isNewInscri="true";
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



router.route('/resetPwdMail')  //email

.post(function(req, res) {
	var email = require('emailjs');
	Profile.findOne({
        email: req.body.email
        }, function(err, user) {
			if(user){
				var server = email.server.connect({
				  user: 'speegartest@gmail.com',
				  password: 'lassad123',
				  host: 'smtp.gmail.com',
				  ssl: true
				});
				
				var d = new Date();
				var n = d.getTime();

				var randomString = passwordHash.generate(user.email+user.id+n).slice(16)+user.id;
				
				server.send({
				  text: 'votre liens de reinitialisation de mot de passe est  www.speegar.com/login/reset-password/'+randomString ,
				  from: 'Speegar <speegartest@gmail.com>',
				  to: user.name+' <'+user.email+'>',
				  cc: '',
				  subject: 'Speegar Reset Password'
				}, function (err, message) {					
					res.json({
						status : 1,
						randomString : randomString,
						message :"mail sended"
					});
					
				});
				
				ProfilesPasswords.findById(user._id, function(err, profilePassword) {
					if(profilePassword){
						profilePassword.resetPswdString = randomString;
						profilePassword.save();
					}
				});
				
			}else{
				res.json({
					status : 0,
					message :"Profile not found" 
				});
			}
	});
});
		
router.route('/resetPwd')  //randomString //newPassword

.post(function(req, res) {
	var idProfile = req.body.randomString.slice(-24);
            
			
	ProfilesPasswords.findById(idProfile, function(err, profilePassword) {
		if (err){
			res.send(err);
		}else if(!profilePassword){
			res.json({
				status: 1,
				message: "profile not found"
			});
		}
		else {
			if(profilePassword.resetPswdString==req.body.randomString){
				profilePassword.password=passwordHash.generate(req.body.newPassword);
				profilePassword.save();
				
				var token = jwt.sign(profilePassword, app.get('superSecret'), {
				});
				Profile.findById(idProfile, function(err, profile) {
					res.json({
						status : 1,
						token : token,
						user : profile,
						message : "password updated"
						
					});
				});
				
				profilePassword.resetPswdString = undefined;
				profilePassword.save();
			}
			else {
				res.json({
					status : 0,
						message : "rendomString not correct"
				});
			}
		}
	})
	
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