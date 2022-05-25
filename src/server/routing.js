import { v4 as uuidv4 } from 'uuid';
import cookie from "cookie"
import cookies from "cookie-parser"
import utils from "../consts.js"
import adminInfo from "../admin-details.js";
import path from "path";
import express from "express";

export const adminKeys = [];

export default (app) => {
    // setup routing
    app.enable("trust proxy"); // enforce https
    app.use((req, res, next) => {
        req.secure ? next() : res.redirect("https://" + req.headers.host + req.url);
    });

    // expose view folder
    app.use(cookies())
    app.use("/", express.static(path.join(__dirname, "../client/public")));
    app.get('/', function (req, res) {
        if (!(utils.CLIENT_COOKIE_KEY in req.cookies)) {
            res.set('Set-Cookie', cookie.serialize(utils.CLIENT_COOKIE_KEY, uuidv4(), {
                httpOnly: false,  // allow to be accessed from a script
                maxAge: 60 * 60 * 24 * 7 // 1 week
            }));
        }
        res.sendFile(path.join(__dirname, "../client/view/queue/queue.html"));  // server the page
    });
    app.use("/queue", express.static(path.join(__dirname, "../client/view/queue/public")));

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
    app.get('/admin', function (req, res) {
        if (!(utils.ADMIN_COOKIE_KEY in req.cookies) || !adminKeys.includes(req.cookies[utils.ADMIN_COOKIE_KEY])) {  // if cookie not set or if server does not recognise the cookie set a new one
            const newKey = uuidv4();
            adminKeys.push(newKey)
            res.set('Set-Cookie', cookie.serialize(utils.ADMIN_COOKIE_KEY, newKey, {
                httpOnly: false,  // allow to be accessed from a script
                maxAge: 60 * 60 * 24 * 7 // 1 week
            }));
        }
        res.sendFile(path.join(__dirname, "../client/admin/admin.html"));  // serve the page
    });
    app.use("/admin", express.static(path.join(__dirname, "../client/admin/public")));
}