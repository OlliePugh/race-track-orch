import User from "../../user"
import SOCKET_EVENTS from "../../../socket-events";

export default (socket, gameController) => {
    console.log("creating game socket")
    socket.on(SOCKET_EVENTS.DISCONNECT, () => {
        gameController.kickPlayer(User.getClientIdFromSocket(socket));
    })
}