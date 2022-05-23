export default class User {
    constructor(socketId, clientId, username = "Anonymous") {
        this.socketId = socketId;
        this.clientId = clientId;
        this.username = username
    }

    isSameUser(user) {
        return this.clientId === user.clientId;
    }

    updateSocketId(socketId) {
        console.log(`Updating socket id for ${this.username}`)
        this.socketId = socketId;
    }
}