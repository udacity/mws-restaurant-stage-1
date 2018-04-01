var jsFolder = 'dist';
var staticCache = 'restaurant-reviews-v1';
var imagesCache = 'restaurant-reviews-imgs-v1';
var jsonDataCache = 'restaurant-data-v1';
var restaurantsCache = 'restaurants-v1';
var allCaches = [
  staticCache,
  imagesCache,
  jsonDataCache,
  restaurantsCache
];

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(staticCache).then(function (cache) {
      return cache.addAll([
        '/index.html',
        '/restaurant.html',
        `/${jsFolder}/main.js`,
        `/${jsFolder}/dbhelper.js`,
        `/${jsFolder}/restaurant_info.js`,
        '/css/styles-restaurant.css',
        '/css/styles.css'
      ]);
    })
  );
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (cacheNames) {
      return Promise.all(
        cacheNames.filter(function (cacheName) {
          return cacheName.startsWith('restaurant-') &&
            !allCaches.includes(cacheName);
        }).map(function (cacheName) {
          return caches.delete(cacheName);
        })
      );
    })
  );
});

self.addEventListener('message', function (event) {
  if (event.data.action === 'skipWaiting') {
    self.skipWaiting();
  }
});

self.addEventListener('fetch', function (event) {
  var requestUrl = new URL(event.request.url);

  if (requestUrl.origin !== location.origin || requestUrl.pathname.indexOf('sw.js') !== -1) {
    return;
  }
  if (requestUrl.pathname === '/') {
    event.respondWith(serveContent(event.request, '/index.html', staticCache));
  }

  if (requestUrl.pathname.startsWith('/css')) {
    event.respondWith(serveStaticContent(event.request));
    return;
  }

  if (requestUrl.pathname.startsWith(`/${jsFolder}`)) {
    event.respondWith(serveStaticContent(event.request));
    return;
  }

  if (requestUrl.pathname.startsWith('/img/')) {
    event.respondWith(serveImage(event.request));
    return;
  }

  if (requestUrl.pathname.endsWith('.json')) {
    event.respondWith(serveData(event.request));
    return;
  }

  if (requestUrl.pathname.startsWith('/restaurant.html')) {
    event.respondWith(serveRestaurantContent(event.request));
    return;
  }

  console.log(requestUrl);
});

function serveStaticContent(request) {
  var url = request.url;

  return serveContent(request, url, staticCache);
}

function serveImage(request) {
  var storageUrl = request.url.replace(/-\d+px\.jpg$/, '');

  return serveContent(request, storageUrl, imagesCache);
}

function serveData(request) {
  var url = request.url;

  return serveContent(request, url, jsonDataCache);
}

function serveRestaurantContent(request) {
  var url = request.url;

  return serveContent(request, url, restaurantsCache);
}

function serveContent(request, cacheKey, cache){
  return caches.open(cache).then(function (cache) {
    return cache.match(cacheKey).then(function (response) {
      if (response)
        return response;

      return fetch(request).then(function (networkResponse) {
        cache.put(cacheKey, networkResponse.clone());
        return networkResponse;
      });
    });
  });
}