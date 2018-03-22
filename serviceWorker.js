const staticCache = "restaurant-static";
const staticAssets = [
    "/",
    "/index.html",
    "/restaurant.html",
    "/js/main.js",
    "/js/dbhelper.js",
    "/js/restaurant_info.js",
    "/css/styles.css",
    "/img/1.jpg",
    "/img/2.jpg",
    "/img/3.jpg",
    "/img/5.jpg",
    "/img/5.jpg",
    "/img/6.jpg",
    "/img/7.jpg",
    "/img/8.jpg",
    "/img/9.jpg",
    "/img/10.jpg",
    "https://fonts.gstatic.com/s/roboto/v18/KFOmCnqEu92Fr1Mu4mxKKTU1Kg.woff2",
    "https://fonts.gstatic.com/s/roboto/v18/KFOlCnqEu92Fr1MmEU9fBBc4AMP6lQ.woff2"
];

/**
 * Install event
 */
self.addEventListener("install", event => {
    console.info("install");
    event.waitUntil(
        caches.open(staticCache)
            .then(cache => cache.addAll(staticAssets))
            .catch(error => console.error("Something happened", error))
    );
});

/**
 * Activate event
 */
self.addEventListener("activate", event => {
    console.info("activate");
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
    console.info("fetch", event.request.url);
    //const requestUrl = new URL(event.request.url);

    //if (requestUrl.origin === location.origin) {
    event.respondWith(serveResource(event.request));
    //}
});

/**
 * Serve resource from cache or network
 * @param request client request
 * @returns {Promise<Cache>}
 */
const serveResource = request => {
    return caches.open(staticCache)
        .then(cache => {
            return cache.match(request)
                .then(response => {
                    console.log(`Matching request ${request.url}`);
                    if (response) {
                        console.info("returning from cache");
                        return response;
                    }

                    return fetch(request)
                        .then(networkResponse => {
                            console.log(`Fetching ${request.url} from network`);
                            cache.put(request, networkResponse.clone())
                                .then(() => console.info("Caching succeed"))
                                .catch(error => console.error("Caching failed", error));
                            return networkResponse;
                        });
                });
        })
        .catch(error => console.error("Something happened", error));
};