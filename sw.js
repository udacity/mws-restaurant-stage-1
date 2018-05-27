const staticCacheName = 'restaurant-review-v1'

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(staticCacheName)
      .then((cache) => {
        return cache.addAll([
          '/',
          '/js/main.js',
          '/js/dbhelper.js',
          '/js/restaurant_info.js',
          '/css/styles.css',
          '/data/restaurants.json',
          '/img'
        ]);
      })
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        Promise.all(
          cacheNames.filter((cacheName) => {
            return cacheName.startsWith('restaurant-') && cacheName !== staticCacheName;
          }).map((cacheName) => caches.delete(cacheName))
        )
      })
  );
});



self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request)
      .then((response) => {
        return response || fetch(e.request);
      })
  );
});

