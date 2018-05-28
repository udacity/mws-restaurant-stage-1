/* eslint-disable no-console */
import idb from "idb";

const objectStore = "keyval";

const transaction = "transaction";

const dbPromise = idb.open("restaurant-store", 1, upgradeDB => {
    upgradeDB.createObjectStore(objectStore);
});

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
    console.info("fetch", event.request.url);
    console.log("event", event);
    const requestUrl = new URL(event.request.url);
    console.log(`request url ${requestUrl} location: ${location.origin}`);
    if (requestUrl.origin === location.origin) {
        // event.respondWith(serveResource(event.request));
        event.respondWith(serveResponseIdb(event.request));
    }
});


const serveResponseIdb = request => {
    // Get from cache
    dbPromise
        .then(db => db.transaction(transaction).objectStore(objectStore).get(request.url))
        .catch(error => console.error("Unable to access cache", error));

    // Fetch the request
    return fetch(request)
        .then(response =>
            dbPromise.then(db => {
                const tx = db.transaction(transaction, "readwrite");
                tx.objectStore(objectStore)
                    .put(response.clone(), request.url)
                    .then(response => console.info("operation succeed", response))
                    .catch(error => console.error("something went wrong", error));
                return response;
            }))
        .catch(error => console.error("Something failed", error));
};

/**
 * Serve resource from cache or network
 * @deprecated use {@link serveResponseIdb} instead
 * @param {Request} request - client request
 * @return {Promise<Cache>|Promise<Response>}
 */
const serveResource = request => // eslint-disable-line no-unused-vars
    caches.open(staticCache)
        .then(cache =>
            cache.match(request)
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
                }))
        .catch(error => console.error("Something happened", error));
