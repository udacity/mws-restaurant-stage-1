const currentCacheName = 'restaurant-sw-cache-v1';
 
/* === getting service worker ready with cache === */
self.addEventListener('install', (event) => {
  const cachedUrls = [
    '/',
    '/js/dbhelper.js',
    '/js/main.js',
    '/js/restaurant_info.js',
    '/index.html',
    '/restaurant.html',
    '/css/styles.css',
    '/data/restaurant.json'
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
      caches.match(event.request).then((response) => {
        return response || fetch(event.request).then((response) => {
            if (response.ok) {
              return caches.open(currentCacheName)
                .then((cache) => {
                  cache.put(event.request, response.clone());
                  return response;
                });
            } else {
              return response;
            }
          })
          .catch(() => {
            return caches.match('/index.html');
          });
      })
    );
  });