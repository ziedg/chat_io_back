var mongoose     = require('mongoose');
var Schema       = mongoose.Schema;

var commentLikesSchema   = new Schema({
	 likes : [String],
	 dislikes : [String],
	 signals : [String]
}, { versionKey: false });

module.exports = mongoose.model('commentLikes', commentLikesSchema);

	 