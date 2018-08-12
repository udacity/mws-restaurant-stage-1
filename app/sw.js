var CACHE_NAME = 'my-restaurant-cache-v1';
var urlsToCache = [
  '/',
  'js/dbhelper.js',
  'js/main.js',
  'js/idb.js',
  // 'js/restaurant_info.js',
  'css/styles.css',
  'img/tiles/1_1x.jpg',
  'img/tiles/2_1x.jpg',
  'img/tiles/3_1x.jpg',
  'img/tiles/4_1x.jpg',
  'img/tiles/5_1x.jpg',
  'img/tiles/6_1x.jpg',
  'img/tiles/7_1x.jpg',
  'img/tiles/8_1x.jpg',
  'img/tiles/9_1x.jpg',
  'img/tiles/10_1x.jpg'
];

self.addEventListener('install', event => {
  // Perform install steps
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      }).catch((error) => {
        console.error('Failed to cache', error);
      })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        if (response) return response;
        return fetch(event.request);
      })
  );
});
