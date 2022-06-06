import SOCKET_EVENTS from "../../socket-events"
import User from "../user"

export default class GameController {
    #currentMatch = [];
    #controllerState = {};  // clientId -> controller State

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
        this.#controllerState[user.clientId] = {
            N: false,
            E: false,
            S: false,
            W: false,
        }
    }

    resetControllerState() {
        this.#controllerState = {}
    }

    controlCommand(clientId, direction, pressedDown) {
        this.#controllerState[clientId][direction] = pressedDown
        console.log(this.#controllerState[clientId])
    }

    startMatch(queue, cars) {  // arrays of user objects, one for each player
        const players = [];

        cars.forEach((car) => {
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
        this.#currentMatch = [];  // reset the current match array
        console.log("I NEED TO TRY TO START A NEW MATCH") //TODO this
    }

    isGameLive() {
        return this.#currentMatch.length > 0
    }

    getCarId(clientId) {
        const user = User.getUser({ clientId })
        return this.#currentMatch.indexOf(user)
    }

    getCurrentMatch() {
        return this.#currentMatch;
    }

    isUserInGame(user) {
        return this.#currentMatch.filter(currUser => currUser.clientId === user.clientId).length > 0  // is the user in the current match
    }

    kickPlayer(clientId) {  // kick the player and end the game if there is no one left playing 
        let playerIndex = -1;
        for (let i = 0; i < this.#currentMatch.length; i++) {
            const player = this.#currentMatch[i];
            if (player.clientId === clientId) {
                playerIndex = i;
                break;  // exit the loop
            }
        }

        if (playerIndex === -1) {  // if the player has not been found exit early
            return
        }

        this.#currentMatch[playerIndex] = null;  // set the player as undefined
        if (this.#currentMatch.filter(user => user !== null).length === 0) {  // if all users in the match have disconnected
            this.endMatch();
        }
    }
}