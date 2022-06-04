import User from "../user";
import { adminKeys } from "../routing";
import utils from "../../consts"
import Car from "../car"
import GameController from "../game-controller";

export const cars = [];

export default (app, car, gameController) => {
    if (!cars.includes(car)) {  // check if its a new car
        console.log(`Car with IP ${car} connected`)
        const newCar = new Car(car);
        cars.push(newCar.ip)
        const proxy = newCar.proxy
        app.get(`/stream${cars.indexOf(car)}`, (req, res) => {
            // is the user allowed to see this page?
            const clientId = User.getClientIdFromRequest(req)
            const playerIsInMatch = GameController.getInstance().getCurrentMatch().filter(user => user.clientId === clientId).length > 0
            if (!(playerIsInMatch || adminKeys.includes(req.cookies[utils.ADMIN_COOKIE_KEY]))) {
                console.log("No permission to view video stream")
                res.status(403).send();
                return;
            }
            proxy.proxyRequest(req, res);
        });
    }
}