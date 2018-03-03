let cacheName = 'mws-restaurant-stage-1-cache-v6';
const filesToChache = [
  '/',
  '/index.html',
  '/restaurant.html',
  '/js/dbhelper.js',
  '/js/main.js',
  '/js/restaurant_info.js',
  '/css/styles.css',
  '/data/restaurants.json',
  '/img/1_large.jpg',
  '/img/1_medium.jpg',
  '/img/1_small.jpg',
  '/img/2_large.jpg',
  '/img/2_medium.jpg',
  '/img/2_small.jpg',
  '/img/3_large.jpg',
  '/img/3_medium.jpg',
  '/img/3_small.jpg',
  '/img/4_large.jpg',
  '/img/4_medium.jpg',
  '/img/4_small.jpg',
  '/img/5_large.jpg', 
  '/img/5_medium.jpg',
  '/img/5_small.jpg',
  '/img/6_large.jpg',
  '/img/6_medium.jpg',
  '/img/6_small.jpg',
  '/img/7_large.jpg',
  '/img/7_medium.jpg',
  '/img/7_small.jpg',
  '/img/8_large.jpg',
  '/img/8_medium.jpg',
  '/img/8_small.jpg',
  '/img/9_large.jpg',
  '/img/9_medium.jpg',
  '/img/9_small.jpg',
  '/img/10_large.jpg',
  '/img/10_medium.jpg',
  '/img/10_small.jpg',
];

// TODO: check if it is possible to cache Google Maps resource (not working adding this link to filesToChache)
// 'https://maps.googleapis.com/maps/api/js?key=AIzaSyA_tKbW6A5pQ-eupxI56myUnHLqYCzOjKo&libraries=places&callback=initMap',

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(cacheName)
      .then((cache) => {
        return cache.addAll(filesToChache);
      })
      .catch((e) => {
        console.error('Error caching resources: ', e);
      })
  );
});

self.addEventListener('fetch', (event) => {
  return event.respondWith(
    caches.open(cacheName)
      .then((cache) => {
        return cache.match(event.request) 
          .then((response) => {
            return (response) || fetch(event.request);
          })
          .catch(e => console.error('Error in fetch handler: ', e));
      })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map(key => {
          if (key != cacheName) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// updateCacheNumber = () => {
//   cacheName = cacheName.replace(/-v(\d+)$/g, (match, p1, offset, string) => {
//     return `-v${parseInt(p1) + 1}.`;
//   });
//   console.log('new cacheName = ', cacheName);
// }

