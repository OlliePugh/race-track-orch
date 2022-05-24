import { AssertionError } from "assert"
export default class User {

    static #users = [];

    constructor(socketId, clientId, username = "Anonymous") {
        this.socketId = socketId;
        this.clientId = clientId;
        this.username = username
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
}