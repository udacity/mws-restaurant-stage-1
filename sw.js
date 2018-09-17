

var cacheName = 'restaurantData-v1';
var filesToCache = [
    '/',
    'sw.js',
    'js/main.js',
    'js/dbhelper.js',
    'js/restaurant_info.js',
    'data/restaurants.json',
    'css/styles.css',
    'index.html',
    'restaurant.html'
];

self.addEventListener('install', function(event) {
    console.log('Attempting to install sw and cache static assets');
    filesToCache ;
    event.waitUntil(
        caches.open('mws-restaurant-v1').then(function(cache) {
            return cache.addAll(filesToCache);
        })
    );
});

self.addEventListener('fetch', function(event) {
    if (event.request.url.indexOf('restaurant.html') > -1) {
        event.respondWith(caches.match('restaurant.html'));
    }
    else
    event.respondWith(
        caches.match(event.request)
            .then(function(response) {
                if (response) return response;
                return fetch(event.request);
            })
            .catch(function(error) {
                console.error('Error in caches.match');
                console.error(error);
                console.error(event.request);
            })
    );
});

