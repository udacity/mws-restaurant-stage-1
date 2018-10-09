const VERSION = '<<-!version->>';
const staticCacheName  = `reviews-app--static-${VERSION}`;
const mapCacheName = `reviews-app--mapAPI-${VERSION}`;
const allCaches = [
  staticCacheName,
  mapCacheName
];

/**
 * this allows the website to work in
 * both github pages and local env
 */
const BASE_URL = (() => {
  if(location.origin.includes('localhost:')){
    return location.origin;
  }
  return `${location.origin}/mws-restaurant-stage-1`;
})();

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(staticCacheName).then( cache => {
      return cache.addAll([
        './',
        './index.html',
        './restaurant.html',
        './build/data/restaurants.json',
        './build/css/styles.css',
        './build/js/dbhelper.js',
        './build/js/main.js',
        './build/js/restaurant_info.js',
        /* will work as replacement to images */
        './offline.png',
        /* Caching map assets */
        'https://unpkg.com/leaflet@1.3.1/dist/leaflet.css',
        'https://unpkg.com/leaflet@1.3.1/dist/leaflet.js',
        'https://unpkg.com/leaflet@1.3.1/dist/images/marker-icon.png',
        /* Cashing font face */
        'https://fonts.googleapis.com/css?family=Lato:400,700'
      ]);
    })
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then( (keyList) => {
      return Promise.all(
        keyList.filter( (key) => {
          return key.startsWith('reviews-app--') &&
            !allCaches.includes(key);
        }).map( (key) => {
          return caches.delete(key);
        })
      );
    })
  );
  return self.clients.claim();
});

/*
  - If request if for an inside page respond with '/restaurant.html'
  - If it's a MAP API asset request:
    - if there is internet access:
     * fetch new data from the network.
     * update cache with new data.
    - else:
      * match the cache for a similar request and respond with it
  - else:
    match other requests
    - if request for an image respond with offline.png image

NOTE: the offline image was inspired by james priest's
https://james-priest.github.io/mws-restaurant-stage-1/stage1.html

NOTE: overall handling of the service worker is self implemented due
to extra learning from this article by Jake Archibald
https://jakearchibald.com/2014/offline-cookbook/
*/
self.addEventListener('fetch', event => {
  const mapAPIBaseUrl = 'https://api.tiles.mapbox.com/v4/';
  const insideBaseUrl = `${BASE_URL}/restaurant.html?id=`;

  if(event.request.url.includes(insideBaseUrl)){
    event.respondWith(caches.match('./restaurant.html'));
    return;

  } else if (event.request.url.includes(mapAPIBaseUrl)) {

    event.respondWith(fetchAndCacheThenRespond(event.request, mapCacheName));
    return;

  } else {
    event.respondWith(
      caches.match(event.request).then(res => {
        return res || fetch(event.request);
      }).catch( () => {
        if (event.request.url.includes('.jpg')) {
          /* If no cache match for the image,
            return offline image */
          return caches.match('./offline.png');
        }
      })
    );
  }
});


/**
 * checks if online, fetch data from network,
 * updates cache and repond with data
 * if offline responds with cached data
 * @param {Object} request - The Request the browser intends to make
 * @param {string} cacheName - Cache name to cache data in
 * @returns {Object.<Response>} response object for the given request
 */
function fetchAndCacheThenRespond(request, cacheName) {
  /* Trying to fetch from network */
  return caches.open(cacheName).then( cache => {
    return cache.match(request).then( response => {
      /* fetching resources from network */
      const fetchPromise = fetch(request).then( networkResponse => {
        console.log(networkResponse.clone());
        cache.put(request, networkResponse.clone());
        return networkResponse;
      });
      /* retrun network response if it exists
        else return cached response */
      return fetchPromise || response;
    });
  });
}
