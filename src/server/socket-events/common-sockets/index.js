import User from "../../user"
import SOCKET_EVENTS from "../../../socket-events";

export default (socket, queue) => {
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