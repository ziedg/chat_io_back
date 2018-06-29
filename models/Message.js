var mongoose     = require('mongoose');
var Schema       = mongoose.Schema;

var MessageSchema   = new Schema({
    fromUserId : { 
        type: Schema.Types.ObjectId, 
        ref: 'User', 
        required: true
    },
    toUserId: {
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
//module.exports.getMessages = (fromUser, toUser, callback, limit, page) => {


module.exports.getMessage = (_id, callback) => {
    Message.findById(_id, callback);
}


module.exports.getMessages = (fromUser, toUser) => {
        const queryData = {
            $or : [
                { $and: [{'toUserId': toUser},{ 'fromUserId': fromUser }] },
                { $and: [{'toUserId': fromUser},{ 'fromUserId': toUser}] }
            ]
    };
   // Message.find(queryData, callback).skip(page).limit(limit).sort({date: -1});

	return Message.find(queryData);
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

//check if the user have done conversations
// logic:retreive message sent or received bu the user
module.exports.haveConversation=(id)=>{
return Message.find().or([{ toUserId: id }, { fromUserId: id }])
}
