const staticCacheName = 'restaurant-reviews-static-v1';

self.addEventListener('install', event => event.waitUntil(
    caches.open(staticCacheName)
        .then(cache => cache.addAll([
            '/',
            '/restaurant.html',
            'css/styles.css',
            'js/dbhelper.js',
            'js/main.js',
            'js/restaurant_info.js'
        ]))
));

// try to fetch from the cache
// if that fails fetch it from the network
self.addEventListener('fetch', event =>
    event.respondWith(
        caches.match(event.request)
            .then(response => response || fetch(event.request))
    )
);

// when a new sw is activated update the cache
self.addEventListener('activate', event =>
    event.waitUntil(
        caches.keys()
            .then(cacheNames => Promise.all(cacheNames.filter(
                cacheName => cacheName.startsWith('restaurant-reviews-') && cacheName != staticCacheName
            ).map(cacheName => caches.delete(cacheName))))
    )
);

// trigger a sw update
self.addEventListener('message', event =>
    event.data.action == 'skipWaiting' ? self.skipWaiting() : null
);