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
	 userId :{type: mongoose.Schema.Types.ObjectId,index:true},
	 subsciptions : [Subscription],
	
}, { versionKey: false });

module.exports = mongoose.model('NotificationSubscriptions', NotificationSubscription);
