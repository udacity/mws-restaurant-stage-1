const staticCache = 'restaurant-static-v8';

self.addEventListener('install', event => {
    console.info("install", event);
    event.waitUntil(
        caches.open(staticCache)
            .then(cache => cache.addAll([
                'js/main.js',
                'js/dbhelper.js',
                'js/restaurant_info.js',
                'css/styles.css',
                'img/'
            ]))
    );
});

self.addEventListener('activate', event => {
    console.info("activate", event);
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.filter(cacheName => cacheName.startsWith('restaurant-') &&
                    !staticCache.includes(cacheName))
                    .map(cacheName => caches.delete(cacheName))
            );
        })
    );
});

self.addEventListener('fetch', event => {
    console.info("fetch", event);
    const requestUrl = new URL(event.request.url);

    if (requestUrl.origin === location.origin) {
        event.respondWith(serveResource(event.request));
    }
});

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
            }));
};

self.addEventListener('message', event => {
    console.log("message", event);
    if (event.data.action === 'skipWaiting') {
        self.skipWaiting();
    }
});