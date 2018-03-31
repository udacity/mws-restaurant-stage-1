const CACHE = `mws-restaurant-v3`;

self.addEventListener('fetch', function (event) {
    console.log(event.request);

    //From https://developers.google.com/web/ilt/pwa/caching-files-with-service-worker
    event.respondWith(
        caches.match(event.request).then(function(response) {
            //if(response) return response;
            //return response || fetch(event.request);
            console.log("Petición", event.request);
            if(response) return response;
            console.log("No encontrada");
            
            
            return caches.open(CACHE).then(function(cache) {
                return fetch(event.request).then(function(response) {
                    if (event.request.startsWith(self.location.origin))
                        cache.put(event.request, response.clone());
                    return response;
                  });
            });

            // return response || fetch(event.request).then(function(response) {
            //     cache.put(event.request, response.clone());
            //     return response;
            //   });
        })
    );
});

self.addEventListener('install', function (event) {
    event.waitUntil(
        caches.open(CACHE).then(function (cache) {
            return cache.addAll([
                '/',
                '/index.html',
                '/restaurant.html',
                "/js/app.js",
                "/js/dbhelper.js",
                "/js/main.js",
                "/js/restaurant_info.js",
                "/data/restaurants.json",
                "/css/styles.css",
                "/css/responsive.css",
                "/images/"
            ]);
        })
    );
});

self.addEventListener("activate", function (event) {
    event.waitUntil(
      caches.keys().then(cacheNames => {
          return Promise.all(
              cacheNames
                .filter(cacheName => cacheName.startsWith('mws-restaurant') && cacheName != CACHE)
                .map(cacheName => cache.delete(cacheName))
            );
        })
    );
});