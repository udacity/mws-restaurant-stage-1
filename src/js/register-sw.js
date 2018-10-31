/**
 * Register Service Worker
 */
if ('serviceWorker' in navigator) {
    navigator.serviceWorker
    .register('/sw.js', {
      scope: '/'
    })
    .then(function(register) {
      console.log('Service Worker Registered');
    })
    .catch(function(error) {
      console.error(error);
    })
  } else {
    console.log('Service Worker Not Registered');
  }