const staticCache = "restaurant-static";

/**
 * Install event
 */
self.addEventListener("install", event => {
    console.info("install", event);
    event.waitUntil(
        caches.open(staticCache)
            .then(cache => cache.addAll([
                "/js/main.js",
                "/js/dbhelper.js",
                "/js/restaurant_info.js",
                "/css/styles.css",
                "/img/",
                "https://fonts.gstatic.com/s/roboto/v18/KFOmCnqEu92Fr1Mu4mxKKTU1Kg.woff2",
                "https://fonts.gstatic.com/s/roboto/v18/KFOlCnqEu92Fr1MmEU9fBBc4AMP6lQ.woff2"
            ]))
            .catch(error => console.error("Something happened", error))
    );
});

/**
 * Activate event
 */
self.addEventListener("activate", event => {
    console.info("activate", event);
    event.waitUntil(
        caches.keys()
            .then(cacheNames => {
                return Promise.all(
                    cacheNames.filter(cacheName => cacheName.startsWith("restaurant-") &&
                        !staticCache.includes(cacheName))
                        .map(cacheName => caches.delete(cacheName))
                );
            })
            .catch(error => console.error("Something happened", error))
    );
});

/**
 * Fetch from network event
 */
self.addEventListener("fetch", event => {
    console.info("fetch", event);
    const requestUrl = new URL(event.request.url);

    if (requestUrl.origin === location.origin) {
        event.respondWith(serveResource(event.request));
    }
});

/**
 * Serve resource from cache or network
 * @param request client request
 * @returns {Promise<Cache>}
 */
const serveResource = request => {
    return caches.open(staticCache)
        .then(cache => cache.match(request)
            .then(response => {
                if (response) return response;

                return fetch(request)
                    .then(networkResponse => {
                        cache.put(request, networkResponse.clone());
                        return networkResponse;
                    });
            }))
        .catch(error => console.error("Something happened", error));
};

/**
 * Message event
 */
self.addEventListener("message", event => {
    console.log("message", event);
    if (event.data.action === "skipWaiting") {
        self.skipWaiting();
    }
});