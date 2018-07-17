self.addEventListener("install", function(event) {
  var urlsToCache = [
    "../",
    "../css/styles.css",
    "../js/main.js",
    "../js/restaurant_info.js",
    "../img/1.jpg",
    "../img/2.jpg",
    "../img/3.jpg",
    "../img/4.jpg",
    "../img/5.jpg",
    "../img/6.jpg",
    "../img/7.jpg",
    "../img/8.jpg",
    "../img/9.jpg",
    "../img/10.jpg"
  ];
  event.waitUntil(
    caches.open("restaurant-review-v1").then(function(cache) {
      cache.addAll(urlsToCache);
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
// self.addEventListener("activate", function(event) {
//   event.waitUntil(caches.delete("restaurant-review-v1"));
//   console.log("Old cache cleared");
// });
