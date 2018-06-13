if (navigator.serviceWorker) {
  navigator.serviceWorker.register('/sw.js', { scope: '/' })
        .then(function(registration) {
              console.log('Service Worker Registered');
        });

      navigator.serviceWorker.ready.then(function(registration) {
         console.log('Service Worker Ready');
      });
  
}
