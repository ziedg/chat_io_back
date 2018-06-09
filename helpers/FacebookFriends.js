var Profile = require("../models/Profile");
const _ = require('lodash');

//  find facebook friends
module.exports = {
  findfacebookFriends: async _id => {
    try {
      //find user by facebookid
      const user = await Profile.findOne({_id });
      //retrive user  from mongo
      const friendsIds = user.friends;
      const facebookProfiles = await Profile.find({
        facebookId: { $in: friendsIds }
      });
      var facebookfriendsIDS =facebookProfiles.map(friend => friend._id);
    
      

      //eliminate facebook friends that the user already follows
      
      if(user.nbSubscriptions.length >0){

        facebookfriendsIDS = facebookfriendsIDS.filter(el => Profile.findById(el).subscribers.indexOf(_id) == -1 );
        console.log('facebook friends not subscribed to');
        
      }
      console.log(facebookfriendsIDS);
    //  if(user.subscribers.length >0){
     //   filtredSubscribers = _.filter(user.subscribers,(userId)=> _.find(facebookfriendsIDS,userId))
        //  console.log(filtredSubscribers)}
        
      
      
      //make sure that the friends not exist in the subscribers array of the user
      console.log("___________________")
      console.log(user.subscribers)
    //  console.log(facebookfriendsIDS)

      //const  facebookfriends= await Profile.find({ $and: [ { _id: { $ne: } }, { price: { $exists: true } } ] })
     // const  names = _.map(facebookfriends,(f)=>f.firstName)
      //console.log(names)
      return facebookfriendsIDS;


    } catch (error) {
      console.log(error);
    }
  }
};
