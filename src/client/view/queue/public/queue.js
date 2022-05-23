const socket = io.connect(window.location.origin, { secure: true });

const SOCKET_EVENTS = {  // webpack was made for things like this
    CONNECT: "connect",
    DISCONNECT: "disconnect",
    DUPLICATE_TAB: "duplicate-tab",
    MISSING_COOKIE: "missing-cookie",
    JOIN_QUEUE: "join-queue",
    LEAVE_QUEUE: "leave-queue",
    QUEUE_UPDATE: "queue-update",
    JOINED_QUEUE: "joined-queue",
    QUEUE_STATUS_REQUEST: "queue-status-request"
}

socket.on(SOCKET_EVENTS.CONNECT, () => {
    console.log("Socket connected")
    socket.emit(SOCKET_EVENTS.QUEUE_STATUS_REQUEST)
});
socket.on(SOCKET_EVENTS.DISCONNECT, () => { alert("Lost connection to server! Please refresh") });

socket.on(SOCKET_EVENTS.DUPLICATE_TAB, () => {
    toggleDuplicateTab(true);
})

socket.on(SOCKET_EVENTS.MISSING_COOKIE, () => {
    alert("Something has gone wrong! Please reset your cookies and try again later")
})

socket.on(SOCKET_EVENTS.QUEUE_UPDATE, ({ current, total }) => {
    updateQueue(current, total)
})

socket.on(SOCKET_EVENTS.JOINED_QUEUE, () => {
    toggleInQueueHud(true);
})

const joinQueue = () => {
    socket.emit(SOCKET_EVENTS.JOIN_QUEUE)
}

const toggleDuplicateTab = (state) => {
    const wrapper = document.getElementById("duplicate-tab-wrapper")
    if (state) {
        wrapper.style.display = "block"
    } else {
        setTimeout(200, () => {
            wrapper.style.display = "none"
        })  // the lenght of the animation
    }
    wrapper.style.opacity = state ? "90%" : "0%";
    document.getElementById("join-button").disabled = state
}

const makeMainTab = () => {  // TODO THIS NEEDS FINISHING
    toggleDuplicateTab(false);
}

const toggleInQueueHud = (state) => {
    document.getElementById("in-queue-message").style.display = "block"
    document.getElementById("not-in-queue-message").style.display = state ? "none" : "block";
}

const updateQueue = (current, total) => {
    if (current) {
        document.getElementById("current-queue-position").textContent = current;
    }
    document.querySelectorAll(".total-queue-count").forEach(dom => {
        dom.textContent = total
    })
}