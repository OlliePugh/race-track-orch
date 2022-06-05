import express from "express";
import fs from "fs";
import http from "http"
import https from "https"
import { Server } from "socket.io"
import Queue from "./queue";
import User from "./user";
import SOCKET_EVENTS from "../socket-events";
import queueSockets from "./socket-events/queue-sockets";
import routing, { adminKeys } from "./routing";
import commonSockets from "./socket-events/common-sockets";
import adminSockets, { updateAdminQueue } from "./socket-events/admin-sockets";
import gameSockets from "./socket-events/game-sockets"
import utils from "../consts"
import cookie from "cookie"
import GameController from "./game-controller";
import { cars } from "./car-handler";

const privateKey = fs.readFileSync('keys/olliepugh_com.key', 'utf8');
const certificate = fs.readFileSync('keys/olliepugh_com.crt', 'utf8');

const credentials = { key: privateKey, cert: certificate };

const app = express();
// setup routing
routing(app);

const httpServer = http.createServer(app);
const httpsServer = https.createServer(credentials, app);
const io = new Server(httpsServer);
const admins = [];

const broadcastQueueUpdate = (queue) => {
    io.emit(SOCKET_EVENTS.QUEUE_UPDATE, { total: queue.contents.length });
    admins.forEach(admin => { updateAdminQueue(io.sockets.to(admin), queue) })  // send update to each admin
    queue.contents.forEach((user, index) => { io.sockets.to(user.socketId).emit(SOCKET_EVENTS.QUEUE_UPDATE, { current: index + 1, total: queue.contents.length }) })
}

const queue = new Queue({
    onAdd: user => {
        io.sockets.to(user.socketId).emit(SOCKET_EVENTS.JOINED_QUEUE)
    },
    onRemove: user => {
        io.sockets.to(user.socketId).emit(SOCKET_EVENTS.LEFT_QUEUE)
    },
    onChange: () => {
        broadcastQueueUpdate(queue)
        if (queue.contents.length >= cars.length && cars.length != 0 && !gameController.isGameLive()) {
            console.log("starting match")
            gameController.startMatch(queue, cars);
        }
    }
});

const gameController = new GameController(io);

const userSetup = (socket, queue) => {
    let user
    try {
        user = new User(socket.id, User.getClientIdFromSocket(socket))
    }
    catch (e) {
        console.error(e)
        socket.emit(SOCKET_EVENTS.DUPLICATE_TAB)
        return;
    }

    if (gameController.isUserInGame(user)) {
        gameSockets(socket, gameController)
    }
    else {
        queueSockets(socket, queue);
    }


    socket.on(SOCKET_EVENTS.DISCONNECT, () => {
        let user;
        try {
            user = User.getUser({ socketId: socket.id });
            user.connected = false;
        }
        catch (e) {  // user does not exist therefore discard
            try {
                user = User.getUser({ clientId: User.getClientIdFromSocket(socket) });
                user.connected = false;
            }
            catch {
                return;
            }
            return;
        }
        queue.remove(user)  // I have a feeling this disconnected logic between users and queue is going to make my life hell
    })
}

const adminSetup = (socket, queue) => {
    const cookies = cookie.parse(socket.request.headers.cookie)
    const incomingAdminKey = cookies[utils.ADMIN_COOKIE_KEY]
    if (!incomingAdminKey || !adminKeys.includes(incomingAdminKey)) {
        throw new Error("Missing admin key")
    }
    admins.push(socket.id)  // add socket id to admims
    adminSockets(socket, queue)

    socket.on(SOCKET_EVENTS.DISCONNECT, () => {
        const index = admins.indexOf(socket.id);
        if (index > -1) {
            admins.splice(index, 1); // 2nd parameter means remove one item only
        }
    })
}

io.on(SOCKET_EVENTS.CONNECT, (socket) => {
    commonSockets(socket, queue)  // enable the common sockets
    if (socket.handshake.query.admin === "true") {
        try {
            adminSetup(socket, queue)
        }
        catch {
            console.log("Admin socket creation attempt without valid key")
            socket.disconnect(0); // close the connection
        }
    }
    else {
        userSetup(socket, queue);
    }
})

httpServer.listen(8080, () => {
    console.log("Started serving HTTP")
});
httpsServer.listen(8443, () => {
    console.log("Started serving HTTPS")
});

