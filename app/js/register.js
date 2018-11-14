/* Help from https://developers.google.com/web/fundamentals/primers/service-workers/registration 
  on registering a service worker */
  
if ('serviceWorker' in navigator) {
  navigator.serviceWorker
    .register('/sw.js')
    .then(function () { console.log("Service Worker registered!"); })
    .catch(function() { console.log("Service Worker failed to register.")});
}
