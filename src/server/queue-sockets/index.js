import User from "../user"
import SOCKET_EVENTS from "../../socket-events";
import cookie from "cookie"

export default (socket, queue) => {
    socket.on(SOCKET_EVENTS.JOIN_QUEUE, (username = undefined) => {


        const user = User.getUser({ clientId: User.getClientId(socket) })
        user.setUsername(username);

        const positionInQueue = queue.positionInQueue(user)
        if (positionInQueue === -1) {  // if the user is not in the queue
            queue.add(user)
        }
        else if (queue.get(positionInQueue).socketId !== newUser.socketId) {  // user has different socket id but same client id cookie
            socket.emit(SOCKET_EVENTS.DUPLICATE_TAB)
        }
        // if the user is already in the queue legit just ignore the request
    });

    socket.on(SOCKET_EVENTS.LEAVE_QUEUE, () => {
        let user;
        try {
            user = User.getUser({ clientId: User.getClientId(socket) })
        }
        catch (e) {
            console.error("COULD NOT FIND USER THAT WAS IN THE QUEUE")
        }
        queue.remove(user);
        // if the user is already in the queue legit just ignore the request
    });

    socket.on(SOCKET_EVENTS.QUEUE_STATUS_REQUEST, () => {
        let user;
        let currentPosition;
        try {
            user = User.getUser({ socketId: socket.id });
            currentPosition = queue.positionInQueue(user)
        }
        catch (e) { }
        socket.emit(SOCKET_EVENTS.QUEUE_UPDATE, { current: currentPosition === -1 ? undefined : currentPosition, total: queue.contents.length })
    })

    socket.on(SOCKET_EVENTS.DISCONNECT, () => {
        let user;
        try {
            user = User.getUser({ socketId: socket.id });
        }
        catch (e) {  // user does not exist therefore discard
            return;
        }
        queue.remove(user)  // I have a feeling this disconnected logic between users and queue is going to make my life hell
        User.delete(user);
    })
}