const socket = io.connect(window.location.origin, { secure: true });

const SOCKET_EVENTS = {
    CONNECT: "connect",
    DISCONENCT: "disconnect",
    MATCH_END: "match_end",
    CONTROL_DOWN: "control_down",
    CONTROL_UP: "control_up"
}

const CONTROL_MAP = {
    KeyW: "N",
    KeyS: "S",
    KeyD: "E",
    KeyA: "W",
    ArrowUp: "N",
    ArrowDown: "S",
    ArrowLeft: "W",
    ArrowRight: "E",
};


socket.on(SOCKET_EVENTS.CONNECT, () => {
    console.log("Socket connected")
});

socket.on(SOCKET_EVENTS.DISCONNECT, () => { alert("Lost connection to server! Please refresh") });

document.addEventListener("keydown", (event) => {
    if (!event.repeat) {
        // only on state change
        if (Object.keys(CONTROL_MAP).includes(event.code)) {
            event.preventDefault();
            socket.emit(SOCKET_EVENTS.CONTROL_DOWN, CONTROL_MAP[event.code]);
        }
    }
});

document.addEventListener("keyup", (event) => {
    if (Object.keys(CONTROL_MAP).includes(event.code)) {
        event.preventDefault();
        socket.emit(SOCKET_EVENTS.CONTROL_UP, CONTROL_MAP[event.code]);
    }
});
