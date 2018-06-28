var mongoose     = require('mongoose');
var Schema       = mongoose.Schema;

var userInteractions = new Schema({
	userId : String,
	profilefirstname : String,
	profilelastname : String,
	profilepicture : String,
	isSubscribed : String
}, { versionKey: false });


var publicationLikesSchema   = new Schema({
	 likes : [String],
	 dislikes : [String],
	 userlikes : [userInteractions],
	 userdislikes : [userInteractions],
	 signals : [String]
}, { versionKey: false });


module.exports = mongoose.model('PublicationLikes', publicationLikesSchema);



	 