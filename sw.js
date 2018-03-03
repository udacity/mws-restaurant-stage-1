const cacheName = 'restaurant-app-v1';

const filesToCache = [
    'restaurant.html',
    'index.html',
    'js/main.js',
    'js/dbhelper.js',
    'js/restaurant_info.js',
    'css/styles.css',
    'data/restaurants.json'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(cacheName)
        .then(cache => {cache.addAll(filesToCache);})
    )
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request).then(response => {
            return response || fetch(event.request)
        })
    )
});
