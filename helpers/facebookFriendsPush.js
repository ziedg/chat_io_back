
const webPusher = require("../utils/web_push.js");
const NotificationSubscription = require("../models/NotificationSubsciption.js");
const Profile = require('../models/Profile.js')
const _ = require('lodash');

async function sendPushNotification(user, id,res) {
  const userFind = await NotificationSubscription.findOne({userId:id});
  const payload = {
    title: "Speegar",
    icon: user.profilePictureMin,
    body: ` votre ami(e) facebook ${user.lastName} ${
      user.firstName
    }  est sur speegar sous le nom  ${user.lastName} ${user.firstName} `
  };
  if ( userFind.friends && ! _.includes(userFind.friends,id)) {
    userFind.friends.push(id);
}

  return webPusher(userFind.subsciptions, payload, res);
}

module.exports = {
  pushToFriend: async (_id,res)  => {

    const user = await Profile.findOne({ _id })
    const friendsIds = user.friends;
    const facebookProfilesIds = await Profile.find(
      { facebookId: { $in: friendsIds } },
      "_id"
    );

    facebookfriends = await Promise.all(
      facebookProfilesIds.map(async id => await sendPushNotification(user, id,res))
    );
  }
};
