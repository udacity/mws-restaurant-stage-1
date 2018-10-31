/**
 * Credits:
 * This application uses Open Source components and is modified from original. 
 * You can find the source code of their open source projects along with license information below. 
 * I acknowledge and grateful to this developer for their contributions to open source.
 * https://googlechrome.github.io/samples/service-worker/basic/
 * 
 * http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Stage-2 Credits:
 * This application/stage uses MWS Restaurant Reviews Project, A Walkthrough by
 * Alexandro Perez; as a reference and guide. The 'Fetch' method in
 * Perez's Service Worker file was used, although slightly modified from his original.
 * I acknowledge and grateful to this developer for his contribution to providing a guide to
 * follow for the more difficult sections.
 * https://alexandroperez.github.io/mws-walkthrough/ 
 */

 const cacheName = 'v10';

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
  'img/icons/icon-512x512.png',
  'https://unpkg.com/leaflet@1.3.1/dist/leaflet.js',
  'https://unpkg.com/leaflet@1.3.1/dist/leaflet.css'
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
 * Service Worker Fetch cache event
 */
self.addEventListener('fetch', event => {
  const requestUrl = new URL(event.request.url);

  // only highjack request made to our app (not mapbox maps or leaflet, for example)
  if (requestUrl.origin === location.origin) {

    // Since requests made to restaurant.html have search params (like ?id=1), the url can't be used as the
    // key to access the cache, so just respondWith restaurant.html if pathname startsWith '/restaurant.html'
    if (requestUrl.pathname.startsWith('/restaurant.html')) {
      event.respondWith(caches.match('/restaurant.html'));
    return; 
    }

    // If the request pathname starts with /img, then we need to handle images.
    if (requestUrl.pathname.startsWith('/img')) {
      event.respondWith(serveImage(event.request));
    return; 
    }
  }

  // Default behavior: respond with cached elements, if any, falling back to network.
  event.respondWith(
    caches.match(event.request).then(function(response) {
      return response || fetch(event.request);
    })
  );
});

function serveImage(request) {
  let imageStorageUrl = request.url;

  // Make a new URL with a stripped suffix and extension from the request url
  // i.e. /img/1-medium.jpg  will become  /img/1
  // we'll use this as the KEY for storing image into cache
  imageStorageUrl = imageStorageUrl.replace(/\.\w{4}|\.\w{4}|\.\w{4}/i, '');

  return caches.open(cacheName + 'images').then(function(cache) {
    return cache.match(imageStorageUrl).then(function(response) {
      // if image is in cache, return it, else fetch from network, cache a clone, then return network response
      return response || fetch(request).then(function(networkResponse) {
        cache.put(imageStorageUrl, networkResponse.clone());
        return networkResponse;
      });
    });
  });
}