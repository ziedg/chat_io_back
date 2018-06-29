var mongoose     = require('mongoose');
var Schema       = mongoose.Schema;


var publicationSchema   = new Schema({
	 profileId : {type:Schema.ObjectId,index:true},
	 publicationId: {type:Schema.ObjectId,index:true},
	 dateSignal: Date,
	 signalText : String
}
, { versionKey: false });

module.exports = mongoose.model('signal', publicationSchema);



