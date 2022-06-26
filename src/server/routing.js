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
import { cars } from "./car-handler"

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

    app.get("/favicon.ico", (req, res) => {  // allow for http for this endpoint
        res.status(200).send();
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
    app.set('view engine', 'ejs');
    app.set('views', path.join(__dirname, '../client/view'));
    app.get('/', (req, res) => {
        if (!(utils.CLIENT_COOKIE_KEY in req.cookies)) {
            res.set('Set-Cookie', cookie.serialize(utils.CLIENT_COOKIE_KEY, uuidv4(), {
                httpOnly: false,  // allow to be accessed from a script
                maxAge: 60 * 60 * 24 * 7 // 1 week
            }));
        }
        res.render('queue/queue', { message: req.query.message })
    });
    app.use("/", express.static(path.join(__dirname, "../client/public")));
    app.use("/queue", express.static(path.join(__dirname, "../client/view/queue/public")));
    app.get("/play", (req, res) => {
        let carId
        try {
            carId = GameController.getInstance().getCarId(req.cookies[utils.CLIENT_COOKIE_KEY])
        }
        catch {
            res.redirect("/")  // user is not in a game therefore ignore them
            return;
        }

        if (carId == -1) {
            res.redirect("/")
            return;
        }
        res.render('play/play', { carId })
    })

    // admin stuffs
    app.use("/admin", (req, res, next) => {
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


    app.get('/admin', (req, res) => {
        if (!(utils.ADMIN_COOKIE_KEY in req.cookies) || !adminKeys.includes(req.cookies[utils.ADMIN_COOKIE_KEY])) {  // if cookie not set or if server does not recognise the cookie set a new one
            const newKey = uuidv4();
            adminKeys.push(newKey)
            res.set('Set-Cookie', cookie.serialize(utils.ADMIN_COOKIE_KEY, newKey, {
                httpOnly: false,  // allow to be accessed from a script
                maxAge: 60 * 60 * 24 * 7 // 1 week
            }));
        }
        res.render("admin/admin", { cars })
    });
    app.use("/admin", express.static(path.join(__dirname, "../client/admin/public")));
}