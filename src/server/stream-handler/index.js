import MjpegProxy, { allowedClients } from "./mjpeg-proxy";
import Cars from "../../config/cars.js"
import User from "../user";
import { adminKeys } from "../routing";
import utils from "../../consts"

// Events

const setupStream = (carIp) => {
    const proxy = new MjpegProxy(`http://${carIp}:81/stream`);

    proxy.on('streamstart', function (data) {
        console.log("streamstart - " + data);		// [Console output] streamstart - [MjpegProxy] Started streaming http://192.168.1.17:8082/ptz.jpg , users: 1
    });

    proxy.on('streamstop', function (data) {
        console.log("streamstop - " + data);	// [Console output] streamstop - [MjpegProxy] 0 Users, Stopping stream http://192.168.1.17:8082/ptz.jpg
    });

    proxy.on('error', function (data) {
        console.log("msg: " + data.msg);		// [Console output] msg: Error: connect ECONNREFUSED 192.168.1.17:8082
        console.log("url: " + data.url);		// [Console output] url: - http://192.168.1.17:8082/ptz.jpg
    });

    return proxy;
}

export default (app) => {
    Cars.forEach((car, index) => {
        const proxy = setupStream(car)
        app.get(`/stream${index}`, (req, res) => {
            // is the user allowed to see this page?
            const clientId = User.getClientIdFromRequest(req)
            if (!(allowedClients.includes(clientId) || adminKeys.includes(req.cookies[utils.ADMIN_COOKIE_KEY]))) {
                console.log("No permission to view video stream")
                res.status(403).send();
                return;
            }
            proxy.proxyRequest(req, res);
        });
    })
}