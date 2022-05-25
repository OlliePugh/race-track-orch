import SOCKET_EVENTS from "../../../socket-events";

export const updateAdminQueue = (socket, queue) => {
    const usernameArray = queue.contents.map(item => item.username);
    socket.emit(SOCKET_EVENTS.ADMIN_USERNAME_QUEUE, usernameArray);
}

export default (socket, queue) => {
    socket.on(SOCKET_EVENTS.QUEUE_STATUS_REQUEST, () => {
        updateAdminQueue(socket, queue);
    })
}