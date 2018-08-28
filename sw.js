let staticCacheName = 'c3';

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(staticCacheName).then(function(cache) {
      return cache.addAll([
        '/',
        'js/dbhelper.js',
        'js/main.js',
        'js/restaurant_info.js',
        'css/styles.css',
        'css/responsive.css',
        'img/1_small.jpg',
        'img/1.jpg',
        'img/404-page-not-found.jpg',
        'https://unpkg.com/leaflet@1.3.1/dist/leaflet.js',
        'https://unpkg.com/leaflet@1.3.1/dist/leaflet.css'
      ]);
    })
  );
});

self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.filter(function(cacheName) {
          return cacheName.startsWith('c') &&
                 cacheName != staticCacheName;
        }).map(function(cacheName) {
          return caches.delete(cacheName);
        })
      );
    })
  );
});

self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request).then(function(response) {
      return response || fetch(event.request).then(function(resp){
          caches.open(staticCacheName).then(function(cache){
              cache.add(event.request.url);
          });
          return resp;
      }).catch(function(){
          return caches.match('img/404-page-not-found.jpg');
      });
    })
  );
});
