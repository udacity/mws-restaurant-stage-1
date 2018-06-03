const SW_CONSOLE_PREFIX = '>> SW >>';
var staticCacheName = 'mws-restaurant-v1';
var contentImgsCache = 'mws-restaurant-imgs';
var allCaches = [staticCacheName, contentImgsCache];

self.addEventListener('install', function(event) {
  console.log(SW_CONSOLE_PREFIX, '[event.install] Called');

  event.waitUntil(
    caches.open(staticCacheName).then(function(cache) {
      return cache.addAll([
        '/',
        'index.html',
        'restaurant.html',
        'css/styles.css',
        'data/restaurants.json',
        'js/main.js',
        'js/dbhelper.js',
        'js/restaurant_info.js',
        'https://fonts.gstatic.com/s/roboto/v18/KFOmCnqEu92Fr1Mu4mxK.woff2'
      ]);
    })
  );
});

self.addEventListener('activate', function(event) {
  console.log(SW_CONSOLE_PREFIX, '[event.activate] Called');

  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames
          .filter(function(cacheName) {
            return (
              cacheName.startsWith('mws-') && !allCaches.includes(cacheName)
            );
          })
          .map(function(cacheName) {
            return caches.delete(cacheName);
          })
      );
    })
  );
});

self.addEventListener('fetch', function(event) {
  const requestUrl = new URL(event.request.url);

  if (requestUrl.origin === location.origin) {
    if (requestUrl.pathname.startsWith('/restaurant.html')) {
      event.respondWith(caches.match('/restaurant.html'));
      return;
    }

    if (requestUrl.pathname.startsWith('/img/')) {
      event.respondWith(servePhoto(event.request));
      return;
    }
  }

  event.respondWith(
    caches.match(event.request).then(function(response) {
      return response || fetch(event.request);
    })
  );
});

function servePhoto(request) {
  var storageUrl = request.url.replace(/\.jpg$/, '');

  return caches.open(contentImgsCache).then(function(cache) {
    return cache.match(storageUrl).then(function(response) {
      if (response) return response;

      return fetch(request).then(function(networkResponse) {
        cache.put(storageUrl, networkResponse.clone());
        return networkResponse;
      });
    });
  });
}
