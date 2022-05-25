const socket = io.connect(window.location.origin, { secure: true, query: `admin=true` });

socket.on(SOCKET_EVENTS.CONNECT, () => {
    console.log("Socket connected")
    socket.emit(SOCKET_EVENTS.QUEUE_STATUS_REQUEST)
});