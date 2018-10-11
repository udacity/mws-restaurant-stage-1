var CACHE_NAME = 'apcache2';
var urlsToCache = [
  '/',
  'index.html',
  'restaurant.html',
  '/css/styles.css',
  '/js/main.js',
  '/js/dbhelper.js',
  '/js/restaurant_info.js',
  '/js/idb-test.js',
  'favicon.ico'
];

self.addEventListener('install', function(event) {
// Perform install steps
event.waitUntil(
  caches.open(CACHE_NAME)
    .then(function(cache) {
      console.log('Opened cache');
      return cache.addAll(urlsToCache);
    })
);
});

self.addEventListener('fetch', function(event) {
event.respondWith(
  caches.match(event.request)
    .then(function(response) {
      // Cache hit - return response
      if (response) {
        return response;
      }
      return fetch(event.request);
    }
  )
);
});
