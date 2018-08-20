// Start a cache

var cacheName = 'mws-restaurant-v4';
var urlsToCache = [
      '/',
      '/restaurant.html',
      '/index.html',
      '/manifest.json',
      '/certificates.js',
      '/css'
     ];

// Open the cache & add urls     

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open('cacheName').then(function(cache) {
      console.log('Opened Cache');

      // Print all cached urls to the console - double check that its working!
      console.log('urlsToCache');
      return cache.addAll(urlsToCache);
    })
  );
}); 

// Intercept and return cached version of assets

self.addEventListener('fetch', function(event) {
 console.log(event.request.url);

 // Look at incoming request, serve the cached verison (if it exists)

 event.respondWith(
   caches.match(event.request).then(function(response) {
     return response || fetch(event.request);
   })
 );
});

// Source: https://developers.google.com/web/fundamentals/codelabs/offline/ >> VERY HELPFUL

//
//self.addEventListener('fetch', function(event) {
  // TODO: respond with an entry from the cache if there is one.
  // If there isn't, fetch from the network.
//    event.respondWith(
//    caches.match(event.request).then(function(response){
//      if (response) return response;
//      return fetch(event.request);
//      }
//  ));
//});
