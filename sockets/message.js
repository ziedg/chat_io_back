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

/*
      socket.on(`add-message`, async (data) => {
        if (data.message === '') {
            this.io.to(socket.id).emit(`add-message-response`,{
                error : true,
                message: CONSTANTS.MESSAGE_NOT_FOUND
            }); 
        }else if(data.fromUserId === ''){
            this.io.to(socket.id).emit(`add-message-response`,{
                error : true,
                message: CONSTANTS.SERVER_ERROR_MESSAGE
            }); 
        }else if(data.toUserId === ''){
            this.io.to(socket.id).emit(`add-message-response`,{
                error : true,
                message: CONSTANTS.SELECT_USER
            }); 
        }else{
            try{
                const [toSocketId, messageResult ] = await Promise.all([
                    queryHandler.getUserInfo({
                        userId: data.toUserId,
                        socketId: true
                    }),
                    queryHandler.insertMessages(data)						
                ]);
                this.io.to(toSocketId).emit(`add-message-response`,data); 
            } catch (error) {
                this.io.to(socket.id).emit(`add-message-response`,{
                    error : true,
                    message : CONSTANTS.MESSAGE_STORE_ERROR
                }); 
            }
        }				
    });*/

    

        socket.on('disconnect',()=>{
            console.log("user disconnect..")
        })

    })


    
}