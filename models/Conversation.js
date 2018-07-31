var mongoose = require("mongoose");
var Schema = mongoose.Schema;

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

var ConversationShema = new Schema(
    {
        firstName: String,
        lastName: String,
        profilePicture: String,
        _id: String,
        lastMessage: MessageSchema
    }
);

module.exports = mongoose.model('Conversations', ConversationShema);