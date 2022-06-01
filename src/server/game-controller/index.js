import SOCKET_EVENTS from "../../socket-events"
import User from "../user"

export default class GameController {
    #currentMatch = [];
    #controllerState = new Map();  // clientId -> controller State

    static #gameController;

    constructor(ioRef) {
        if (GameController.#gameController) {
            return this.getInstance();
        }
        this.ioRef = ioRef;

        GameController.#gameController = this;
    }

    static getInstance() {
        return GameController.#gameController;
    }

    createControllerState(user) {
        this.#controllerState.set(user.clientId, {
            N: false,
            E: false,
            S: false,
            W: false,
        })
    }

    resetControllerState() {
        this.#controllerState = new Map();
    }

    controlCommand() {
        throw new Error("not implemented");
    }

    startMatch(queue, carHandler) {  // arrays of user objects, one for each player
        const players = [];

        carHandler.cars.forEach((car) => {
            const currPlayer = queue.get(0)
            players.push(currPlayer);  // add the player to the current match
            queue.remove(currPlayer);  // remove the player from the queue

            this.createControllerState(currPlayer, car);
            this.ioRef.to(currPlayer.socketId).emit(SOCKET_EVENTS.REDIRECT, "play")
            console.log(`sending redirect event to player ${currPlayer.username}`)
        })

        this.#currentMatch = players;
    }

    endMatch(winner) {
        throw new Error("not implemented");
    }

    isGameLive() {
        return this.#currentMatch.length == 2
    }

    kickPlayer() {
        throw new Error("not implemented");
    }

    getCarId(clientId) {
        const user = User.getUser({ clientId })
        return this.#currentMatch.indexOf(user)
    }
}