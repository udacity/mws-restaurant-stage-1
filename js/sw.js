var jsFolder = 'js';
var staticCacheName = 'restaurant-reviews-v1';
var contentImgsCache = 'restaurant-reviews-imgs';
var allCaches = [
  staticCacheName,
  contentImgsCache
];

self.addEventListener('install', function(event) {
    event.waitUntil(
      caches.open(staticCacheName).then(function(cache) {
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

  self.addEventListener('message', function(event) {
    if (event.data.action === 'skipWaiting') {
      self.skipWaiting();
    }
  });

  self.addEventListener('fetch', function(event) {
    var requestUrl = new URL(event.request.url);
    
    console.log(requestUrl);
    // if (requestUrl.origin === location.origin) {
    //   if (requestUrl.pathname === '/') {
    //     event.respondWith(caches.match('/skeleton'));
    //     return;
    //   }
    //   if (requestUrl.pathname.startsWith('/photos/')) {
    //     event.respondWith(servePhoto(event.request));
    //     return;
    //   }
    //   // TODO: respond to avatar urls by responding with
    //   // the return value of serveAvatar(event.request)
    //   if (requestUrl.pathname.startsWith('/avatars/')) {
    //     event.respondWith(serveAvatar(event.request));
    //     return;
    //   }
    // }
});