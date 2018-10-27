/**
 * Credits:
 * This application uses Open Source components and is modified from original. 
 * You can find the source code of their open source projects along with license information below. 
 * I acknowledge and grateful to this developer for their contributions to open source.
 * https://googlechrome.github.io/samples/service-worker/basic/
 * 
 * http://www.apache.org/licenses/LICENSE-2.0
 */
//const PRECACHE = 'restaurant-023';
//const RUNTIME = 'runtime';
const cacheName = 'restaurant-004';

// A list of local resources we always want to be cached.
const PRECACHE_URLS = [
  '/',
  '/restaurant.html',
  'css/styles.css',
  'js/main.js',
  'js/restaurant_info.js',
  'data/restaurants.json'
];

// The install handler takes care of precaching the resources we always need.
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(cacheName)
      .then(cache => cache.addAll(PRECACHE_URLS))
      .then(self.skipWaiting())
  );
});

self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.open(cacheName).then(function(cache) {
      return cache.match(event.request).then(function (response) {
        return response || fetch(event.request).then(function(response) {
          cache.put(event.request, response.clone());
          return response;
        });
      });
    })
  );
});
