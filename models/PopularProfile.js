var mongoose  = require('mongoose');
var Schema    = mongoose.Schema;

var popularProfileSchema   = new Schema({
        firstName : String,
        lastName : String,
        profilePicture : String,
        profilePictureMin : String,
        coverPicture : String,
        subscribers : [Schema.ObjectId ],
        about : String,
        likers :[Schema.ObjectId],
        ignoredProfiles :[Schema.ObjectId],
        nbSubscribers : Number,
        nbSuivi : Number,
        nbPublications : Number,
        nbLikes : Number,
        nbNotificationsNotSeen : Number,
        isNewInscri  : String,
        isSubscribe  : String,
        isAdmin  : Number,
        name : String,
        isFollowed : Boolean
        ,

        dateInscription : String
    }
    , { versionKey: false });

module.exports = mongoose.model('popularProfiles', popularProfileSchema);


