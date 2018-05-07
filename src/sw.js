var staticCacheName = 'yelplight-v0.4';
var contentImgsCache = 'yelplight-content-imgs';
var allCaches = [
    staticCacheName,
    contentImgsCache
];

self.addEventListener('install', function (e) {
    e.waitUntil(
        caches.open(staticCacheName).then(function (cache) {
            return cache.addAll([ // takes an array fetches all and puts the request-response pairs into the cache (is atomic)
                '/',
                'index.html',
                'restaurant.html',
                'css/styles.css',
                'js/dbhelper.js',
                'js/main.js',
                'js/restaurant_info.js'
            ]);
        })
    );
});

self.addEventListener('activate', function (event) { // Delete old cache versions
    event.waitUntil(
        caches.keys().then(function (cacheNames) {
            return Promise.all(
                cacheNames.filter(function (cacheName) {
                    return cacheName.startsWith('yelplight-') &&
                        !allCaches.includes(cacheName);
                }).map(function (cacheName) {
                    return caches.delete(cacheName);
                })
            );
        })
    );
});

self.addEventListener('fetch', function (event) {
    // console.log(event.request.url);
    console.log(event);
    var requestUrl = new URL(event.request.url);

    if (requestUrl.origin === location.origin) {
      if (requestUrl.pathname === '/') {
        event.respondWith(
            caches.match('index.html') // searches in all caches for the request
        );
        return;
      }
    }

    event.respondWith(
        caches.match(event.request).then(function (response) {
            return response || fetch(event.request);
        })
    );
});