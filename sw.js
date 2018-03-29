var staticCacheName = 'restaurantReview-static-v3';
var contentImgsCache = 'restaurantReview-content-imgs';
var allCaches = [staticCacheName, contentImgsCache];
var urlsToCache =  [
  '/',
  '/restaurant.html',
  '/css/styles.css',
  '/js/main.js',
  '/js/dbhelper.js',
  '/js/restaurant_info.js'
  ]  ;

self.addEventListener('install', function(event) {
  // Perform install steps
  event.waitUntil(
    caches.open(staticCacheName)
      .then(function(cache) {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});
self.addEventListener('fetch', function(event) {
  var requestUrl = new URL(event.request.url);

              if (requestUrl.pathname.startsWith('/images/')) {
                event.respondWith(serveImg(event.request));
                return;
              }
  
    event.respondWith(
      caches.match(event.request)
        .then(function(response) {
          // Cache hit - return response
          if (response) {
            return response;
          }
  
          // IMPORTANT: Clone the request. A request is a stream and
          // can only be consumed once. Since we are consuming this
          // once by cache and once by the browser for fetch, we need
          // to clone the response.
          var fetchRequest = event.request.clone();
  
          return fetch(fetchRequest).then(
            function(response) {
              // Check if we received a valid response
              if(!response || response.status !== 200 || response.type !== 'basic') {
                return response;
              }
  
              // IMPORTANT: Clone the response. A response is a stream
              // and because we want the browser to consume the response
              // as well as the cache consuming the response, we need
              // to clone it so we have two streams.
              var responseToCache = response.clone();
  
              caches.open(staticCacheName)
                .then(function(cache) {
                  cache.put(event.request, responseToCache);
                });
  
              return response;
            }
          );
        })
      );

  });

  function serveImg(request) {
    var storageUrl = request.url.replace(/-\d+px\.jpg$/, '');

    return caches.open(contentImgsCache).then(function(cache) {
        return cache.match(storageUrl).then(function(response) {
            if (response)
                return response;

            return fetch(request).then(function(networkResponse) {
                cache.put(storageUrl, networkResponse.clone());
                return networkResponse;
            });
        });
    });
}

  self.addEventListener('activate', function(event) {
    event.waitUntil(caches.keys().then(function(cacheNames) {
        return Promise.all(cacheNames.filter(function(cacheName) {
            return cacheName.startsWith('restaurantReview-') && !allCaches.includes(cacheName);
        }).map(function(cacheName) {
            return caches['delete'](cacheName);
        }));
    }));
});
