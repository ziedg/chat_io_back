

const express = require('express');
var jwt = require("jsonwebtoken");
var PropertiesReader = require("properties-reader");
var properties = PropertiesReader("./properties.file");

module.exports=(router)=>{

    router.use(function(req, res, next) {
        if (req.method === "OPTIONS") {
          next();
        } else {
          var token = req.headers["x-access-token"];
          if (token) {
            var jwtSecret = properties.get("security.jwt.secret").toString();
            jwt.verify(token, jwtSecret, function(err, decoded) {
              if (err) {
                return res.status(403).send({
                  success: false,
                  error: "Failed to authenticate token."
                });
              } else {
                req._id = decoded["_id"];
                next();
              }
            });
          } else {
            return res.status(403).send({
              success: false,
              error: "No token provided."
            });
          }
        }
      });
      


}
