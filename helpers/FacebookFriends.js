var Profile = require("../models/Profile");
var _ = require("lodash");
var PropertiesReader = require("properties-reader");
var properties = PropertiesReader("properties.file");
var CronJob = require("cron").CronJob;

//  find facebook friends
module.exports = {
  findfacebookFriends: async facebookId => {
    try {
      //find user by facebook
      const user = await Profile.findOne({ facebookId });
      //retrive user friends
      const friendsIds = user.friends;
      const  facebookProfiles = await Profile.find({facebookId:{$in:friendsIds}});
      return facebookProfiles;
  } catch (error) {
      console.log(error);
    }
  }
};
