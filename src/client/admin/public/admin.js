const socket = io.connect(window.location.origin, { secure: true, query: `admin=true` });

const SOCKET_EVENTS = {
    CONNECT: "connect",
    QUEUE_STATUS_REQUEST: "queue-status-request",
    ADMIN_USERNAME_QUEUE: "admin-username-queue",
    DISCONNECT: "disconnect",
    BROADCAST_MESSAGE: "broadcast-message"
}

socket.on(SOCKET_EVENTS.CONNECT, () => {
    console.log("Socket connected")
    socket.emit(SOCKET_EVENTS.QUEUE_STATUS_REQUEST)
});

socket.on(SOCKET_EVENTS.ADMIN_USERNAME_QUEUE, (queue) => {
    updateQueueTable(queue);
})

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

const broadcastMessage = () => {
    const message = document.getElementById("broadcast-input").value
    socket.emit(SOCKET_EVENTS.BROADCAST_MESSAGE, message)
}