/**
* @description Set a name for the current cache and Default files to always cache
*
*/
const cacheName = 'v1';
const cacheFiles = [
  '/',
  'index.html',
  'restaurant.html',
  './js/indexController.js',
  './js/main.js',
  './js/restaurant_info.js',
  './css/styles.css',
  './data/restaurants.json',
  './img/',
  'manifest.json',
  'icon.png'
];

/**
* @description Delays the event until the Promise is resolved, 
* open the cache and add all the default files to the cache.
* @param {string} install - Install event
* @param {string} function
*/
self.addEventListener('install', event => {
    console.log('[ServiceWorker] Installed');
    event.waitUntil(
      caches.open(cacheName).then(cache => {
      console.log('[ServiceWorker] Caching cacheFiles');
      return cache.addAll(cacheFiles);
      })
  ); 
});

/**
* @description Delete the cached previous file if a new version of the cache is available:
* Get all the cache keys (cacheName), If a cached item is saved under a previous cacheName, 
* delete that cached file
* @param {string} install - Activate event
* @param {string} function
*/
self.addEventListener('activate', event => {
  console.log('[ServiceWorker] Activated');

  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(cacheNames.map(thisCacheName => {
        if (thisCacheName !== cacheName) {
          console.log('[ServiceWorker] Removing Cached Files from Cache - ', thisCacheName);
          return caches.delete(thisCacheName);
        }
      }));
    })
  );
});


/**
* @description Answers to the event request :
* Open the cache name, if the cache matches with the response, send the response directly.
* Otherwise, check to the network and put the clone of the answer to the cache before answering
* @param {string} fetch - Fetch event
* @param {string} function
*/
self.addEventListener('fetch', event => {
  console.log('[ServiceWorker] Fetch event now', event.request.url);

  event.respondWith(
    caches.open(cacheName).then(cache => {
      return cache.match(event.request).then(response => {
        console.log("[ServiceWorker] Found in Cache", event.request.url, response);
        return response || fetch(event.request).then(response => {
          console.log('[ServiceWorker] not Found in Cache, need to search in the network', event.request.url);
          cache.put(event.request, response.clone());
          console.log('[ServiceWorker] New Data Cached', event.request.url);
          return response;
        });
      });
    })
  );
});