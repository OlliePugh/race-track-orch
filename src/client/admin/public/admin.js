const socket = io.connect(window.location.origin, { secure: true, query: `admin=true` });

const SOCKET_EVENTS = {
    CONNECT: "connect",
    QUEUE_STATUS_REQUEST: "queue-status-request",
    ADMIN_USERNAME_QUEUE: "admin-username-queue",
    ADMIN_USERNAME_PLAYERS: "admin-username-players",
    DISCONNECT: "disconnect",
    BROADCAST_MESSAGE: "broadcast-message",
    ADMIN_KICK_PLAYER: "admin-kick-player"
}

socket.on(SOCKET_EVENTS.CONNECT, () => {
    console.log("Socket connected")
    socket.emit(SOCKET_EVENTS.QUEUE_STATUS_REQUEST)
});

socket.on(SOCKET_EVENTS.ADMIN_USERNAME_QUEUE, (queue) => {
    updateQueueTable(queue);
})

socket.on(SOCKET_EVENTS.ADMIN_USERNAME_PLAYERS, (players) => {
    updatePlayersTable(players);
});

socket.on(SOCKET_EVENTS.DISCONNECT, () => { alert("Lost connection to server! Please refresh") });

const updateQueueTable = (queue) => {
    const queueList = document.getElementById("queue-list");
    queueList.innerHTML = "";  // delete all contents
    queue.forEach((username, index) => {
        const element = document.createElement("p");
        element.innerText = `${index + 1}: ${username}`
        queueList.appendChild(element)
    });
}

const updatePlayersTable = (players) => {
    const playersList = document.getElementById("players-list");
    playersList.innerHTML = "";  // delete all contents
    players.forEach(player => {
        const element = document.createElement("div");
        const kickButton = document.createElement("button")
        const usernameDom = document.createElement("span")
        usernameDom.innerText = player.username;
        kickButton.innerText = "X"
        kickButton.onclick = () => { kickPlayer(player.clientId) }
        element.appendChild(kickButton)
        element.appendChild(usernameDom)
        playersList.appendChild(element)
    });
}

const broadcastMessage = () => {
    const message = document.getElementById("broadcast-input").value
    socket.emit(SOCKET_EVENTS.BROADCAST_MESSAGE, message)
}

const kickPlayer = (id) => {
    socket.emit(SOCKET_EVENTS.ADMIN_KICK_PLAYER, id)
    console.log(`kicking ${id}`)
}