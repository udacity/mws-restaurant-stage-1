// Define name of static cache
const staticCache = 'rest-rating-v5';

// On installing SW
self.addEventListener('install', event => {
    event.waitUntil(

        // Add to cache
        caches.open(staticCache).then(cache => {
            return cache.addAll([
                '/',
                'css/styles.css',
                'https://unpkg.com/leaflet@1.3.1/dist/leaflet.css',
                'https://use.fontawesome.com/releases/v5.1.0/css/all.css',
                'data/restaurants.json',
                'https://unpkg.com/leaflet@1.3.1/dist/leaflet.js',
                'js/dbhelper.js',
                'js/indexController.js',
                'js/main.js',
                'js/restaurant_info.js',
                'img/1.jpg',
                'img/2.jpg',
                'img/3.jpg',
                'img/4.jpg',
                'img/5.jpg',
                'img/6.jpg',
                'img/7.jpg',
                'img/8.jpg',
                'img/9.jpg',
                'img/10.jpg',
            ]);
        })
    );
});

// Delete the old caches
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.filter(cacheName => {
                    return cacheName.startsWith('rest-') &&
                        cacheName != staticCache;
                }).map(cacheName => {
                    return caches.delete(cacheName);
                })
            )
        })
    );
});

// Hijack requests
self.addEventListener('fetch', (event) => {
    // Do caching here
    event.respondWith(
        caches.match(event.request).then(res => {
            return res || fetch(event.request).then(response => {
                if (response.status == 404) {
                    // Return a 404 page
                    return new Response('Wooops, page not found!!');
                } else {
                    return response;
                }
            }).catch(err => {
                // Don't let the application crash
                console.log(err);
                return new Response('Some error occured');
            })
        })

    );
});
