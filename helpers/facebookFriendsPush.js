const webPusher = require("../utils/web_push.js");
const NotificationSubscription = require("../models/NotificationSubsciption.js");
const Profile = require("../models/Profile.js");
const _ = require("lodash");

async function sendPushNotification(user, id, res) {


  console.log('sneding push notification')
  const userSub = await NotificationSubscription.findOne({ userId: id });
  const userProfile = await Profile.findById(id);
  const payload = {
    title: "Speegar",
    icon: user.profilePictureMin,
    body: ` votre ami(e) facebook ${user.lastName} ${
      user.firstName
    }  est sur speegar sous le nom  ${user.lastName} ${user.firstName} `
  };


  if  (  userProfile && userProfile.friends  ) {
    if( !_.includes(userProfile.friends, user.facebookId))
        userProfile.friends.push(user.facebookId);
  
      await userProfile.save()
    return webPusher(userSub.subsciptions, payload, res);
  }

  
}

module.exports = {
  pushToFriend: async (_id, res) => {
    const user = await Profile.findOne({ _id });
    const friendsIds = user.friends;
    const facebookProfilesIds = await Profile.find(
      { facebookId: { $in: friendsIds } },
      "_id"
    );

    facebookfriends = await Promise.all(
      facebookProfilesIds.map(
        async id => await sendPushNotification(user, id, res)
      )
    );
  }
};
