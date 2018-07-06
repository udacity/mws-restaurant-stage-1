if ("serviceWorker" in navigator) {
    navigator.serviceWorker
        .register("/js/sw.js")
        .then(reg => {
        console.log("Service Worker was registered sucessfully!");
    })
    .catch(error => {
        console.log("Registration failed!" + error);
    });
}