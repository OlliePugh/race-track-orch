import { allowedClients } from "./mjpeg-proxy";
import User from "../user";
import { adminKeys } from "../routing";
import utils from "../../consts"
import Car from "../car"

export const cars = [];

export default (app, car) => {
    if (!cars.includes(car)) {  // check if its a new car
        console.log(`Car with IP ${car} connected`)
        const newCar = new Car(car);
        cars.push(newCar.ip)
        const proxy = newCar.proxy
        app.get(`/stream${cars.indexOf(car)}`, (req, res) => {
            // is the user allowed to see this page?
            const clientId = User.getClientIdFromRequest(req)
            if (!(allowedClients.includes(clientId) || adminKeys.includes(req.cookies[utils.ADMIN_COOKIE_KEY]))) {
                console.log("No permission to view video stream")
                res.status(403).send();
                return;
            }
            proxy.proxyRequest(req, res);
        });
    }
}