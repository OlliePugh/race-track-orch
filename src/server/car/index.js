import fs from "fs"
const fileName = "../../car-history.json"
import MjpegProxy from "../car-handler/mjpeg-proxy";

export default class Car {

    #setupStream = (carIp) => {
        this.proxy = new MjpegProxy(`http://${carIp}:81/stream`);

        this.proxy.on('streamstart', function (data) {
            console.log("streamstart - " + data);		// [Console output] streamstart - [MjpegProxy] Started streaming http://192.168.1.17:8082/ptz.jpg , users: 1
        });

        this.proxy.on('streamstop', function (data) {
            console.log("streamstop - " + data);	// [Console output] streamstop - [MjpegProxy] 0 Users, Stopping stream http://192.168.1.17:8082/ptz.jpg
        });

        this.proxy.on('error', function (data) {
            console.log("msg: " + data.msg);		// [Console output] msg: Error: connect ECONNREFUSED 192.168.1.17:8082
            console.log("url: " + data.url);		// [Console output] url: - http://192.168.1.17:8082/ptz.jpg
        });
    }


    constructor(ip) {
        this.ip = ip;
        const carCache = require(fileName)
        if (carCache.indexOf(ip) === -1) {  // if not already in the cache
            carCache.push(ip);
            fs.writeFile(__dirname + "/" + fileName, JSON.stringify(carCache), function (err) {
                if (err) {
                    return console.log(err);
                }
            })
        }
        this.#setupStream(ip)
    }
}