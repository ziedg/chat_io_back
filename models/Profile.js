var mongoose = require("mongoose");
var Schema = mongoose.Schema;

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
    nbNotificationsNotSeen: Number,
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
