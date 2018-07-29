/* eslint-env worker */
const currentCacheName = 'restaurant-sw-cache-v7';

/* === getting service worker ready with cache === */
self.addEventListener('install', (event) => {
  const cachedUrls = [
    '/',
    '/js/dbhelper.js',
    '/js/main.js',
    '/img/na.png',
    '/js/restaurant_info.js',
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
    caches.match(event.request).then(response => {
      return ( response || fetch(event.request).then(fetchResponse => {
            return caches.open(currentCacheName)
              .then(cache => {
                cache.put(event.request, fetchResponse.clone());
                return fetchResponse;
              });
        }).catch(error => {
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
    })
  );
  }); 



   