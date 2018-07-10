if ("serviceWorker" in navigator) {
    navigator.serviceWorker
        .register("/js/sw.js")
        .then(reg => {
        console.log("SW registered!");
    })
    .catch(error => {
        console.log("SW Registration failed!" + error);
    });
}