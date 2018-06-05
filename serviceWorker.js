/* eslint-disable no-console */

self.importScripts("js/idb.js");

const objectStore = "objectStore";

const dbPromise = idb.open("restaurant-store", 1, upgradeDB => {
    upgradeDB.createObjectStore(objectStore);
});// eslint-disable-line no-undef

const staticCache = "restaurant-static";
const staticAssets = [
    "/",
    "/index.html",
    "/restaurant.html",
    "/js/main.js",
    "/js/dbhelper.js",
    "/js/restaurant_info.js",
    "/css/styles.css",
    "/img/1.jpg", "/img/1.webp",
    "/img/2.jpg", "/img/2.webp",
    "/img/3.jpg", "/img/3.webp",
    "/img/4.jpg", "/img/4.webp",
    "/img/5.jpg", "/img/5.webp",
    "/img/6.jpg", "/img/6.webp",
    "/img/7.jpg", "/img/7.webp",
    "/img/8.jpg", "/img/8.webp",
    "/img/9.jpg", "/img/9.webp",
    "/img/10.jpg", "/img/10.jpg",
    "https://fonts.gstatic.com/s/roboto/v18/KFOmCnqEu92Fr1Mu4mxKKTU1Kg.woff2",
    "https://fonts.gstatic.com/s/roboto/v18/KFOlCnqEu92Fr1MmEU9fBBc4AMP6lQ.woff2",
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
            .then(cacheNames => Promise.all(
                cacheNames.filter(cacheName => cacheName.startsWith("restaurant-") &&
                    !staticCache.includes(cacheName))
                    .map(cacheName => caches.delete(cacheName))
            ))
            .catch(error => console.error("Something happened", error))
    );
});

/**
 * Fetch from network event
 */
self.addEventListener("fetch", event => {
    const port = event.request.url.split("/")[2].split(":")[1];
    if (port !== undefined && port === "1337") {
        event.respondWith(serveResponseIdb(event.request));
    } else {
        event.respondWith(serveResource(event.request));
    }
});

/**
 * Serve response from indexedDB
 * @param {Request} request
 * @return {Promise<Response | void>}
 */
const serveResponseIdb = request => {
    dbPromise
        .then(db => {
            const response = new Response(db.transaction(objectStore).objectStore(objectStore).get(request.url));
            return Promise.resolve(response);
        })
        .catch(error => console.error("Unable to access cache: ", error));

    return fetch(request)
        .then(fetchResponse => {
            if (fetchResponse.headers.get("Content-Type").match(/application\/json/i)) {
                dbPromise
                    .then(db => {
                        fetchResponse.clone().json().then(content => {
                            const tx = db.transaction(objectStore, "readwrite");
                            tx.objectStore(objectStore)
                                .put(content, request.url)
                                .then(response => console.info("put operation succeed: ", response))
                                .catch(error => console.error("Put operation failed: ", error));
                            return tx.complete;
                        });
                    })
                    .catch(error => console.error("Error opening transaction: ", error));
            }

            return fetchResponse;
        })
        .catch(error => console.error("Fetch Error: ", error));
};

/**
 * Serve resource from cache or network
 * @param {Request} request client request
 * @return {Promise<Response | void>}
 */
const serveResource = request =>
    caches.open(staticCache)
        .then(cache =>
            cache.match(request)
                .then(response => {
                    if (response) {
                        return response;
                    }

                    return fetch(request)
                        .then(networkResponse => {
                            cache.put(request, networkResponse.clone())
                                .then(() => console.info("Caching succeed"))
                                .catch(error => console.error("Caching failed", error));
                            return networkResponse;
                        });
                }))
        .catch(error => console.error("Something happened", error));
