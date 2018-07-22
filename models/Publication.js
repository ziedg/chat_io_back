var mongoose     = require('mongoose');
var Schema       = mongoose.Schema;

var commentSchema   = new Schema({
	 publId : {type:Schema.ObjectId,index:true},
	 profileId : {type:Schema.ObjectId,index:true},
	
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
	 profileId :{type:Schema.ObjectId,index:true},
	 originalProfileId :{type:Schema.ObjectId,index:true},
	 originalPublicationId:{type:Schema.ObjectId,index:true},
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
	 publClass:String,
	 nbLikes : Number,
	 nbDislikes : Number,
	 nbComments : Number,
	 publTitle : String,
	 publText: String,
	 publPictureLink : String,
	 publyoutubeLink : String,
	 publfacebookLink : String,
	 publfacebookLinkWidth : String,
	 publfacebookLinkHeight : String,
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



