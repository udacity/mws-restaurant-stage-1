const STATIC_CACHE_NAME = 'mws-restaurant-static-v1';
const CONTENT_IMAGES_CACHE = 'mws-restaurant-content-images';

const ALL_CACHES = [
  STATIC_CACHE_NAME,
  CONTENT_IMAGES_CACHE
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME).then(cache => {
      return cache.addAll([
        '/',
        '/index.html',
        '/restaurant.html',
        'js/main.js',
        'js/dbhelper.js',
        'js/restaurant_info.js',
        'js/imgutils.js',
        'css/styles.css',
        'data/restaurants.json'
      ]);
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.filter(cacheName => {
          return cacheName.startsWith('mws-restaurant-') &&
            !ALL_CACHES.includes(cacheName);
        }).map(cacheName => caches.delete(cacheName))
      );
    })
  );
});

self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);

  if (requestUrl.pathname.startsWith('/img/')) {
    event.respondWith(serve(event.request, CONTENT_IMAGES_CACHE));
    return;
  }

  event.respondWith(
    caches.match(event.request).then((response) => response || fetch(event.request))
  );
});

function serve(request, cacheName) {
  return caches.open(cacheName).then((cache) => {
    return cache.match(request.url).then((response) => {
      if (response) {
        return response;
      }
      return fetch(request).then((networkResponse) => {
        cache.put(request.url, networkResponse.clone());
        return networkResponse;
      });
    });
  });
}