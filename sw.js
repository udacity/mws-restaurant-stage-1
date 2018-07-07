let cacheName = 'mws-pro1-static-v2';

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(cacheName).then(cache => {
            return cache.addAll([
                '/',
                '/index.html',
                '/restaurant.html',
                '/css/styles.css',
                '/data/restaurants.json',
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
                        cacheName != cacheName;
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
    event.respondWith(
        caches.match(cacheRequest).then(response => {
            return response || fetch(cacheRequest);
        })
    );
});