import { v4 as uuidv4 } from 'uuid';
import cookie from "cookie"
import cookies from "cookie-parser"
import utils from "../consts.js"
import adminInfo from "../admin-details.js";
import path from "path";
import express from "express";
import carSetup from "./car-handler"
import GameController from './game-controller';
import carHistory from "../car-history.json"
import axios from "axios"

export const adminKeys = [];

export default (app) => {
    carHistory.forEach(car => {
        axios.get(`http://${car}`).then(res => {
            carSetup(app, car);
        }).catch(() => {
            // do nothing as the car is not online
        })
        // attempt get stream endpoint (should return 403)
    })

    app.get("/car-handshake", (req, res) => {  // allow for http for this endpoint
        if (req.headers["api-key"] !== adminInfo.carApiKey) {
            res.status(403).send()
            return;
        }
        carSetup(app, req.socket.remoteAddress.substr(7))
        res.status(200).send();
    })

    // setup routing
    app.enable("trust proxy"); // enforce https
    app.use((req, res, next) => {
        req.secure ? next() : res.redirect("https://" + req.headers.host + req.url);
    });

    // expose view folder
    app.use(cookies())
    app.set('view engine', 'pug')
    app.set('views', path.join(__dirname, '../client/view'));
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
    app.get("/play", (req, res) => {
        let carId
        try {
            carId = GameController.getInstance().getCarId(req.cookies[utils.CLIENT_COOKIE_KEY])
        }
        catch {
            res.status(403).send();  // user is not in a game therefore ignore them
        }

        if (carId == -1) {
            res.status(403).send();
        }

        console.log(carId);
        res.render('play/play', { title: 'Hey', message: 'Hello there!' })
        res.status(200).send();
    })

    // admin stuffs
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