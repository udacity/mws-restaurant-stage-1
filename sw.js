let staticCacheName = 'mws-pro1-static-v3';
let imgCacheName = 'mws-pro1-images';
let allCaches = [
    staticCacheName,
    imgCacheName
];

self.addEventListener('install', async event => {
    event.waitUntil((await caches.open(staticCacheName)).addAll([
        '/',
        '/index.html',
        '/restaurant.html',
        '/css/styles.css',
        '/js/',
        '/js/private.js',
        '/js/idb.js',
        '/js/idbhelper.js',
        '/js/dbhelper.js',
        '/js/main.js',
        '/js/restaurant_info.js',
        '/js/register.js',
        '/js/lazysizes.min.js'
    ]));
});

self.addEventListener('activate', async event => {
    event.waitUntil(Promise.all(
        (await caches.keys()).filter(cacheName => {
            return cacheName.startsWith('mws-pro1-') &&
                !allCaches.includes(cacheName);
        }).map(cacheName => {
            return caches.delete(cacheName);
        })
    ));
});

self.addEventListener('fetch', event => {
    let cacheRequest = event.request;
    let requestUrl = new URL(cacheRequest.url);
    if (requestUrl.hostname !== 'localhost') {
        cacheRequest.mode = 'no-cors';
    }

    if (requestUrl.pathname.startsWith('/restaurant.html')) {
        event.respondWith(serveRestaurant(cacheRequest));
    }
    else if (requestUrl.pathname.startsWith('/img/')) {
        event.respondWith(servePhoto(cacheRequest));
    }
    else {
        event.respondWith(serveOther(cacheRequest));
    }
});

async function serveOther(cacheRequest) {
    return (await caches.match(cacheRequest)) || fetch(cacheRequest);
}

async function serveRestaurant(cacheRequest) {
    return (await caches.match(cacheRequest.url.split('?')[0])) || fetch(cacheRequest);
}

async function servePhoto(request) {
    let storageUrl = (new URL(request.url)).pathname.replace(/_\dx\.jpg$/, '');
    let cache = await caches.open(imgCacheName);
    let response = await cache.match(storageUrl);
    if (response) return response;
    let networkResponse = await fetch(request);
    cache.put(storageUrl, networkResponse.clone());
    return networkResponse;
}
