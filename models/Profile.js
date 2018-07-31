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
var profileSchema = new Schema(
  {
    firstName: String,
    lastName: String,
    birthday: Date,
    gender: String,
    email: String,
    password: String,
    profilePicture: String,
    profilePictureMin: String,
    coverPicture: String,
    about: String,
    notifications: [String],
    pictures: [String],
    publications: [String],
    comments :[String],
    subscriptions: [Schema.ObjectId],
    conversations: [ConversationShema],
    subscriptionsDetails: Array,
    nbSubscriptions:{
    type:Number ,
    default:0
    } ,
    subscribers: [Schema.ObjectId],
    subscribersDetails: Array,
    nbSubscribers:{
    type:Number ,
    default:0
    } ,
    likers: [Schema.ObjectId],
    friends:[String],
    ignoredProfiles: [Schema.ObjectId],
    nbPublications: Number,
    nbLikes: Number,
    nbLoves:{
      type:Number,
      default:0
    },
    nbReactions:{
      type:Number,
      default:0
    },


    nbNotificationsNotSeen: Number,
    nbMessgeNotifcationNotSeen:{type:Number,default:0},
    facebookId: String,
    facebookLink: String,
    youtubeLink: String,
    twitterLink: String,
    googleLink: String,
    googleId: String,
    location: String,
    isNewInscri: String,
    isSubscribe: String,
    isAdmin: Number,
    name: String,
    isFollowed: Boolean,
    dateInscription: String,
    socketId:String
  },
  { versionKey: false }
);

module.exports = mongoose.model("profiles", profileSchema);
