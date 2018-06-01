module.exports = function(io){
    io.on('connection',(socket)=>{
        console.log("user connected ...")




        socket.on('disconnect',()=>{
            console.log("user disconnect..")
        })

    })
}