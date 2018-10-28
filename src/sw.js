/**
 * Credits:
 * This application uses Open Source components and is modified from original. 
 * You can find the source code of their open source projects along with license information below. 
 * I acknowledge and grateful to this developer for their contributions to open source.
 * https://googlechrome.github.io/samples/service-worker/basic/
 * 
 * http://www.apache.org/licenses/LICENSE-2.0
 */

 const cacheName = 'v15';
 //const RUNTIME = 'runtime';

// A list of local resources we always want to be cached.
const PRECACHE_URLS = [
  '/',
  '/restaurant.html',
  '/css/styles.css',
  '/js/main.js',
  '/js/restaurant_info.js',
  '/manifest.json',
  'img/icons/icon-72x72.png',
  'img/icons/icon-96x96.png',
  'img/icons/icon-128x128.png',
  'img/icons/icon-144x144.png',
  'img/icons/icon-152x152.png',
  'img/icons/icon-192x192.png',
  'img/icons/icon-384x384.png',
  'img/icons/icon-512x512.png'
];

/**
 * Install Service Worker, cache static content
 */
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(cacheName + 'restaurantReviews')
      .then(cache => cache.addAll(PRECACHE_URLS))
      .then(self.skipWaiting())
  );
})

/**
 * Activate new Service Worker, Clean old caches
 */
self.addEventListener('activate', event => {
  console.log('Service Worker activation in progress.');

  event.waitUntil(
    caches.keys()
      .then(keys => {
        return Promise.all(
          keys.filter(key => {
              return !key.startsWith(cacheName);
            })
            .map(key => {
              return caches.delete(key);
            })
        );
      })
      .then(function() {
        console.log('Service Worker activation completed.');
      })
  );
});

/**
 * Fetch cache event
 */
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(function(response) {
      return response || fetch(event.request);
    })
  );
})