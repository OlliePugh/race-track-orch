export default class Queue {
    contents = [];

    add(user) {
        if (this.positionInQueue(user) === -1) {
            console.log(`Adding ${user.username} to queue`)
            this.contents.push(user)
        }
    }

    remove(user) {
        console.log(`Removing ${user} from queue`)
        const userPos = this.positionInQueue(user);
        if (userPos !== -1) {  // the user is in the queue
            this.contents = this.contents.splice(userPos, 1)  // remove the one user
        }
    }

    positionInQueue(user) {  // returns the index of the user
        for (let i = 0; i < this.contents.length; i++) {
            const currUser = this.contents[i];
            if (currUser.isSameUser(user)) {
                return i;
            }
        }
        return -1;
    }

    get(index) {
        return this.contents[index]
    }

}