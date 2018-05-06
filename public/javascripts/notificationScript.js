var Profile = require('./../../models/Profile');
var Notification = require('./../../models/Notification');

 module.exports = {
	 notifier: function(profileId,publId,userID,type,raisonDelete)
	 
	 {
			if(profileId == userID) return ;
			if(type =="reagir"){

				var critere ={profileId : profileId ,publId : publId,type :type} 
				Notification.findOne(critere, function(err, notification) {
					if (err){
					
					}
					else if (!notification){
						var notification = new Notification();
						notification.profileId=profileId;
						notification.publId=publId;
						notification.date_notification= new Date();
						notification.type=type;
						Profile.findById(userID, function(err, profile) {
							if (err){
								/*res.send(err);*/
							}
							else if (profile){
							   
								   
								
								notification.profiles.push(profile);
								notification.isSeen="false";
								notification.date_notification= new Date();
								notification.save();
								profile.save();
							}
						});	
					}else{
						Profile.findById(userID, function(err, profile) {
							if (err){
								/*res.
								(err);*/
							}
							else if(profile){
							
							var users = []
							  users= notification.profiles.map(p =>{
								  return p._id 
							 })
								
								let isExist = false
								for (let id of users){
									
								   if(String(id)== String(profile._id))
								   {
									   isExist=true;
									
								   }
								}
						


							
								if(!isExist)
								{
									notification.profiles.push(profile);
									notification.isSeen="false";
									notification.date_notification= new Date();
							     	notification.save();
                                    profile.save();

								}
								
							}
						});
						
					}
				});}
	 
	
/* commenter sur un publication */
   else if ( type =="comment")
   {



	var critere ={profileId : profileId ,publId : publId,type :type} 
	Notification.findOne(critere, function(err, notification) {
		if (err){
			/*return res.json({
					status : 0,
					err: err
				});	*/
		}
		else if (!notification){
			var notification = new Notification();
			notification.profileId=profileId;
			notification.publId=publId;
			notification.date_notification= new Date();
			notification.type=type;
			Profile.findById(userID, function(err, profile) {
				if (err){
					/*res.send(err);*/
				}
				else if (profile){
					notification.profiles.push(profile);
					notification.isSeen="false";
					notification.date_notification= new Date();
					notification.save();
					profile.save();
				}
			});	
		}else{
			Profile.findById(userID, function(err, profile) {
				if (err){
					/*res.send(err);*/
				}
				else if(profile){

					var users = []
							  users= notification.profiles.map(p =>{
								  return p._id 
							 })
								
								let isExist = false
								for (let id of users){
									
								   if(String(id)== String(profile._id))
								   {
									   isExist=true;
									
								   }
								}
								if(!isExist){
					notification.profiles.push(profile);
					notification.isSeen="false";
					notification.date_notification= new Date();
					notification.save();
					profile.save();
								}
				}
			});
			
		}
	});}

	  
	
	//type subscribe
   
	else{ 
				var notification = new Notification();
				notification.profileId=profileId;
				notification.date_notification= new Date();
				notification.type=type;
				Profile.findById(userID, function(err, profile) {
					if (err){
					/*	res.send(err);*/
					}
					else if(profile){
						notification.profiles.push(profile);
						notification.date_notification= new Date();
						notification.isSeen="false";
						notification.save();
						profile.save();
					}
				});	
			}
			Profile.findById(profileId, function(err, pr) {
				if(pr){
					pr.nbNotificationsNotSeen++;
					pr.save();
				}
			});			
		}
	
	,	
	removeNotification : function(profileId,publId,userID,type) 
         	{
			var critere ={
				profileId : profileId ,
				publId : publId,
				type :type
			}
			Notification.findOne(critere, function(err, notification) {
				if (err){
					/*return res.json({
							status : 0,
							err: err
					});*/
				}else if (!notification){
				return /*res.json({
							status : 0,
							message : "notification not found"
					})*/ ;
				}else {
					if (notification.profiles.length>1) {
                        for (i = 0; i < notification.profiles.length; i++) {

                            if (notification.profiles[i].id == userID) {
                                notification.profiles.splice(i, 1);
                                notification.save()
                                return;

                            }
                        }
                    }
					if(notification.profiles.length==0){
						notification.remove();
					}
				}				
			});			
				
		Profile.findById(profileId, function(err, pr) {
			if(pr){
				if(pr.nbNotificationsNotSeen>0){
					pr.nbNotificationsNotSeen--;
					pr.save();
				}
			}
		});		
	
 }
}