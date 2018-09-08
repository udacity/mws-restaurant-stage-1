//set cache version
const cacheName = 'v2';

// service worker install
self.addEventListener('install', event => {
  console.log('Service Worker Installed!');
});

// service worker activate
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== cacheName) {
            return caches.delete(cache);
          }
        })
      );
    })
  );
});

// fetch event - clones all pages visited
self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request)
    .then(response => {
      const responseClone = response.clone();
      caches
        .open(cacheName)
        .then(cache => {
          cache.put(event.request, responseClone);
        });
      return response;
    })
    .catch(error => caches.match(event.request)
      .then(response => response))
  );
});