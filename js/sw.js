
const version= '1';
const restCacheName = "restaurant-v" + version;
const dynamicCacheName = "dyn-restaurant-v" + version;
const staticFiles = [
    "/",
    "index.html",
    "restaurant.html",
    "css/styles.css",
    "data/restaurants.json",
    "js/dbhelper.js",
    "js/restaurant_info.js",
];

self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(restCacheName).then((cache) => {
            return cache.addAll(staticFiles);
        })
    );
});

self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then ((cacheNames)=>{
      return Promise.all (
        cacheNames.filter((cacheName)=>{
          return cacheName != restCacheName;
        }).map(function (cacheName){
          return caches.delete(cacheName);
        })
      )
    })
  );
});

self.addEventListener('fetch', function(event) {
    event.respondWith(
      caches.match(event.request)
        .then(function(response) {
          if (response) {
            return response;
          }
          var fetchRequest = event.request.clone();
          return fetch(fetchRequest).then(
            function(response) {
              if(!response || response.status !== 200 || response.type !== 'basic') {
                return response;
              }

              var responseToCache = response.clone();
              caches.open(dynamicCacheName)
                .then(function(cache) {
                  cache.put(event.request, responseToCache);
                });

              return response;
            }
          );
        })
     );
  });
