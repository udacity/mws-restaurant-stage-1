//register service worker
//credit student ellyanalinden https://github.com/ellyanalinden/Restaurant-Project-1
if (!navigator.serviceWorker) {
    console.log('Service worker not supported');
} else {
    navigator.serviceWorker.register('/sw.js').then(function (Registration) {
      console.log('Registration successful with scope: ', Registration.scope);
    }).catch(function(err) {
      console.log('Registration failed with error: ', err);
    });
  } 