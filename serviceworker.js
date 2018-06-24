const staticCache = 'restaurant-cache-v1';

const filesToCache = [
  'js/main.js',
  'js/dbhelper.js',
  'js/restaurant_info.js',
  'css/styles.css',
  'data/restaurants.json',
  '/',
  'restaurant.html'
  
]

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(staticCache).then(function(cache) {
      return cache.addAll(filesToCache);
    }) 
  );
});

self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request).then(function(response) {
      return response || fetch(event.request);
    }).catch(function(e) {
      console.log('An error occured fetching cache', e);
    })
  );
});
