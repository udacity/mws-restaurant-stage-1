var CACHE_NAME = 'my-restaurant-cache-v1';
var urlsToCache = [
  '/'.
  'js/main.js',
  'css/styles.css',
  'img/1.jpg'
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
