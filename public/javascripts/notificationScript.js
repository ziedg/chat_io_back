var Profile = require('./../../models/Profile');
var Notification = require('./../../models/Notification');

 module.exports = {
     notifier: function(profileId,publId,userID,type,raisonDelete) { //userID  //profileId  //publId  //type  //isSeen
		if( ((!(userID==profileId)) && (!(type=='removePublication')) ) || ((type=='removePublication')) ){
			if(type=='removePublication'){
				var notification = new Notification();
				notification.profileId=profileId;
				notification.publId=publId;
				notification.type=type;
				notification.raisonDelete=raisonDelete;
				notification.date_notification= new Date();
				notification.isSeen="false";
				notification.save();
				
				
			}	
			else if((!(type=='subscribe'))&&(!(type=='removePublication'))){
				var critere ={profileId : profileId ,publId : publId,type :type} 
				Notification.findOne(critere, function(err, notification) {
					if (err){
						return res.json({
								status : 0,
								err: err
							});		
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
							else if(profile){
								notification.profiles.unshift(profile);
								notification.isSeen="false";
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
								notification.profiles.unshift(profile);
								notification.isSeen="false";
								notification.save();
								profile.save();
							}
						});
						
					}
				});
			}else{  // notification subscribe  
				var notification = new Notification();
				notification.profileId=profileId;
				notification.date_notification= new Date();
				notification.type=type;
				Profile.findById(userID, function(err, profile) {
					if (err){
					/*	res.send(err);*/
					}
					else if(profile){
						notification.profiles.unshift(profile);
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
	},	
	removeNotification : function(profileId,publId,userID,type) { //userID  //profileId  //publId  //type  //isSeen		
		
		if(!(type=='subscribe')){
			var critere ={profileId : profileId ,publId : publId,type :type} 
			Notification.findOne(critere, function(err, notification) {
				if (err){
					/*return res.json({
							status : 0,
							err: err
					});		*/
				}else if (!notification){
				/*	return res.json({
							status : 0,
							message : "notification not found"
					});			*/			
				}else{
					for(i=0;i<notification.profiles.length;i++){
						
						if(notification.profiles[i].id==userID){
							notification.profiles.splice(i,1);
							break; 
						}
					}
					if(notification.profiles.length==0){
						notification.remove();
					}
					else
						notification.save();
				}				
			});			
		}
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