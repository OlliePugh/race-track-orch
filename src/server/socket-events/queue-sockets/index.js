import User from "../../user"
import SOCKET_EVENTS from "../../../socket-events";

export default (socket, queue) => {
    socket.on(SOCKET_EVENTS.JOIN_QUEUE, (username = undefined) => {
        let user;
        try {
            user = User.getUser({ socketId: socket.id })
        }
        catch (e) {
            console.log("Socket ID not associated with user");
            return; // socket id not associated with a user ignoring 
        }
        user.setUsername(username);

        const positionInQueue = queue.positionInQueue(user)
        if (positionInQueue === -1) {  // if the user is not in the queue
            if (queue.closed) {
                socket.emit(SOCKET_EVENTS.MESSAGE, "Queue is closed!")
                return;
            }
            queue.add(user)
        }
        // if the user is already in the queue legit just ignore the request
    });

    socket.on(SOCKET_EVENTS.LEAVE_QUEUE, () => {
        let user;
        try {
            user = User.getUser({ socketId: socket.id })
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
}