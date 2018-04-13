var express = require("express");
var passport = require("passport");
var passwordHash = require("password-hash");
var format = require("date-format");
var email = require("emailjs");
var nodemailer = require("nodemailer");
var smtpTransport = require("nodemailer-smtp-transport");
var jwt = require("jsonwebtoken");
var legit = require("legit");
var emailCheck = require("email-check");
var router = express.Router();
const download = require('image-downloader')
var path = require('path');
var sharp = require('sharp');
const fs = require('fs');

var Profile = require("../models/Profile");
var ProfilesPasswords = require("../models/profilesPasswords");
var PublicationLikes = require("../models/PublicationLikes");

var PropertiesReader = require("properties-reader");
var properties = PropertiesReader("./properties.file");

var app = express();

require("./passport")(passport); // pass passport for configuration

router
  .route("/signin")

  .post(function(req, res) {
    try {
      Profile.findOne(
        {
          email: req.body.email
        },
        function(err, user) {
          if (err)
            res.json({
              status: 3,
              error: "SP_ER_TECHNICAL_ERROR"
            });
          else if (!user) {
            res.json({
              status: 2,
              error: "SP_ER_USER_NOT_FOUND"
            });
          } else {
            ProfilesPasswords.findById(user.id, function(err, profilePassword) {
              // check if password matches
              if (profilePassword) {
                if (
                  !passwordHash.verify(
                    req.body.password,
                    profilePassword.password
                  )
                ) {
                  res.json({
                    status: 1,
                    error: "SP_ER_WRONG_PASSWORD"
                  });
                } else {
                  user.isNewInscri = "false";
                  var jwtSecret = properties
                    .get("security.jwt.secret")
                    .toString();
                  var token = jwt.sign(user.toObject(), jwtSecret, {});

                  res.json({
                    status: 0,
                    token: token,
                    user: user
                  });
                }
              }
            });
          }
        }
      );
    } catch (error) {
      console.log(" error when sign in ", error);
      return res.json({
        status: 3,
        error: "SP_ER_TECHNICAL_ERROR"
      });
    }
  });

router
  .route("/signup")

  .post(function(req, res) {
    try {
      if (!req.body.email) {
        res.json({
          status: 1,
          error: "SP_FV_ER_EMAIL_SBN_EMPTY"
        });
        return;
      }

      if (!req.body.firstName) {
        res.json({
          status: 1,
          error: "SP_FV_ER_FIRST_NAME_SBN_EMPTY"
        });
        return;
      }

      if (!req.body.lastName) {
        res.json({
          status: 1,
          error: "SP_FV_ER_LAST_NAME_SBN_EMPTY"
        });
        return;
      }

      if (!req.body.password || req.body.password.length < 5) {
        res.json({
          status: 1,
          error: "SP_FV_ER_PASSWORD_SBN_EMPTY"
        });
        return;
      }

      var email = req.body.email;

      //verifier l'existance de domains(RX domain)
      legit(email, function(err, validation, addresses) {
        if (validation == true) {
          emailCheck(email)
            .then(exist => {
              //email exist   with a real domain

              var profile = new Profile();

              Profile.findOne(
                {
                  email: req.body.email
                },
                function(err, user) {
                  if (err) {
                    res.json({
                      status: 3,
                      error: "SP_ER_TECHNICAL_ERROR"
                    });
                    return;
                  }
                  if (user) {
                    res.json({
                      status: 1,
                      error: "SP_ER_EMAIL_ALREADY_EXISTS"
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
                    profile.name = profile.firstName + " " + profile.lastName;
                    profile.dateInscription = new Date().toJSON().slice(0, 10);
                    var d = new Date();
                    var n = d.getTime();
                    if (n % 3 == 0) {
                      profile.profilePicture =
                        properties.get("pictures.avatars.link") + "alien.png";
                      profile.profilePictureMin =
                        properties.get("pictures.avatars.link") +
                        "alien_min.png";
                    } else if (n % 3 == 1) {
                      profile.profilePicture =
                        properties.get("pictures.avatars.link") + "clown1.png";
                      profile.profilePictureMin =
                        properties.get("pictures.avatars.link") +
                        "clown1_min.png";
                    } else {
                      profile.profilePicture =
                        properties.get("pictures.avatars.link") + "clown2.png";

                      profile.profilePictureMin =
                        properties.get("pictures.avatars.link") +
                        "clown2_min.png";
                    }

                    profile.save(function(err) {
                      if (err) {
                        res.json({
                          status: 1,
                          message: err
                        });
                      }
                      profile.isNewInscri = "true";
                      var jwtSecret = properties
                        .get("security.jwt.secret")
                        .toString();
                      var token = jwt.sign(profile.toObject(), jwtSecret, {});
                      res.json({
                        status: 0,
                        token: token,
                        user: profile
                      });
                    });

                    var profilePassword = new ProfilesPasswords();
                    profilePassword._id = profile._id;
                    profilePassword.password = passwordHash.generate(
                      req.body.password
                    );
                    profilePassword.save();
                  }
                }
              );

             
            })
            .catch(e => {
              res.json({
                status: 3,
                error: "Email n'est pas Valide"
              });
            });
        } else {
          res.json({
            status: 3,
            error: "Domaine n'existe Pas"
          });
        }
      });
    } catch (error) {
      console.log(" error when sign up ", error);
      return res.json({
        status: 3,
        error: "SP_ER_TECHNICAL_ERROR"
      });
    }
  });

router
  .route("/signWithFacebook")


  .post(function(req, res) {
    // find the user with facebookId


    Profile.findOne(
      {
        facebookId: req.body.facebookId
      },
      function(err, user) {
        if (err)
          res.json({
            status: 3,
            message: err
          });

        if (!user) {
            const options = {
                url: req.body.profilePicture,
                dest: `${properties.get('pictures.storage.temp')}/${req.body.facebookId}.jpeg`
            }
            const options2 = {
                url: req.body.profilePictureMin,
                dest: `${properties.get('pictures.storage.temp')}/${req.body.facebookId}_min.jpeg`
            }

            download.image(options)
                .then(({ filename, image }) => {
                    console.log('File saved to', filename);
                    sharp(filename)
                        .resize(1000)
                        .toFile(`/var/www/html/images/${req.body.facebookId}.jpeg`, (err) => {
                            if (!err) {
                                return fs.unlink(filename, (e) => {
                                    if (!e) {
                                        console.log('done')
                                    }
                                    else {
                                        console.log('error ocured when attempt to remove file')
                                    }
                                })

                            }
                            console.log(err)

                        })
                }).catch((err) => {
                throw err
            })
            download.image(options2)
                .then(({ filename, image }) => {
                    console.log('File saved to', filename);
                    sharp(filename)
                        .resize(60)
                        .toFile(`/var/www/html/images/${req.body.facebookId}_min.jpeg`, (err) => {
                            if (!err) {
                                return fs.unlink(filename, (e) => {
                                    if (!e) {
                                        console.log('done')
                                    }
                                    else {
                                        console.log('error ocured when attempt to remove file')
                                    }
                                })

                            }
                            console.log(err)

                        })
                }).catch((err) => {
                throw err
            })


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
          profile.name = profile.firstName + " " + profile.lastName;
          profile.dateInscription = new Date().toJSON().slice(0, 10);
          profile.save();
          profile.isNewInscri = "true";

          var jwtSecret = properties.get("security.jwt.secret").toString();
          var token = jwt.sign(profile.toObject(), jwtSecret, {});

          return res.json({
            status: 0,
            token: token,
            user: profile
          });
        } else if (user) {
          user.isNewInscri = "false";
          var jwtSecret = properties.get("security.jwt.secret").toString();
          var token = jwt.sign(user.toObject(), jwtSecret, {});

          return res.json({
            status: 0,
            token: token,
            user: user
          });
        }
      }
    );
  });

router
  .route("/signWithGoogle")

  .post(function(req, res) {
    // find the user with googleId
    Profile.findOne(
      {
        googleId: req.body.googleId
      },
      function(err, user) {
        if (err)
          res.json({
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
          profile.name = profile.firstName + " " + profile.lastName;
          profile.dateInscription = new Date().toJSON().slice(0, 10);
          profile.save();
          profile.isNewInscri = "true";

          var jwtSecret = properties.get("security.jwt.secret").toString();
          var token = jwt.sign(profile.toObject(), jwtSecret, {});
          res.json({
            status: 0,
            token: token,
            user: profile
          });
        } else if (user) {
          // create a token

          var jwtSecret = properties.get("security.jwt.secret").toString();
          var token = jwt.sign(user.toObject(), jwtSecret, {});
          user.isNewInscri = "false";
          res.json({
            status: 0,
            token: token,
            user: user
          });
        }
      }
    );
  });

router.route("/resetPwdMail").post(function(req, res) {
  try {
    if (!req.body.email) {
      res.json({
        status: 1,
        error: "SP_FV_ER_EMAIL_SBN_EMPTY"
      });
      return;
    }
    var email = require("emailjs");
    Profile.findOne(
      {
        email: req.body.email
      },
      function(err, user) {
        if (err) {
          res.json({
            status: 3,
            error: "SP_ER_TECHNICAL_ERROR"
          });
          return;
        }
        if (!user) {
          res.json({
            status: 1,
            error: "SP_ER_FP_USER_NOT_FOUND"
          });
        } else {
          var date = new Date();
          var time = date.getTime();
          var randomString =
            passwordHash.generate(user.email + user.id + time).slice(16) +
            user.id;
          ProfilesPasswords.findById(user._id, function(err, profilePassword) {
            if (profilePassword) {
              profilePassword.resetPswdString = randomString;
              profilePassword.save();
            }
          });
          var transporter = nodemailer.createTransport(
            smtpTransport({
              host: properties.get("email.transporter.host").toString(),
              port: properties.get("email.transporter.port"),
              auth: {
                user: properties.get("email.transporter.auth.user").toString(),
                pass: properties.get("email.transporter.auth.pass").toString()
              },
              tls: {
                rejectUnauthorized: false
              }
            })
          );
          var mailOptions = {
            from: properties.get("email.reset.password.from").toString(),
            to: user.email,
            subject: properties.get("email.reset.password.subject").toString(),
            html:
              properties
                .get("email.reset.password.html")
                .toString()
                .replace(
                  "RESET_PWD_DATE_TIME",
                  format.asString("le dd/MM/yyyy à hh:mm", date)
                ) +
              s
                .get("email.reset.password.url")
                .toString()
                .replace("RANDOM_STRING", randomString)
          };
          transporter.sendMail(mailOptions, function(error, response) {
            if (error) {
              res.json({
                status: 1,
                error: "SP_ER_EMAIL_NOT_VALID"
              });
              return;
            } else {
              res.json({
                status: 0,
                message: "EMAIL_IS_SENT"
              });
            }
          });
        }
      }
    );
  } catch (error) {
    console.log(" error when reset password", error);
    return res.json({
      status: 3,
      error: "SP_ER_TECHNICAL_ERROR"
    });
  }
});

router.route("/resetPwd").post(function(req, res) {
  try {
    if (!req.body.newPassword || req.body.newPassword.length < 5) {
      res.json({
        status: 1,
        error: "SP_FV_ER_PASSWORD_SBN_EMPTY"
      });
      return;
    }

    var idProfile = req.body.randomString.slice(-24);
    ProfilesPasswords.findById(idProfile, function(err, profilePassword) {
      if (err) {
        res.json({
          status: 3,
          error: "SP_ER_TECHNICAL_ERROR"
        });
        return;
      }
      if (!profilePassword) {
        res.json({
          status: 1,
          error: "SP_ER_FP_USER_NOT_FOUND"
        });
      } else {
        if (profilePassword.resetPswdString == req.body.randomString) {
          profilePassword.password = passwordHash.generate(
            req.body.newPassword
          );
          profilePassword.resetPswdString = undefined;
          profilePassword.save();

          res.json({
            status: 0,
            message: "PASSWORD_UPDATED"
          });
        } else {
          res.json({
            status: 1,
            error: "SP_ER_RESET_LINK_EXPIRED"
          });
        }
      }
    });
  } catch (error) {
    console.log(" error when reset password", error);
    return res.json({
      status: 3,
      error: "SP_ER_TECHNICAL_ERROR"
    });
  }
});

module.exports = router;
