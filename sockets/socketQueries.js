const Profile = require('../models/Profile');
const Message = require('../models/Message');
var ObjectId = require('mongodb').ObjectId;



class SocketQueries {

    constructor(){

    }

      addSocketId (user){
     Profile.findById(user.userId,(err,profile)=>{
        if (err) {
           {
                error: 'SP_ER_TECHNICAL_ERROR'
            };
        }
        if (!profile) {
            return {
                error: 'SP_ER_PROFILE_NOT_FOUND'
            };
        }
       profile.socketId=user.socketId;
       return profile.save();
     })
    }

getDestinationSocketId(userId){

    return Profile.findById(userId)
    
}

insertMessage(data){

var message=new Message();
message.fromUser= new ObjectId(data.fromUser);
message.toUser=new ObjectId (data.toUser);
message.message=data.message;
return message.save()
    
}

}

module.exports= new SocketQueries();