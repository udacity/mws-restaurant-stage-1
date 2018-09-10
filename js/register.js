// Registering the service worker

if ("serviceWorker" in navigator) {
    navigator.serviceWorker
        .register("serviceWorker.js")
        .then(reg => {
            console.log("The service worker registration succeeded.  " + reg.scope)
        })
        .catch(error => {
            console.log("The service worker registration failed.  " + error);
        })
}
