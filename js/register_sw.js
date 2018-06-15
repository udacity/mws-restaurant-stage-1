// Service Worker JS
// Register service worker and cache the website for offline usage

// Check if service worker is supported and register the service worker
if('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./js/sw.js').then((registration) => {
            // Successfully registered
            console.log("Service worker registered successfully ", registration.scope);
        }, (err) => {
            // Error occured
            console.log("Service worker registration failed ", err);
        })
    })
}