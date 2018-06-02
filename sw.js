const staticCacheName = 'restaurant-review-v1';
const urlsToCache = [
  '/',
  '/data/restaurants.json',
  '/css/styles.css',
  '/js/dbhelper.js',
  '/js/main.js',
  '/js/restaurant_info.js',
  '/sw.js'
];

function addToCache() {
  for(let i = 1; i <= 10; i++) {
    urlsToCache.push(`/restaurant.html?id=${i}`);
    urlsToCache.push(`/img/${i}-800.jpg`);
  }
}
addToCache();

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(staticCacheName)
      .then((cache) => {
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        return response || fetch(event.request);
      })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
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
