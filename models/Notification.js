var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var profileSchema = new Schema({
    firstName: String,
    lastName: String,
    profilePicture: String,
    profilePictureMin: String,
    name: String
}, {
    versionKey: false
});


var NotificationSchema = new Schema({

    publText: String,
    publType: String,

    date_notification: Date,
    type: String,
    publId: {
        type: String,
        index: true
    },
    isActive:{
        type:String,
        default:'true'
    },
    profileId: {
        type: String,
        index: true
    },
    raisonDelete: String,
    toProfileId: {
        type: String,
        index: true
    },
    profiles: [profileSchema],
    isSeen: String
}, {
    versionKey: false
});
module.exports = mongoose.model('Notifications', NotificationSchema);