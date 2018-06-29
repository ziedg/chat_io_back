var mongoose     = require('mongoose');
var Schema       = mongoose.Schema;


var IonicNotificationSubscription  = new Schema({
	 userId : mongoose.Schema.Types.ObjectId,
	 tokens : [String],
	
}, { versionKey: false });

module.exports = mongoose.model('IonicNotificationSubscriptions', IonicNotificationSubscription);
