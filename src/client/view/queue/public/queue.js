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
    LEFT_QUEUE: "left-queue",
    QUEUE_STATUS_REQUEST: "queue-status-request",
    REDIRECT: "redirect"
}

const CONSTS = {
    LEAVE_QUEUE_TEXT: "Leave the Queue",
    JOIN_QUEUE_TEXT: "Join the Queue"
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

socket.on(SOCKET_EVENTS.LEFT_QUEUE, () => {
    toggleInQueueHud(false);
})

socket.on(SOCKET_EVENTS.REDIRECT, (data) => {
    console.log(`Recvd redirect command to ${data}`)
    window.location.replace(data);
})

const joinQueue = () => {
    let username = document.getElementById("username-input").value
    if (!username) {
        username = "Anonymous"
    }
    toggleInQueueHud(true);
    socket.emit(SOCKET_EVENTS.JOIN_QUEUE, username)
}

const leaveQueue = () => {
    console.log("leaving queue")
    toggleInQueueHud(false);
    socket.emit(SOCKET_EVENTS.LEAVE_QUEUE)
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
    document.getElementById("in-queue-message").style.display = state ? "block" : "none"
    document.getElementById("not-in-queue-message").style.display = state ? "none" : "block";
    document.getElementById("username-input").disabled = state;

    document.getElementById("join-button").onclick = state ? leaveQueue : joinQueue
    document.querySelectorAll("#join-button p")[0].textContent = state ? CONSTS.LEAVE_QUEUE_TEXT : CONSTS.JOIN_QUEUE_TEXT
}

const updateQueue = (current, total) => {
    if (current) {
        document.getElementById("current-queue-position").textContent = current;
    }
    document.querySelectorAll(".total-queue-count").forEach(dom => {
        dom.textContent = total
    })
}