var CACHE_VERSION = 'rr-app-v1';
var CACHE_FILES = [
    '/',
    '/index.html',
    'js/main.js',
    'js/dbhelper.js',
    'js/restaurant_info.js',
    'css/syles.css',
    '/restaurant.html',
    '/images'
 ]

self.addEventListener('install', function(event) {
    event.waitUntil(
      caches.open(CACHE_VERSION).then(function (cache){
        console.log('Opened cache');
        return cache.addAll(CACHE_FILES);
      })
    );
});

self.addEventListener('activate', function(event) {

  var cacheWhitelist = ['rr-app-v1'];

  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

self.addEventListener('fetch', function (event) {
  event.respondWith(
      caches.match(event.request).then(function(response){
          if(response){
              return response;
          }
          var fetchRequest = event.request.clone();

          return fetch(fetchRequest).then(
            function(response) {
              if(!response || response.status !== 200 || response.type !== 'basic'){
                return response;
              }
              var responseToCache = response.clone();

              caches.open(CACHE_VERSION).then(function(cache){
                cache.put(event.request, responseToCache);
              });
            return response;
            }
          );
      })
  );
});