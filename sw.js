self.addEventListener('install', function(event) {
    console.log('Service Worker: Installed');

    let urlsToCache = [
        '/',
        // '/sw-registration.js',
        'index.html',
        'restaurant.html',
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

    event.waitUntil(
        caches.open('restaurant-reviews-v1').then(function (cache) {
            console.log('Service Worker: Caching Files');
            return cache.addAll(urlsToCache);
        })
    );
});