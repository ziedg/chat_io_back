var mongoose     = require('mongoose');
var Schema       = mongoose.Schema;


var Subscription= new Schema({
    
    endpoint: String,
  keys: {
    auth: String,
    p256dh: String
  }

})
var NotificationSubscription  = new Schema({
	 userId : mongoose.Schema.Types.ObjectId,
	 subsciptions : [Subscription],
	
}, { versionKey: false });

module.exports = mongoose.model('NotificationSubscriptions', NotificationSubscription);
