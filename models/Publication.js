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
	 nbComments : Number,
	 commentText: String,
	 commentLink : String,
	 isLiked : String,
	 isDisliked : String,
	 likes : [String],
	 dislikes : [String],
	 signals : [String]
}
, { versionKey: false });


 

var publicationSchema   = new Schema({
	 profileId : Schema.ObjectId,
	 originalProfileId : Schema.ObjectId,
	 originalPublicationId: Schema.ObjectId,
	 datePublication: Date,
	 originalDatePublication: Date,
	 profileFirstName : String,
	 originalProfileFirstName : String,
	 profileLastName : String,
	 originalProfileLastName : String,
	 originalProfilePicture: String,
	 originalProfilePictureMin: String,
	 profilePicture: String,
	 profilePictureMin: String,
	 confidentiality : String,
	 pubGid:String,
	 pubFontFamily:String,
	 pubColor:String,
	 pubFontSize:String,
	 nbLikes : Number,
	 nbDislikes : Number,
	 nbComments : Number,
	 publTitle : String,
	 publText: String,
	 publPictureLink : String,
	 publyoutubeLink : String,
	 publfacebookLink : String,
	 nbFcbkShare : Number,
	 nbShare : Number,
	 nbTwitterShare : Number,
	 isLiked : String,
	 isDisliked : String,
	 title: String,
	 description: String,
	 profile: String,
	 image: String,
	 height: String,
	 width: String,
	 publExternalLink : String,
	 isShared: String,
	 comments : [commentSchema],
	 
	 
}
, { versionKey: false });

module.exports = mongoose.model('Publications', publicationSchema);



