var mongoose     = require('mongoose');
var Schema       = mongoose.Schema;

var userInteractions = new Schema({
	userId : {type:String,index:true},
	profilefirstname : String,
	profilelastname : String,
	profilePicture : String,
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



	 