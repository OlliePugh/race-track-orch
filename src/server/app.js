import express from "express";
import path from "path";
import streamSetup from "./stream-handler"
import fs from "fs";
import http from "http"
import https from "https"
import adminInfo from "../admin-details.js";
import { Server } from "socket.io"
import { v4 as uuidv4 } from 'uuid';
import cookies from "cookie-parser"
import utils from "../consts.js"
import Queue from "./queue";
import User from "./user";
import SOCKET_EVENTS from "../socket-events";
import queueSockets from "./queue-sockets";

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

    new User(socket.id, User.getClientId(socket))

    queueSockets(socket, queue);

})


httpServer.listen(8080, () => {
    console.log("Started serving HTTP")
});
httpsServer.listen(8443, () => {
    console.log("Started serving HTTPS")
});

