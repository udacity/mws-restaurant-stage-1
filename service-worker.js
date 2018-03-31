const CACHE_NAME = 'mws-restaurant-stage-1-cache-v15';
const FILES_TO_CACHE = [
  '/',
  'https://fonts.googleapis.com/css?family=Roboto:300,400,500,700',
  '/index.html',
  '/restaurant.html',
  '/js/dbhelper.js',
  '/js/main.js',
  '/js/restaurant_info.js',
  '/css/styles.css',
  '/img/1_large.webp',
  '/img/1_medium.webp',
  '/img/1_small.webp',
  '/img/2_large.webp',
  '/img/2_medium.webp',
  '/img/2_small.webp',
  '/img/3_large.webp',
  '/img/3_medium.webp',
  '/img/3_small.webp',
  '/img/4_large.webp',
  '/img/4_medium.webp',
  '/img/4_small.webp',
  '/img/5_large.webp', 
  '/img/5_medium.webp',
  '/img/5_small.webp',
  '/img/6_large.webp',
  '/img/6_medium.webp',
  '/img/6_small.webp',
  '/img/7_large.webp',
  '/img/7_medium.webp',
  '/img/7_small.webp',
  '/img/8_large.webp',
  '/img/8_medium.webp',
  '/img/8_small.webp',
  '/img/9_large.webp',
  '/img/9_medium.webp',
  '/img/9_small.webp',
  '/img/10_large.webp',
  '/img/10_medium.webp',
  '/img/10_small.webp',
];

// TODO: check if it is possible to cache Google Maps resource (not working adding this link to FILES_TO_CACHE)
// 'https://maps.googleapis.com/maps/api/js?key=AIzaSyA_tKbW6A5pQ-eupxI56myUnHLqYCzOjKo&libraries=places&callback=initMap',

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(FILES_TO_CACHE);
      })
      .catch((e) => {
        console.error('Error caching resources: ', e);
      })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map(key => {
          if (key != CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.match(event.request) 
          .then((response) => {
            return response || fetch(event.request);
          })
          .catch(e => console.error('Error in fetch handler: ', e));
      })
  );
});


