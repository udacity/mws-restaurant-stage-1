self.addEventListener("install", function(event) {
  const staticCacheName = "restaurant-review-v2";
  var urlsToCache = [
    "/index.html",
    "/manifest.json",
    "/css/styles.css",
    "/js/main.js",
    "/js/restaurant_info.js",
    "/img/1_1x.jpg",
    "/img/2_1x.jpg",
    "/img/3_1x.jpg",
    "/img/4_1x.jpg",
    "/img/5_1x.jpg",
    "/img/6_1x.jpg",
    "/img/7_1x.jpg",
    "/img/8_1x.jpg",
    "/img/9_1x.jpg",
    "/img/10_1x.jpg",
    "/img/1_2x.jpg",
    "/img/2_2x.jpg",
    "/img/3_2x.jpg",
    "/img/4_2x.jpg",
    "/img/5_2x.jpg",
    "/img/6_2x.jpg",
    "/img/7_2x.jpg",
    "/img/8_2x.jpg",
    "/img/9_2x.jpg",
    "/img/10_2x.jpg",
    "/img/undraw_tasting_de22.svg"
  ];
  event.waitUntil(
    caches.open(staticCacheName).then(function(cache) {
      return cache.addAll(urlsToCache);
      console.log("Cache is opened");
    })
  );
});

self.addEventListener("fetch", function(event) {
  // The following will respond with cache is there is one. If not, will fetch from network
  event.respondWith(
    caches.match(event.request).then(function(response) {
      if (response) {
        console.log("Found ", event.request.url, " in cache");
        return response;
      }
      return fetch(event.request);
      console.log("Cache matched");
    })
  );
});

/**
 * Removing old caches
 */
self.addEventListener("activate", function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      //All in promise so we wait until completion of all these promises
      return Promise.all(
        cacheNames
          .filter(function(cacheName) {
            //Filters a list of caches we don't need anymore and deletes them
            return (
              cacheName.startsWith("restaurant-review-") &&
              cacheName != staticCacheName
            );
          })
          .map(function(cacheName) {
            return caches.delete(cacheName);
            console.log("Old cache cleared");
          })
      );
    })
  );
});
