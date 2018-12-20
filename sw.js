const version = "1";
const CACHE_NAME = `mws-restaurant-stage-${version}`;
const urlsToCache = [
  "/",
  "/index.html",
  "/restaurant.html",
  "/css/styles.css",
  "/js/dbhelper.js",
  "/js/main.js",
  "/js/restaurant_info.js",
  "/js/indexController.js",
  "/data/restaurants.json",
  "/img/1.jpg",
  "/img/2.jpg",
  "/img/3.jpg",
  "/img/4.jpg",
  "/img/5.jpg",
  "/img/6.jpg",
  "/img/7.jpg",
  "/img/8.jpg",
  "/img/9.jpg",
  "/img/10.jpg"
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
