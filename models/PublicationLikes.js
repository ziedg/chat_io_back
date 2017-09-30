var mongoose     = require('mongoose');
var Schema       = mongoose.Schema;

var publicationLikesSchema   = new Schema({
	 likes : [String],
	 dislikes : [String],
	 signals : [String]
}, { versionKey: false });

module.exports = mongoose.model('PublicationLikes', publicationLikesSchema);

	 