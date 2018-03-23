const CACHE_VERSION = "restaurant_app_v10";

self.addEventListener("install", event => {
  const urlsToCache = [
    "/",
    "index.html",
    "restaurant.html",
    "js/main.js",
    "js/restaurant_info.js",
    "css/over640.css",
    "css/over1024.css",
    "css/styles.css",
    "data/restaurants.json",
    "https://necolas.github.io/normalize.css/8.0.0/normalize.css"
  ];

  event.waitUntil(
    caches
      .open(CACHE_VERSION)
      .then(cache => {
        console.log("cache all");
        return cache.addAll(urlsToCache);
      })
      .catch(() => {
        console.error("Cannot cache anything");
      })
  );
});

self.addEventListener("fetch", function(event) {
  event.respondWith(
    // Fetch the static assets
    caches.match(event.request).then(response => {
      if (response) {
        return response;
      } else {
        return fetch(event.request);
      }
    })
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    // Remove the old cache
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(name => {
            return name.startsWith("restaurant") && name != CACHE_VERSION;
          })
          .map(name => {
            return caches.delete(name);
          })
      );
    })
  );
});
