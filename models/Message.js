var mongoose     = require('mongoose');
var Schema       = mongoose.Schema;

var MessageSchema   = new Schema({
    fromUser : { 
        type: Schema.Types.ObjectId, 
        ref: 'User', 
        required: true
    },
    toUser: {
        type: Schema.Types.ObjectId, 
        ref: 'User', 
        required: true
    },
    message: { 
        type: String, 
        required: true
    },
    date : { 
        type: Date, 
        default: Date.now 
    },
    isSeen : { 
        type: Boolean, 
        default: false 
    },
    seenDate : { 
        type: Date,
        default: null
    }
});
const Message = module.exports = mongoose.model('Message', MessageSchema);

// Get Messages
module.exports.getMessagesList = (callback, limit, page) => {
	Message.find(callback).skip(page).limit(limit).sort({date: -1});
}

module.exports.getMessages = (fromUser, toUser, callback, limit, page) => {
        const queryData = {
            '$or' : [
                { '$and': [
                    {
                        'toUser': toUser
                    },{
                        'fromUser': fromUser
                    }
                ]
            },{
                '$and': [ 
                    {
                        'toUser': fromUser
                    }, {
                        'fromUserId': toUser
                    }
                ]
            },
        ]
    };
	Message.find(queryData, callback).skip(page).limit(limit).sort({date: -1});
}

// Add Message
module.exports.addMessage = (message, callback) => {
	Message.create(message, callback);
}

// Delete Message
module.exports.removeMessage = (id, callback) => {
	var query = {_id: id};
	Message.remove(query, callback);
}

//Alter Message
module.exports.seeMessage = (id, callback) => {
	var query = {_id: id};
	var update = {
        isSeen: true,
        seenDate: Date.now()
	}
	Message.findOneAndUpdate(query, update, callback);
}
