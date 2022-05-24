import express from "express";
import path from "path";
import streamSetup from "./stream-handler"
import fs from "fs";
import http from "http"
import https from "https"
import adminInfo from "../admin-details.js";
import { Server } from "socket.io"
import { v4 as uuidv4 } from 'uuid';
import cookie from "cookie"
import cookies from "cookie-parser"
import utils from "../consts.js"
import Queue from "./queue";
import User from "./user";
import SOCKET_EVENTS from "../socket-events";

const privateKey = fs.readFileSync('keys/olliepugh_com.key', 'utf8');
const certificate = fs.readFileSync('keys/olliepugh_com.crt', 'utf8');

const credentials = { key: privateKey, cert: certificate };

const app = express();
// setup routing
app.enable("trust proxy"); // enforce https
app.use((req, res, next) => {
    req.secure ? next() : res.redirect("https://" + req.headers.host + req.url);
});

// expose view folder
app.use(cookies())
app.use(express.static(path.join(__dirname, "../client/public")));
app.get('/', function (req, res) {
    if (!(utils.CLIENT_COOKIE_KEY in req.cookies)) {
        res.set('Set-Cookie', cookie.serialize(utils.CLIENT_COOKIE_KEY, uuidv4(), {
            httpOnly: false,  // allow to be accessed from a script
            maxAge: 60 * 60 * 24 * 7 // 1 week
        }));
    }
    res.sendFile(path.join(__dirname, "../client/view/queue/queue.html"));  // server the page
});
app.use(express.static(path.join(__dirname, "../client/view/queue/public")));

app.use((req, res, next) => {
    const auth = {
        login: adminInfo.username,
        password: adminInfo.password,
    };
    const [, b64auth = ""] = (req.headers.authorization || "").split(" ");
    const [login, password] = Buffer.from(b64auth, "base64")
        .toString()
        .split(":");
    if (login && password && login === auth.login && password === auth.password) {
        return next();
    }
    res.set("WWW-Authenticate", 'Basic realm="401"');
    res.status(401).send("Authentication required.");
});

app.use(express.static(path.join(__dirname, "../client/admin")));

streamSetup(app)

const httpServer = http.createServer(app);
const httpsServer = https.createServer(credentials, app);
const io = new Server(httpsServer);

const broadcastQueueUpdate = () => {
    io.emit(SOCKET_EVENTS.QUEUE_UPDATE, { total: queue.contents.length });
    queue.contents.forEach((user, index) => { io.sockets.to(user.socketId).emit(SOCKET_EVENTS.QUEUE_UPDATE, { current: index + 1, total: queue.contents.length }) })
}

const getClientId = (socket) => {
    const cookies = cookie.parse(socket.request.headers.cookie)
    if (!cookies[utils.CLIENT_COOKIE_KEY]) {
        socket.emit(SOCKET_EVENTS.MISSING_COOKIE)  // TODO this needs implementing
        return;
    }
    return cookies[utils.CLIENT_COOKIE_KEY]
}

const queue = new Queue({
    onAdd: user => {
        io.sockets.to(user.socketId).emit(SOCKET_EVENTS.JOINED_QUEUE)
    },
    onRemove: user => {
        io.sockets.to(user.socketId).emit(SOCKET_EVENTS.LEFT_QUEUE)
    },
    onChange: broadcastQueueUpdate
});

io.on(SOCKET_EVENTS.CONNECT, (socket) => {

    let newUser = new User(socket.id, getClientId(socket))

    socket.on(SOCKET_EVENTS.JOIN_QUEUE, (username = undefined) => {

        const user = User.getUser({ clientId: getClientId(socket) })
        user.setUsername(username);

        const positionInQueue = queue.positionInQueue(user)
        if (positionInQueue === -1) {  // if the user is not in the queue
            queue.add(user)
        }
        else if (queue.get(positionInQueue).socketId !== newUser.socketId) {  // user has different socket id but same client id cookie
            socket.emit(SOCKET_EVENTS.DUPLICATE_TAB)
        }
        // if the user is already in the queue legit just ignore the request
    });

    socket.on(SOCKET_EVENTS.LEAVE_QUEUE, () => {
        const cookies = cookie.parse(socket.request.headers.cookie)
        let user;
        try {
            user = User.getUser({ clientId: cookies[utils.CLIENT_COOKIE_KEY] })
        }
        catch (e) {
            console.error("COULD NOT FIND USER THAT WAS IN THE QUEUE")
        }
        queue.remove(user);
        // if the user is already in the queue legit just ignore the request
    });

    socket.on(SOCKET_EVENTS.QUEUE_STATUS_REQUEST, () => {
        let user;
        let currentPosition;
        try {
            user = User.getUser({ socketId: socket.id });
            currentPosition = queue.positionInQueue(user)
        }
        catch (e) { }
        socket.emit(SOCKET_EVENTS.QUEUE_UPDATE, { current: currentPosition === -1 ? undefined : currentPosition, total: queue.contents.length })
    })

    socket.on(SOCKET_EVENTS.DISCONNECT, () => {
        let user;
        try {
            user = User.getUser({ socketId: socket.id });
        }
        catch (e) {  // user does not exist therefore discard
            return;
        }
        queue.remove(user)  // I have a feeling this disconnected logic between users and queue is going to make my life hell
        User.delete(user);
    })
})


httpServer.listen(8080, () => {
    console.log("Started serving HTTP")
});
httpsServer.listen(8443, () => {
    console.log("Started serving HTTPS")
});

