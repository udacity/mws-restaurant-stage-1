let staticCacheName = 'restaurant-reviews-v2';
let urlsToCache = [
    '/',
    //TODO: not need registration?
    './sw-registration.js',
    'index.html',
    'restaurant.html',
    'data/restaurants.json',
    'js/main.js',
    'js/restaurant_info.js',
    'js/dbhelper.js',
    'css/styles.css',
    'img/1.jpg',
    'img/2.jpg',
    'img/3.jpg',
    'img/4.jpg',
    'img/5.jpg',
    'img/6.jpg',
    'img/7.jpg',
    'img/8.jpg',
    'img/9.jpg',
    'img/10.jpg'
];

//credit Traversy Media for inspiration https://www.youtube.com/watch?v=ksXwaWHCW6k
//Save content in cache
self.addEventListener('install', function(event) {
    console.log('Service Worker: Installed');

    event.waitUntil(
        caches.open(staticCacheName).then(function (cache) {
            console.log('Service Worker: Caching Files');
            return cache.addAll(urlsToCache);
        })
    );
});


self.addEventListener('activate', function(event) {
    console.log('Service Worker: Activated');
    //remove unwanted caches
    event.waitUntil(
        caches.keys().then( function(cacheNames) {
            return Promise.all(
                cacheNames.filter(function(cacheName) {
                    return cacheName != staticCacheName;
                }).map(function (cacheName) {
                    console.log('Service Worker: Clearing Old Cache');
                    return caches.delete(cacheName);
                })
           );
    }));
});

//Show offline via fetch
self.addEventListener('fetch', function(event) {
    console.log('Service Worker: Fetching');
    event.respondWith(
        //if site is offline, then event.request will fail and go to .catch
    //     fetch(event.request).catch(() =>
    //         caches.match(event.request)
    //    )
        caches.match(event.request).then(function (response) {
            if (response) {
                console.log(`Found ${event.request} in cache`);
                return response;
            } else {
                console.log(`Could not find ${event.request} in cache: fetching.`);
                return fetch(event.request);
            }
        })
    );
});