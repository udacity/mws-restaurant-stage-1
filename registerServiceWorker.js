const v1 = 'v1';

const assets = [
  '/',
  '/index.html',
  '/restaurant.html',
  '/js/dbhelper.js',
  '/js/main.js',
  '/js/restaurant_info.js',
  '/dist/css/styles.css',
  '/img/1.jpg',
  '/img/2.jpg',
  '/img/3.jpg',
  '/img/4.jpg',
  '/img/5.jpg',
  '/img/6.jpg',
  '/img/7.jpg',
  '/img/8.jpg',
  '/img/9.jpg',
  '/img/10.jpg',
  'https://unpkg.com/leaflet@1.3.1/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.3.1/dist/leaflet.js',
  'http://localhost:5050/restaurants',
];

(function() {
  // Registering the service worker
  self.addEventListener('install', (event) => {
    console.log('Service worker: installed');

    event.waitUntil(
      caches
        .open(v1)
        .then((cache) => {
          console.log('Service worker: Caching files');
          cache.addAll(assets);
        })
        .then(() => self.skipWaiting()),
    );
  });

  // Activating the service worker
  self.addEventListener('activate', (event) => {
    console.log('Service worker: activated');
    //Remove unwanted cache
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cache) => {
            if (cache !== v1) {
              console.log('Service worker: Deleting Old Cache');
              return caches.delete(cache);
            }
          }),
        );
      }),
    );
  });

  // Fetching the cache
  self.addEventListener('fetch', (event) => {
    console.log('Service worker: Fetching');
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request)),
    );
  });
})();
