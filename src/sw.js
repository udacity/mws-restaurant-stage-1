const staticCacheName = 'restaurant-reviews-static-v3';
const imagesCache = 'restaurant-reviews-images';
const restaurantsDataCache = 'restaurant-reviews-restaurants-data';

const allCaches = [
    staticCacheName,
    imagesCache,
    restaurantsDataCache
];

self.addEventListener('install', event => event.waitUntil(
    caches.open(staticCacheName)
        .then(cache => cache.addAll([
            '/',
            '/index.html',
            '/restaurant.html',
            'css/styles.css',
            'js/main.js',
            'js/restaurant_info.js'
        ]))
));

// try to fetch from the cache
// if that fails fetch it from the network
self.addEventListener('fetch', function (event) {
    const requestURL = new URL(event.request.url);

    if (requestURL.origin === location.origin) {
        if (requestURL.pathname.startsWith('/restaurant.html')) {
            return event.respondWith(
                caches.match('/restaurant.html')
                    .then(response => response || fetch('/restaurant.html'))
            );
        }
        if (requestURL.pathname.startsWith('/data/restaurants.json')) {
            return event.respondWith(fetchRestaurantData(event.request));
        }
        if (requestURL.pathname.startsWith('/img/')) {
            return event.respondWith(fetchImage(event.request));
        }
    }

    return event.respondWith(
        caches.match(event.request)
            .then(response => response || fetch(event.request))
    )
});

function fetchRestaurantData(request) {
    return caches.open(restaurantsDataCache)
        .then(cache => cache.match(request)
            .then(response => response || fetch(request).then(function (response) {
                cache.put(request, response.clone());
                return response;
            })));
}

function fetchImage(request) {
    const cachedImageUrl = request.url.replace(/(-\d*w?\.jpg$)|\.jpg$/, '');

    return caches.open(imagesCache)
        .then(cache => cache.match(cachedImageUrl)
            .then(response => response || fetch(request).then(function (response) {
                cache.put(cachedImageUrl, response.clone());
                return response;
            })));
}

// when a new sw is activated update the cache
self.addEventListener('activate', event =>
    event.waitUntil(
        caches.keys()
            .then(cacheNames => Promise.all(cacheNames.filter(
                cacheName => cacheName.startsWith('restaurant-reviews-') && !allCaches.includes(cacheName)
            ).map(cacheName => caches.delete(cacheName))))
    )
);

// trigger a sw update
self.addEventListener('message', event =>
    event.data.action == 'skipWaiting' ? self.skipWaiting() : null
);