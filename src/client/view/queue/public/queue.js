const socket = io.connect(window.location.origin, { secure: true });

socket.on("connect", () => {
    console.log("hello there")
});

socket.on("duplicate-tab", () => {
    toggleDuplicateTab(true);
})

socket.on("missing-cookie", () => {
    alert("Something has gone wrong! Please reset your cookies and try again later")
})

const joinQueue = () => {
    console.log("ello")
    socket.emit("join-queue")
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