import express from "express";
import streamSetup from "./stream-handler.js"
import fs from "fs";
import http from "http"
import https from "https"
import adminInfo from "../admin-details.js";
import { Server } from "socket.io"

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
app.use(express.static("src/view"));
app.use(express.static("public"));

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

app.use(express.static("src/admin"));

streamSetup(app)

const httpServer = http.createServer(app);
const httpsServer = https.createServer(credentials, app);
const io = new Server(httpsServer);
io.on("connection", () => {
    console.log("someone connected")
})

httpServer.listen(8080);
httpsServer.listen(8443);

