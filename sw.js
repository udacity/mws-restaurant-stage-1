// think of this as a background server running  
var cacheID = 'mws-restaurant-v1';

// install service worker caches
self.addEventListener('install', event => {

});

self.addEventListener('install', function(event) {
    event.waitUntil(
      caches.open('v1').then(function(cache) {
        return cache.addAll([
          '/',
          '/index.html',
          '/restaurant.html',
          '/css/styles.css',
          '/js/',
          '/js/dbhelper.js',
          '/js/main.js',
          '/js/register.js',
          '/js/restaurant_info.js',
          '/img/restaurant-default.jpg'
        ]);
      })
    );
  });

// listen for fetch events
self.addEventListener('fetch', function(event) {
    event.respondWith(
      caches.match(event.request).then(function(resp) {
        return resp || fetch(event.request).then(function(response) {
          let responseClone = response.clone();
          caches.open('mws-restaurant-v1').then(function(cache) {
            cache.put(event.request, responseClone);
          });
  
          return response;
        });
      }).catch(function() {
        return caches.match('/img/restaurant-default.jpg');
      })
    );
  });