import SOCKET_EVENTS from "../../socket-events"
import User from "../user"

export default class GameController {
    #currentMatch = [];
    #controllerState = [];  // clientId -> controller State

    lastControlDispatchTime = 0;
    lastControlDispatchState;
    retryTimeout;

    static #gameController;
    static controlDispatchMinFreq = 25; // every 25 ms

    constructor(ioRef, serialHandler) {
        if (GameController.#gameController) {
            return this.getInstance();
        }
        this.ioRef = ioRef;
        this.serialHandler = serialHandler;

        GameController.#gameController = this;
    }

    static getInstance() {
        return GameController.#gameController;
    }

    resetControllerState() {
        for (let i = 0; i < this.#controllerState.length; i++) {
            this.#currentMatch[i] = {
                N: false,
                E: false,
                S: false,
                W: false
            };
        }
    }

    controlCommand(clientId, direction, pressedDown) {
        const carId = this.getCarId(clientId);
        this.#controllerState[carId][direction] = pressedDown
        this.dispatchControlState();
    }

    startMatch(queue, cars) {  // arrays of user objects, one for each player
        const players = [];

        cars.forEach((car) => {
            const currPlayer = queue.get(0)
            players.push(currPlayer);  // add the player to the current match
            this.#controllerState.push({
                N: false,
                E: false,
                S: false,
                W: false
            })
            queue.remove(currPlayer);  // remove the player from the queue

            this.ioRef.to(currPlayer.socketId).emit(SOCKET_EVENTS.REDIRECT, "play")
            console.log(`sending redirect event to player ${currPlayer.username}`)
        })
        this.#currentMatch = players;
    }

    endMatch(winner) {
        this.resetControllerState();
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

    async dispatchControlState(force) {
        this.lastControlDispatchState = this.#controllerState;
        if (!force && Date.now() < this.lastControlDispatchTime + this.controlDispatchMinFreq) {
            // has not been long enough since last send
            if (!retryTimeout) {
                retryTimeout = setTimeout(() => {
                    dispatchControlState(this.lastControlDispatchState);
                }, this.controlDispatchMinFreq - (Date.now() - this.lastControlDispatchTime));
            }
            return; // exit early
        }
        try {
            clearTimeout(this.retryTimeout);
            this.retryTimeout = null;
            const toSend = JSON.stringify({
                event: "controls",
                data: this.#controllerState,
            });
            this.lastControlDispatchTime = Date.now();
            await this.serialHandler.safeWrite(toSend);
        } catch (e) {
            console.error(`Error writing to serial device ${e}`);
        }
    };
}