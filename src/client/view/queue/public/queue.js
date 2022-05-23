const socket = io.connect(window.location.origin, { secure: true });

const SOCKET_EVENTS = {  // webpack was made for things like this
    CONNECT: "connect",
    DUPLICATE_TAB: "duplicate-tab",
    MISSING_COOKIE: "missing-cookie",
    JOIN_QUEUE: "join-queue",
    LEAVE_QUEUE: "leave-queue",
    QUEUE_UPDATE: "queue-update"
}

socket.on(SOCKET_EVENTS.CONNECT, () => {
    console.log("hello there")
});

socket.on(SOCKET_EVENTS.DUPLICATE_TAB, () => {
    toggleDuplicateTab(true);
})

socket.on(SOCKET_EVENTS.MISSING_COOKIE, () => {
    alert("Something has gone wrong! Please reset your cookies and try again later")
})

socket.on(SOCKET_EVENTS.QUEUE_UPDATE, ({ current, total }) => {
    console.log(current)
    console.log(total)
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

const makeMainTab = () => {
    toggleDuplicateTab(false);
}