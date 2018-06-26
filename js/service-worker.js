let staticCache = 'restaurant-static';
let imagesCache = 'restaurant-images';
let allCaches = [
  staticCache,
  imagesCache
];

self.addEventListener('install', function(event) {
  event.waitUntil(
      caches.open(staticCache).then(function(cache) {
        return cache.addAll([
          '/skeleton',
          'index.html*',
          'restaurant.html',
          'js/main.js',
          'js/dbhelper.js',
          'js/restaurant_info.js',
          'js/service-worker.js',
          'css/styles.css',
          'css/normalize.css',
          'css/font-awesome.css'
        ]);
      })
  );
});

self.addEventListener('activate', function(event) {
  event.waitUntil(
      caches.keys().then(function(cacheNames) {
        return Promise.all(
            cacheNames.filter(function(cacheName) {
              return cacheName.startsWith('restaurant-') &&
                  !allCaches.includes(cacheName);
            }).map(function(cacheName) {
              return caches.delete(cacheName);
            })
        );
      })
  );
});

self.addEventListener('fetch', function(event) {
  var requestUrl = new URL(event.request.url);

  if (requestUrl.origin === location.origin) {
    if (requestUrl.pathname === '/') {
      event.respondWith(caches.match('/skeleton'));
      return;
    }
    if (requestUrl.pathname.startsWith('/img/')) {
      event.respondWith(serveImg(event.request));
      return;
    }
  }

  event.respondWith(
      caches.match(event.request).then(function(response) {
        return response || fetch(event.request);
      })
  );
});


function serveImg(request) {
  let storageUrl = request.url.replace(/-\d+px\.jpg$/, '');

  return caches.open(imagesCache).then(function(cache) {
    return cache.match(storageUrl).then(function(response) {
      if (response) return response;

      return fetch(request).then(function(networkResponse) {
        cache.put(storageUrl, networkResponse.clone());
        return networkResponse;
      });
    });
  });
}

self.addEventListener('message', function(event) {
  if (event.data.action === 'skipWaiting') {
    self.skipWaiting();
  }
});
