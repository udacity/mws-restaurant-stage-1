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
        .then(cache => cache.addAll(filesToCache))
        .then(() => self.skipWaiting())
    )
});

self.addEventListener('activate', () => {
    return self.clients.claim();
})

self.addEventListener('fetch', event => {
    const url = new URL(event.request.url);

    if (url.pathname === '/') {
        event.respondWith(
            caches.match('index.html')
            .then(response => response || fetch(event.request))
        );
        return;
    };

    if (url.pathname.endsWith('.webp')) {
        event.respondWith(servePhoto(event.request));
        return;
    };

    event.respondWith(
        caches.match(url.pathname)
        .then(response => response || fetch(event.request))
    );
});

self.addEventListener('sync', event => {
    if (event.tag === 'sync-reviews') {
        console.log('SYNCING REVIEWS')
        event.waitUntil(
            broadcast({ action: 'send-reviews' })
        )
    }
})

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

function broadcast(message) {
    return clients.matchAll().then(clients => {
        for (const client of clients) {
            client.postMessage(message)
        }
    })
}
