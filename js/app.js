function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    console.log('This browser does not support Service Workers');
    return false;
  }
  console.log('Registering Service Worker 5.');
  navigator.serviceWorker.register('./sw.js')
    .then((registration) => {
      console.log(`ServiceWorker successfully registered: ${registration.scope}`);
    })
    .catch((err) => console.log(`ServiceWorker failed to register: ${err}`));
}

/**
 * At load of the website, register our service worker
 * and tell the user which Service worker Controller is running. 
 */
window.addEventListener('load', () => {
  registerServiceWorker();
});


// Request a one-off sync:
navigator.serviceWorker.ready.then(function (swRegistration) {    
  return swRegistration.sync.register('syncSWForOfflineReviews');
});

window.addEventListener('offline', () => console.log('Webpage is offline'));
window.addEventListener('online', () => { 
  console.log('Webpage is now online. Will attempt to submit reviews to server.');
  DBHelper.postOfflineReviewsToServer();
});