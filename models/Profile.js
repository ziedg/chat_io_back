var mongoose     = require('mongoose');
var Schema       = mongoose.Schema;

var profileSchema   = new Schema({
     firstName : String,
	 lastName : String,
	 birthday : Date,
	 gender : String,
	 email : String,
	 password : String,
	 profilePicture : String,
	 profilePictureMin : String,
	 coverPicture : String,
	 about : String,
	 notifications : [String],
	 pictures : [String],
	 publications : [String],
	 subscribers : [Schema.ObjectId],
	 nbSubscribers : Number,
	 nbSuivi : Number,
	 nbPublications : Number,
	 nbLikes : Number,
	 nbNotificationsNotSeen : Number,
	 facebookId : String,
	 facebookLink : String,
	 youtubeLink : String,
	 twitterLink : String,
	 googleLink : String,
	 googleId : String,
	 location : String,
	 isNewInscri  : String,
	 isSubscribe  : String,
	 isAdmin  : Number,
	 name : String,
	 
	 dateInscription : String
}
, { versionKey: false });

module.exports = mongoose.model('profiles', profileSchema);

