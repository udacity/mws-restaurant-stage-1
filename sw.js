const staticCacheName = 'mws-restaurant-v1';
/**
 * Install service worker and cache assets
 */
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(staticCacheName)
     .then( cache => {
      return cache.addAll([
        'index.html',
        'restaurant.html',
        'js/main.js',
        'js/restaurant_info.js',
        'js/dbhelper.js',
        'css/styles.css',
        'css/responsive.css',
        'data/restaurants.json',
        'img/1-400.jpg',
        'img/1-800.jpg',
        'img/2-400.jpg',
        'img/2-800.jpg',
        'img/3-400.jpg',
        'img/3-800.jpg',
        'img/4-400.jpg',
        'img/4-800.jpg',
        'img/5-400.jpg',
        'img/5-800.jpg',
        'img/6-400.jpg',
        'img/6-800.jpg',
        'img/7-400.jpg',
        'img/7-800.jpg',
        'img/8-400.jpg',
        'img/8-800.jpg',
        'img/9-400.jpg',
        'img/9-800.jpg',
        'img/10-400.jpg',
        'img/10-800.jpg',
      ])
      .then(() => self.skipWaiting());
    })
  );
});

/*
 * activate service worker, get latest cache and delete old ones
 */
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then( cacheNames => {
      return Promise.all(
        cacheNames.filter( cacheName => {
          return cacheName.startsWith('mws-restaurant-') &&
                 cacheName !== staticCacheName;
        }).map( cacheName => {
          return caches.delete(cacheName);
        })
      );
    })
  );
});

/**
 * Intercept requests and fetch them from cache first with network fallback
 */
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        return response || fetch(event.request);
      })
  );
});