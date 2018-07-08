let staticCacheName = 'mws-pro1-static-v2';
let imgCacheName = 'mws-pro1-images';
let allCaches = [
    staticCacheName,
    imgCacheName
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(staticCacheName).then(cache => {
            return cache.addAll([
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
            ]);
        })
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.filter(cacheName => {
                    return cacheName.startsWith('mws-pro1-') &&
                        !allCaches.includes(cacheName);
                }).map(cacheName => {
                    return caches.delete(cacheName);
                })
            );
        })
    );
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

function serveOther(cacheRequest) {
    return caches.match(cacheRequest).then(response => {
        return response || fetch(cacheRequest);
    });
}

function serveRestaurant(cacheRequest) {
    return caches.match(cacheRequest.url.split('?')[0]).then(response => {
        return response || fetch(cacheRequest);
    });
}

function servePhoto(request) {
    let storageUrl = (new URL(request.url)).pathname.replace(/_\dx\.jpg$/, '');
    return caches.open(imgCacheName).then(function (cache) {
        return cache.match(storageUrl).then(function (response) {
            if (response) return response;

            return fetch(request).then(function (networkResponse) {
                cache.put(storageUrl, networkResponse.clone());
                return networkResponse;
            });
        });
    });
}
