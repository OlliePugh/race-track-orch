const socket = io.connect(window.location.origin, { secure: true });

socket.on("connect", function () {
    console.log("hello there")
});