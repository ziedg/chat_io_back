var mongoose     = require('mongoose');
var Schema       = mongoose.Schema;

var profileSchema   = new Schema({
	 password : String,
	 resetPswdString : String
}
, { versionKey: false });

module.exports = mongoose.model('profilesPasswords', profileSchema);


