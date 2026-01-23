import http = require("http");
import { Server as SocketIoServer } from "socket.io";


const initSocketServer = (server:http.Server) => {
    
    const io = new SocketIoServer(server);
 
    io.on("connection", (socket: any) => {
     
    console.log("A User is connected Successfully!");

    
        socket.on("notification", (data:any) => {
        

            io.emit("AdminNewNotification", data);

        });
        
        
    socket.on("disconnect", () => {
        
    console.log("A user is diconnected!")

    })    
        
        
        
        
        
    });
  



};


module.exports = initSocketServer;
