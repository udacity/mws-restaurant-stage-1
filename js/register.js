if ("serviceWorker" in navigator) {
    navigator.serviceWorker
        .register("/sw.js", { scope: '/' })
        .then(reg => {
        console.log("SW registered!");
    })
    .catch(error => {
        console.log("SW Registration failed!" + error);
    });

    navigator.serviceWorker.ready.then(function (registration) {
        console.log('SW Ready!');
    });

}