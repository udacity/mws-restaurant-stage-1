let cacheName = "restaurant-cache-v1";

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
    "https://unpkg.com/leaflet@1.3.1/dist/leaflet.js"
];

self.addEventListener("install", event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            console.log("Appshell caching started...");
            return cache.addAll(filesToCache);
        })
    );
});

/*
* check for a response for request in cache
* otherwise request resource over network and cache response
*/
self.addEventListener("fetch", event => {
    let requestUrl = new URL(event.request.url);
    console.log(requestUrl);
    if (requestUrl.protocol.startsWith("https")) {
        event.respondWith(
            caches.open(cacheName).then(cache => {
                return cache
                    .match(e.request, { ignoreSearch: true })
                    .then(response => {
                        if (response) {
                            return response;
                        }

                        return fetch(e.request).then(networkResponse => {
                            cache.put(e.request, networkResponse.clone());
                            return networkResponse;
                        });
                    });
            })
        );
    }
});
