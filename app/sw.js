/* eslint-env worker */
const currentCacheName = 'restaurant-sw-cache-v25';

/* === getting service worker ready with cache === */
self.addEventListener('install', (event) => {
  const cachedUrls = [
    '/',
    '/js/dbhelper.js',
    '/js/main.js',
    '/img/na.png',
    '/js/restaurant_info.js',
    '/js/idb.js',
    '/index.html',
    '/restaurant.html',
    '/css/styles.css'
  ];
  event.waitUntil(
    caches.open(currentCacheName).then((cache) => {
      cache.addAll(cachedUrls);
    })
  );
});

/* ===== Activate event To delete old version caches ===== */
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.filter((cacheName) => {
          return cacheName.startsWith('restaurant-') &&
                 cacheName != currentCacheName;
        }).map((cacheName) => {
          return caches.delete(cacheName);
        })
      );
    })
  );
});

/* === Fetching cached content ==== */
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.open(currentCacheName).then(cache => {
          return fetch(event.request).then(response => {
            if (event.request.method !== 'GET') {
              return response;
            }
            cache.put(event.request, response.clone());
            return response;
          }); 
    }).catch(() => {
          return caches.match(event.request);
          if (event.request.url.indexOf('.webp') > -1) {
            return caches.match('/img/na.png');
          }
          return new Response (
            'Application is not connected', {
              status: 404,
              statusText: 'Application is not connected to the internet'
            }
          );
        })
  );
}); 
