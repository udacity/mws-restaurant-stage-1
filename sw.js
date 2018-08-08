var cacheID = "mws-restaurant-v1";

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open('mws-restaurant-v1').then(function(cache) {
      return cache.addAll([
      '/',
      '/css/styles.css',
      '/data/restaurants.json',
      '/img',
      'js/dbhelper.js',
      'js/main.js',
      'js/restaurant_info.js'
     ]);
    });
  )
}); 

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
