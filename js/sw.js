
var staticCacheName = 'mws-restaurant-stage-1-master';
let fileToCache = [
   'index.html',
   'restaurant.html',
   'js/dbhelper.js',
   'js/main.js',
   'js/restaurant_info.js',
   'sw.js',
   'css/styles.css',
   'data/restaurants.json',
];

self.addEventListener('install', function(event) {
  console.log('service worker installed');
  event.waitUntil(
    caches.open(staticCacheName).then(function(cache) {
      console.log('serviceWorker is caching app shell');
      return cache.addAll(fileToCache);
    })
  );
});

self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.filter(function(cacheName) {
          return cacheName.startsWith('nws-') &&
                 cacheName != staticCacheName;
        }).map(function(cacheName) {
          return caches.delete(cacheName);
        })
      );
    })
  );
});

self.addEventListener('fetch', function(event) {
  console.info('Event: Fetch');
  console.log(event.request);
  event.respondWith(
    caches.match(event.request).then(function(response) {
      return response || fetch(event.request);
    })
  );
});

self.addEventListener('message', function(event) {
  if (event.data.action === 'skipWaiting') {
    self.skipWaiting();
  }
});
