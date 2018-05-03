const staticCacheName = 'restaurant-reviews-static-v1';
const URLToCache = ['/',
    '/restaurant.html',
    '/js/main.js',
    '/css/styles.css',
    '/js/dbhelper.js',
    '/js/restaurant_info.js'
];

self.addEventListener('install', function(event) {
    event.waitUntil(
        caches.open('restaurant-reviews-static-v1')
        .then(cache => cache.addAll(URLToCache))
    );
});

self.addEventListener('fetch', function(event) {
    // if found a match in cache
    // else make a fetch request
    event.respondWith(
        caches.match(event.request).then(function(response) {
            return response || fetch(event.request);
        })
    );
});
