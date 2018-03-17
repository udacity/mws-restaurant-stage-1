const cacheName = 'restaurant-app-v1';
const photosCacheName = 'restaurant-app-photos-v1';

const filesToCache = [
    'index.html',
    'restaurant.html',
    'css/styles.css',
    'js/main.js',
    'js/dbhelper.js',
    'js/restaurant_info.js',
    'manifest.json',
    'assets/logo_192.png',
    'assets/logo_512.png',
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(cacheName)
        .then(cache => {cache.addAll(filesToCache);})
    )
});

self.addEventListener('fetch', event => {
    const url = new URL(event.request.url);

    if (url.pathname === '/') {
        event.respondWith(
            caches.match('index.html')
            .then(response => response || fetch(event.request))
        );
        return;
    };

    if (url.pathname.startsWith('/restaurant.html')) {
        event.respondWith(
            caches.match('restaurant.html')
            .then(response => response || fetch(event.request))
        );
        return;
    };

    if (url.pathname.endsWith('.jpg')) {
        event.respondWith(servePhoto(event.request));
        return;
    };

    event.respondWith(
        caches.match(event.request)
        .then(response => response || fetch(event.request))
    );
});

function servePhoto(request) {
    return caches.open(photosCacheName).then(cache => {
        return cache.match(request).then(response => (
            response || cacheAndFetch(cache, request)
        ));
    });
}

function cacheAndFetch(cache, request) {
    cache.add(request);
    return fetch(request);
}
