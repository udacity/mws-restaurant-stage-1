//

//if ('serviceWorker' in navigator) {
//  navigator.serviceWorker.register('/my-blog/sw.js', {
//    scope: '../../'
//  }).then(function(sw) {
//  }).catch(function() {
//    // registration failed :(
//  });
//}
//

// Listen for install event, set callback
self.addEventListener('install', function(event) {
    // Perform some task
});

self.addEventListener('activate', function(event) {
  // Perform some task
});