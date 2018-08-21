let CACHE_NAME = "restaurant-cache-v1";

let filesToCache = [
    "./",
    "./index.html",
    "./restaurant.html",
    "./js/main.js",
    "./js/restaurant_info.js",
    "./js/dbhelper.js",
    "./data/restaurants.json",
    "./css/styles.css",
    "https://unpkg.com/leaflet@1.3.1/dist/leaflet.css",
    "https://unpkg.com/leaflet@1.3.1/dist/leaflet.js",
    "./img/1.jpg",
    "./img/2.jpg",
    "./img/3.jpg",
    "./img/4.jpg",
    "./img/5.jpg",
    "./img/6.jpg",
    "./img/7.jpg",
    "./img/8.jpg",
    "./img/9.jpg",
    "./img/10.jpg"
];

self.addEventListener("install", event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            console.log("Appshell caching started...");
            return cache.addAll(filesToCache);
        })
    );
});

self.addEventListener("activate", event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames
                    .filter(cacheName => {
                        return (
                            cacheName.startsWith("restaurant-cache-") &&
                            cacheName != CACHE_NAME
                        );
                    })
                    .map(cacheName => {
                        return caches.delete(cacheName);
                    })
            );
        })
    );
});

self.addEventListener("fetch", event => {
    event.respondWith(
        caches.match(event.request).then(response => {
            return response || fetch(event.request);
        })
    );
});
