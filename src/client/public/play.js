const socket = io.connect(window.location.origin, { secure: true });

const SOCKET_EVENTS = {
    CONNECT: "connect",
    DISCONENCT: "disconnect",
    MATCH_END: "match_end"
}


socket.on(SOCKET_EVENTS.CONNECT, () => {
    console.log("Socket connected")
});

socket.on(SOCKET_EVENTS.DISCONNECT, () => { alert("Lost connection to server! Please refresh") });
