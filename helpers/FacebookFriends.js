var Profile = require("../models/Profile");
const _ = require("lodash");

async function findByUserId(id, _id) {
  const userFind = await Profile.findById(id);
  if (userFind.subscribers.indexOf(String(_id)) === -1) return userFind;
}

module.exports = {
  findfacebookFriends: async _id => {
    try {
      const user = await Profile.findOne({ _id });
      const friendsIds = user.friends;
      const facebookProfilesIds = await Profile.find(
        { facebookId: { $in: friendsIds } },
        "_id"
      );
      facebookfriends = await Promise.all(
        facebookProfilesIds.map(async id => await findByUserId(id, _id))
      );

      const facebookUniq = _.filter(
        facebookfriends,
        el => typeof el !== "undefined"
      );

      return facebookUniq;
    } catch (error) {
      console.log(error);
    }
  }
};
