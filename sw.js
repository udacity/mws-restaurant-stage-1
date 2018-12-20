const version = "2";
const CACHE_NAME = `mws-restaurant-stage-${version}`;
const urlsToCache = [
  "/mws-restaurant-stage-1/",
  "/mws-restaurant-stage-1/index.html",
  "/mws-restaurant-stage-1/restaurant.html",
  "/mws-restaurant-stage-1/css/styles.css",
  "/mws-restaurant-stage-1/js/dbhelper.js",
  "/mws-restaurant-stage-1/js/main.js",
  "/mws-restaurant-stage-1/js/restaurant_info.js",
  "/mws-restaurant-stage-1/js/indexController.js",
  "/mws-restaurant-stage-1/data/restaurants.json",
  "/mws-restaurant-stage-1/img/1.jpg",
  "/mws-restaurant-stage-1/img/2.jpg",
  "/mws-restaurant-stage-1/img/3.jpg",
  "/mws-restaurant-stage-1/img/4.jpg",
  "/mws-restaurant-stage-1/img/5.jpg",
  "/mws-restaurant-stage-1/img/6.jpg",
  "/mws-restaurant-stage-1/img/7.jpg",
  "/mws-restaurant-stage-1/img/8.jpg",
  "/mws-restaurant-stage-1/img/9.jpg",
  "/mws-restaurant-stage-1/img/10.jpg"
];

self.addEventListener("install", event => {
  // Perform install steps
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log("Caching resources....");
      return cache.addAll(urlsToCache);
    })
  );
});

self.addEventListener("activate", event => {
  console.log("[ServiceWorker] Activate");
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(cacheName => {
            return (
              cacheName.startsWith("mws-restaurant-stage-") &&
              cacheName != staticCacheName
            );
          })
          .map(cacheName => {
            console.log(`[ServiceWorker] Removing old cache ${cacheName}`);
            return cache.delete(cacheName);
          })
      );
    })
  );
});

self.addEventListener("fetch", event => {
  console.log("[ServiceWorker] Fetch", event.request.url);
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});

// Update response to message event.
self.addEventListener("message", event => {
  if (event.data.action === "skipWaiting") {
    self.skipWaiting();
  }
});
