import SOCKET_EVENTS from "../../socket-events"
import User from "../user"
import Queue from "../queue"
import { cars } from "../car-handler";
import { admins } from "../app";

export default class GameController {
    #currentMatch = [];
    #controllerState = [];

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

    addControllerState() {
        this.#controllerState.push({
            N: false,
            E: false,
            S: false,
            W: false
        })
    }

    resetControllerState() {
        for (let i = 0; i < this.#controllerState.length; i++) {
            this.#controllerState[i] = {
                N: false,
                E: false,
                S: false,
                W: false
            };
        }
        this.dispatchControlState();  // stop the cars
    }

    disableUsersControls(index) {
        this.#controllerState[index] = {
            N: false,
            E: false,
            S: false,
            W: false
        }
    }

    controlCommand(clientId, direction, pressedDown) {
        const carId = this.getCarId(clientId);
        if (carId === -1) {
            return  // user is not in the game
        }
        this.#controllerState[carId][direction] = pressedDown
        this.dispatchControlState();
    }

    startMatch(queue, cars) {  // arrays of user objects, one for each player
        const players = [];

        cars.forEach((_, index) => {
            const currPlayer = queue.get(index)
            players.push(currPlayer);  // add the player to the current match

            this.ioRef.to(currPlayer.socketId).emit(SOCKET_EVENTS.REDIRECT, "play")
            console.log(`sending redirect event to player ${currPlayer.username}`)
        })
        this.#currentMatch = players;
        this.#currentMatch.forEach(player => {
            queue.remove(player);  // remove the player from the queue
        })
        admins.forEach(admin => {
            this.ioRef.to(admin).emit(SOCKET_EVENTS.ADMIN_USERNAME_PLAYERS, this.#currentMatch)
        })  // send update to each admin
    }

    endMatch() {
        this.resetControllerState();
        this.#currentMatch.forEach(player => {
            if (player?.socketId != undefined) {
                this.ioRef.to(player.socketId).emit(SOCKET_EVENTS.REDIRECT, "/?message=Race%20has%20ended")  // send the player back to the starting screen
            }
        })
        this.#currentMatch = [];  // reset the current match array
        this.startMatchIfReady(Queue.getInstance(), cars);
    }

    startMatchIfReady(queue, cars) {
        if (queue.contents.length >= cars.length && cars.length != 0 && !this.isGameLive()) {
            this.startMatch(queue, cars)
        }
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
        return this.#currentMatch.filter(currUser => currUser?.clientId === user.clientId).length > 0  // is the user in the current match
    }

    kickPlayer(clientId) {  // kick the player and end the game if there is no one left playing 
        let playerIndex = -1;
        for (let i = 0; i < this.#currentMatch.length; i++) {
            const player = this.#currentMatch[i];
            if (player?.clientId === clientId) {
                playerIndex = i;
                break;  // exit the loop
            }
        }
        if (playerIndex === -1) {  // if the player has not been found exit early
            return
        }
        this.ioRef.to(this.#currentMatch[playerIndex].socketId).emit(SOCKET_EVENTS.REDIRECT, "/")
        this.disableUsersControls(playerIndex);
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