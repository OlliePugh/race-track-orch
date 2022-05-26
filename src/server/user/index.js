import { AssertionError } from "assert"
import cookie from "cookie"
import utils from "../../consts.js"
export default class User {

    static #users = [];

    constructor(socketId, clientId, username = "Anonymous") {
        this.socketId = socketId;
        this.clientId = clientId;
        this.username = username
        let userExists;
        try {
            userExists = User.getUser({ clientId })
        }
        catch { }
        if (userExists !== undefined) {
            throw new Error("Tab is already open with same client id")
        }

        User.#users.push(this);
    }

    isSameUser(user) {
        return this.clientId === user.clientId;
    }

    setSocketId(socketId) {
        console.log(`Updating socket id for ${this.username}`)
        this.socketId = socketId;
    }

    setUsername(username) {
        this.username = username;
    }

    static getUser({ clientId, socketId }) {
        if (clientId && socketId) throw new AssertionError("Please specify clientId OR socketId NOT both")
        for (let i = 0; i < this.#users.length; i++) {
            const user = this.#users[i];
            if (user.clientId === clientId || user.socketId === socketId) {
                return user
            }
        }

        throw new Error("User not found")
    }

    static delete(user) {
        for (let i = 0; i < this.#users.length; i++) {
            const currUser = this.#users[i];
            if (user.isSameUser(currUser)) {
                this.#users.splice(i, 1)  // remove the one user
                return;
            }
        }
    }

    static getClientIdFromSocket(socket) {
        const cookies = cookie.parse(socket.request.headers.cookie)
        if (!cookies[utils.CLIENT_COOKIE_KEY]) {
            socket.emit(SOCKET_EVENTS.MISSING_COOKIE)  // TODO this needs implementing
            return;
        }
        return cookies[utils.CLIENT_COOKIE_KEY]
    }

    static getClientIdFromRequest(req) {
        const clientId = req.cookies[utils.CLIENT_COOKIE_KEY]
        if (!clientId) {
            console.error("NO CLIENT ID FOUND - IMPLEMENT HANDLER") //TODO <--- this
        }
        return clientId
    }
}