const socketQuery =require ('./socketQueries');
const CONSTANTS=require('../utils/config/constants')

module.exports = function(io){
    io.use( async (socket, next) => {
        try {
            await socketQuery.addSocketId({
                userId: socket.request._query['userId'],
                socketId: socket.id
            });
            next();
        } catch (error) {
              // Error
              console.error(error);
          }
      });
    
    io.on('connection',(socket)=>{
        console.log("user connected ...")
      console.log(socket.id);


      socket.on(`add-message`, async (data) => {
          console.log(data);
        if (data.message === '') {
           io.to(socket.id).emit(`add-message-response`,{
                error : true,
                message: CONSTANTS.MESSAGE_NOT_FOUND
            }); 
        }else if(data.fromUserId === ''){
           io.to(socket.id).emit(`add-message-response`,{
                error : true,
                message: CONSTANTS.SERVER_ERROR_MESSAGE
            }); 
        }else if(data.toUserId === ''){
           io.to(socket.id).emit(`add-message-response`,{
                error : true,
                message: CONSTANTS.SELECT_USER
            }); 
        }else{
            try{

         const  message= await socketQuery.insertMessage(data);
         const toSocketId = await socketQuery.getDestinationSocketId(data.toUserId)
         .then((profile)=>{
           return profile.socketId
         })
         console.log(toSocketId);
               io.to(toSocketId).emit(`add-message-response`,data); 
            } catch (error) {
               io.to(socket.id).emit(`add-message-response`,{
                    error : true,
                    message : CONSTANTS.MESSAGE_STORE_ERROR
                }); 
            }
        }				
    });

    

        socket.on('disconnect',()=>{
            console.log("user disconnect..")
        })

    })


    
}