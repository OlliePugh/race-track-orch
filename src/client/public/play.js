const socket = io.connect(window.location.origin, { secure: true });

const SOCKET_EVENTS = {
    CONNECT: "connect",
    DISCONENCT: "disconnect",
    MATCH_END: "match_end",
    CONTROL_DOWN: "control_down",
    CONTROL_UP: "control_up",
    REDIRECT: "redirect"
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

socket.on(SOCKET_EVENTS.REDIRECT, (data) => {
    console.log(`Recvd redirect command to ${data}`)
    window.location.replace(data);
})

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

const setupMobileControls = () => {
    ["N", "E", "S", "W"].forEach((direction) => {
        const el = document.getElementById(`${direction}-canvas`);
        el.addEventListener("touchstart", () => {
            socket.emit(SOCKET_EVENTS.CONTROL_DOWN, direction);
        });
        el.addEventListener("touchend", () => {
            socket.emit(SOCKET_EVENTS.CONTROL_UP, direction);
        });
        el.addEventListener("touchcancel", () => {
            socket.emit(SOCKET_EVENTS.CONTROL_UP, direction);
        });
    });
};

document.addEventListener("DOMContentLoaded", function (event) {
    setupMobileControls();
});

var canvas = document.querySelector('canvas');
fitToContainer(canvas);

function fitToContainer(canvas) {
    // Make it visually fill the positioned parent
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    // ...then set the internal size to match
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
}

// var initialOffset = null;
// let lastRotated = false;
// function handleOrientation(evt) {
//     if (initialOffset === null && evt.absolute !== true
//         && +evt.webkitCompassAccuracy > 0 && +evt.webkitCompassAccuracy < 50) {
//         initialOffset = evt.webkitCompassHeading || 0;
//     }

//     var alpha = evt.alpha - initialOffset;
//     if (alpha < 0) {
//         alpha += 360;
//     }

//     if (alpha > 110) {
//         if (!lastRotated) {
//             console.log("turning left")
//             socket.emit(SOCKET_EVENTS.CONTROL_DOWN, CONTROL_MAP.ArrowLeft);
//             socket.emit(SOCKET_EVENTS.CONTROL_UP, CONTROL_MAP.ArrowRight);
//             lastRotated = true;
//         }
//     }
//     else if (alpha < 70) {
//         if (!lastRotated) {
//             console.log("turning right")
//             socket.emit(SOCKET_EVENTS.CONTROL_DOWN, CONTROL_MAP.ArrowRight);
//             socket.emit(SOCKET_EVENTS.CONTROL_UP, CONTROL_MAP.ArrowLeft);
//             lastRotated = true;
//         }
//     }
//     else if (lastRotated) {  // is no longer in a rotated state
//         socket.emit(SOCKET_EVENTS.CONTROL_UP, CONTROL_MAP.ArrowRight);
//         socket.emit(SOCKET_EVENTS.CONTROL_UP, CONTROL_MAP.ArrowLeft);
//         lastRotated = false;
//         console.log("stop rotating")
//     }

//     console.log(alpha);
//     // Now u
// }

// if (window.DeviceOrientationEvent) {
//     console.log("is working")
//     window.addEventListener("deviceorientation", handleOrientation, false);
// }