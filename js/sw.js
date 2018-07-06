var cacheID = "mws-001";

self.addEventListener("install", event => {
    event.waitUntil(
        caches.open(cacheID)
        .then(cache => {
            return cache
                .addAll([
                    "/",
                    "/index.html",
                    "/restaurant.html",
                    "/css/styles.css",
                    "/js/dbhelper.js",
                    "/js/main.js",
                    "/js/register.js",
                    "/js/restaurant_info.js",
                    "/js/sw.js"
                ])
                .catch(error => {
                    console.log("Failed to open cache" + error);
                });
        })
    );
});

