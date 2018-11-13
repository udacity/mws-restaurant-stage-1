if ('serviceWorker' in navigator) {
  navigator.serviceWorker
    .register('/sw.js')
    .then(function () { console.log("Service Worker registered!"); })
    .catch(function() { console.log("Service Worker failed to register.")});
}
