import User from "../../user"
import SOCKET_EVENTS from "../../../socket-events";

export default (socket, queue) => {
    socket.on(SOCKET_EVENTS.JOIN_QUEUE, (username = undefined) => {
        const user = User.getUser({ clientId: User.getClientId(socket) })
        user.setUsername(username);

        const positionInQueue = queue.positionInQueue(user)
        if (positionInQueue === -1) {  // if the user is not in the queue
            queue.add(user)
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
}