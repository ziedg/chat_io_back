var mongoose     = require('mongoose');
var Schema       = mongoose.Schema;


var publicationSchema   = new Schema({
	 profileId : Schema.ObjectId,
	 publicationId: Schema.ObjectId,
	 dateSignal: Date,
	 signalText : String
}
, { versionKey: false });

module.exports = mongoose.model('signal', publicationSchema);



