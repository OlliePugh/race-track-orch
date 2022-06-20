import SOCKET_EVENTS from "../../../socket-events";
import GameController from "../../game-controller";

export const updateAdminQueue = (socket, queue) => {
    const usernameArray = queue.contents.map(item => item.username);
    socket.emit(SOCKET_EVENTS.ADMIN_USERNAME_QUEUE, usernameArray);
}

export default (socket, queue) => {
    socket.on(SOCKET_EVENTS.QUEUE_STATUS_REQUEST, () => {
        updateAdminQueue(socket, queue);
    })
    socket.on(SOCKET_EVENTS.BROADCAST_MESSAGE, (message) => {
        socket.broadcast.emit(SOCKET_EVENTS.MESSAGE, message)
    })
    socket.on(SOCKET_EVENTS.ADMIN_KICK_PLAYER, (id) => {
        console.log("kicking player")
        GameController.getInstance().kickPlayer(id);
    })
}