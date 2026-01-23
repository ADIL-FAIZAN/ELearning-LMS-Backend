"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const socket_io_1 = require("socket.io");
const initSocketServer = (server) => {
    const io = new socket_io_1.Server(server);
    io.on("connection", (socket) => {
        console.log("A User is connected Successfully!");
        socket.on("notification", (data) => {
            io.emit("AdminNewNotification", data);
        });
        socket.on("disconnect", () => {
            console.log("A user is diconnected!");
        });
    });
};
module.exports = initSocketServer;
//# sourceMappingURL=SocketServer.js.map