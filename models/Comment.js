var mongoose     = require('mongoose');
var Schema       = mongoose.Schema;

var commentSchema   = new Schema({
	 publId : Schema.ObjectId,
	 profileId : Schema.ObjectId,
	 dateComment: Date,
	 profileFirstName : String,
	 profileLastName : String,
	 profilePicture: String,
	 profilePictureMin: String,
	 commentPicture: String,
	 nbLikes : Number,
	 nbDislikes : Number,
	 commentText: String,
	 commentLink : String,
	 likes : [String],
	 dislikes : [String],
	 signals : [String]
}
, { versionKey: false });

module.exports = mongoose.model('Comments', commentSchema);

 