 var jwt = require('jsonwebtoken');
 var express = require('express');
 var app = express();
 app.set('superSecret', 'balgard');

 module.exports = {
     JWT: function(req, res, next) {

         // check header or url parameters or post parameters for token
         var token = req.headers['token'];
         // decode token
         if (token) {

             // verifies secret and checks exp
             jwt.verify(token, app.get('superSecret'), function(err, decoded) {
                 if (err) {
                     return res.json({
                         status: 0,
                         message: 'Failed to authenticate token.'
                     });
                 } else {
                     // if everything is good, save to request for use in other routes
                     req.decoded = decoded;
                     next();
                 }
             });

         } else {

             // if there is no token
             // return an error
             return res.status(403).send({
                 status: 0,
                 message: 'No token provided.'
             });

         }
     }
 };