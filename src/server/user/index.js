import { AssertionError } from "assert"
import cookie from "cookie"
import consts from "../../consts"
export default class User {

    static #users = [];

    constructor(socketId, clientId, username = "Anonymous") {
        try {
            userExists = User.getUser({ clientId }) // check if user exist with this clientId
        }
        catch { }

        if (userExists) { // a user has already been created with this id
            if (userExists.connected) {
                throw new Error("Tab is already open with same client id")
            }
            else {
                userExists.connected = true;
                userExists.socketId = socketId;  // use this socket as the primary for this user now
                return userExists;
            }
        }

        this.socketId = socketId;
        this.clientId = clientId;
        this.username = username
        this.connected = true;
        let userExists;

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
        for (let i = 0; i < User.#users.length; i++) {
            const user = User.#users[i];
            if (user.clientId === clientId || user.socketId === socketId) {
                return user
            }
        }

        throw new Error("User not found")
    }

    static delete(user) {
        for (let i = 0; i < User.#users.length; i++) {
            const currUser = User.#users[i];
            if (user.isSameUser(currUser)) {
                User.#users.splice(i, 1)  // remove the one user
                return;
            }
        }
    }

    static getClientIdFromSocket(socket) {
        const cookies = cookie.parse(socket.request.headers.cookie)
        if (!cookies[consts.CLIENT_COOKIE_KEY]) {
            socket.emit(SOCKET_EVENTS.MISSING_COOKIE)  // TODO this needs implementing
            return;
        }
        return cookies[consts.CLIENT_COOKIE_KEY]
    }

    static getClientIdFromRequest(req) {
        const clientId = req.cookies[consts.CLIENT_COOKIE_KEY]
        if (!clientId) {
            console.error("NO CLIENT ID FOUND - IMPLEMENT HANDLER") //TODO <--- this
        }
        return clientId
    }
}