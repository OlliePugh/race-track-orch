export default class Queue {
    contents = [];

    static #queue;

    constructor(config = {}) {
        if (Queue.#queue) {
            return this.getInstance();
        }
        this.onAdd = config.onAdd;
        this.onRemove = config.onRemove;
        this.onChange = config.onChange;

        Queue.#queue = this;
    }

    static getInstance() {
        return Queue.#queue
    }

    add(user) {
        if (this.positionInQueue(user) === -1) {
            console.log(`Adding ${user.username} to queue`)
            this.contents.push(user)
            if (this.onAdd) {
                this.onAdd(user);
            }
            this.#changeCallback();
        }
    }

    remove(user) {
        console.log(`Removing ${user.username} from queue`)
        const userPos = this.positionInQueue(user);
        if (userPos !== -1) {  // the user is in the queue
            this.contents.splice(userPos, 1)  // remove the one user
            if (this.onRemove) {
                this.onRemove(user);
            }
            this.#changeCallback();
        }
    }

    positionInQueue(user) {  // returns the index of the user
        for (let i = 0; i < this.contents.length; i++) {
            const currUser = this.contents[i];
            if (currUser.isSameUser(user)) {
                return i;
            }
            this.#changeCallback();
        }
        return -1;
    }

    get(index) {
        return this.contents[index]
    }

    #changeCallback() {
        if (this.onChange) {
            this.onChange(this);
        }
    }

}