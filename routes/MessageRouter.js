var express = require('express');
var router = express.Router();
var Message = require('../models/Message');
var Profile = require('../models/Profile')
var PropertiesReader = require('properties-reader');
var properties = PropertiesReader('./properties.file');
var jwt = require('jsonwebtoken');

var Messaging = require('../messaging/messaging');

// route middleware to verify a token
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

router.route('/messages/:_id').get(function (req, res) {
    var _id = req.params._id;
    Message.getMessage(_id, (err, message) => {
		if(err){
			return res.json({
                status: 3,
                error: 'SP_ER_TECHNICAL_ERROR'
            });
        }
		res.json(message);
	});
    }
);

router.route('/messages').get(function (req, res) {
    var limit = req.query.limit;
    var page = req.query.page ;
    Message.getMessagesList((err, messages) => {
		if(err){
			return res.json({
                status: 3,
                error: 'SP_ER_TECHNICAL_ERROR'
            });
		}
		res.json(messages);
	}, limit, page);
    }
);


router.route('/messages/:fromUser/:toUser').get(function (req, res) {
    var fromUser = req.params.fromUser;
    var toUser = req.params.toUser;
   
    /*
    A revenir apres dans des versions ultérieures
    var limit = req.query.limit;
    var page = req.query.page ;
    */
    Message.getMessages(fromUser, toUser, (err, messages) => {
        if(err){
            return res.json({
                status: 3,
                error: 'SP_ER_TECHNICAL_ERROR'
            });
        }
        res.json(messages); 
    }
);
});

router.route('/messages').post(function (req, res) {
        var admin = require('../app');
        var message = req.body;
        console.log('new message   ' + message)
        Message.addMessage(message, (err, message) => {
            if(err){
                console.log(err)
                return res.json({
                    status: 3,
                    error: 'SP_ER_TECHNICAL_ERROR'
                });
                
            }
            Messaging.sendMessage(message);
            res.json(message);
        });
    });

//Delete Message

router.route('/messages').delete(function (req, res) {
    var id = req.body._id;
    Message.removeMessage(id, (err, message) => {
        if(err){
            return res.json({
                status: 3,
                error: 'SP_ER_TECHNICAL_ERROR'
            });
        }
        res.json(message);
    });
});

//Update Message
router.route('/messages/:_id').put( (req, res) => {
	var id = req.params._id;
	Message.seeMessage(id, (err, message) => {
		if(err){
			return res.json({
                status: 3,
                error: 'SP_ER_TECHNICAL_ERROR'
            });
		}
		res.json(message);
	});
});

//Suggestion 
router.route('/suggestions/:_id').get( (req, res) => {
    var id = req.params._id;
    Message.haveConversation(id,(err,messages)=>{
        if(err){
			return res.json({
                status: 3,
                error: 'SP_ER_TECHNICAL_ERROR'
            });
        }
        if(messages.length>0){

        let suggestionsIds=[];

        messages.forEach(message => {
        if(message.fromUserId == id) suggestionsIds.push(message.toUserId)
        else suggestionsIds.push(message.fromUserId)
        });

       Profile.find({_id: { $in : suggestionsIds }},(err,profiles)=>{
        if ( err ){
            return res.json({
                status: 3,
                error: 'SP_ER_TECHNICAL_ERROR'
            });
        }
        res.json(profiles);
       })
        }
        else {
            Profile.findOne({_id: id}, (err,profile) => {
                if ( err ){
                    return res.json({
                        status: 3,
                        error: 'SP_ER_TECHNICAL_ERROR'
                    });
                }
                
                suggestions = profile.subscribers.slice(profile.subscribers.length-3,profile.subscribers.length);
                Profile.find({_id: { $in : suggestions }}, (err,profiles) => {
                    if ( err ){
                        return res.json({
                            status: 3,
                            error: 'SP_ER_TECHNICAL_ERROR'
                        });
                    }
                    res.json(profiles);
                });
                
            });
        }
    })
    
    
    
});


module.exports = router;