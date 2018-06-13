var Profile = require("../models/Profile");
const _ = require("lodash");

async function findByUserId(user, id) {
  const userFind = await Profile.findById(id);
  if (user.subscribers.indexOf(userFind._id) === -1) return userFind;
}

module.exports = {
  findfacebookFriends: async (_id, page) => {
    try {
      const user = await Profile.findOne({ _id });

      const friendsIds = user.friends;
      const facebookProfilesIds = await Profile.find(
        {$and :[ {facebookId: { $in: friendsIds }},{_id:{$nin:user.ignoredProfiles}}]},
        "_id"
      )
        .limit(10)
        .skip((page - 1) * 10);

      

      facebookfriends = await Promise.all(
        facebookProfilesIds.map(async id => await findByUserId(user, id))
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
