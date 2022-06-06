import User from "../../user"
import SOCKET_EVENTS from "../../../socket-events";

export default (socket, gameController) => {
    console.log("creating game socket")
    socket.on(SOCKET_EVENTS.DISCONNECT, () => {
        gameController.kickPlayer(User.getClientIdFromSocket(socket));
    })

    socket.on(SOCKET_EVENTS.CONTROL_DOWN, (direction) => {
        const clientId = User.getClientIdFromSocket(socket);
        gameController.controlCommand(clientId, direction, true)
    })

    socket.on(SOCKET_EVENTS.CONTROL_UP, (direction) => {
        const clientId = User.getClientIdFromSocket(socket);
        gameController.controlCommand(clientId, direction, false)
    })

}