//Install service worker
if (navigator.serviceWorker) {
      navigator.serviceWorker.register('/sw.js').then(function(registration) {
        // Registration was successful
        console.log('ServiceWorker registration successful with scope: ', registration.scope);
      }).catch((err) => {
  console.log('ServiceWorker registration failed: ', err);
});  
}