const cacheName = "restaurant-sw-v1";

function getAllImages(){
    const images = [];
    for(let i=1; i<11; i++){
        images.push(`./img/${i}.jpg`);
    }
    return images;
}

self.addEventListener('install', function(event) {
    event.waitUntil(
        caches.open(cacheName).then(function(cache) {
            return cache.addAll([
                './',
                './index.html',
                './restaurant.html',
                './js/dbhelper.js',
                './js/main.js',
                './js/restaurant_info.js',
                './data/restaurants.json',
                './css/styles.css'
                ].concat(getAllImages()));
        })
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keyList => {
            return Promise.all(keyList.map(key => {
                if(key !== cacheName) {
                    console.log('removing old cache', key);
                    return caches.delete(key);
                }
            }));
        })
    );
});

self.addEventListener('fetch', function(event) {
    event.respondWith(

        caches.open(cacheName).then(function(cache) {
            return cache.match(event.request).then(function (response) {
                return response || fetch(event.request).then(function(response) {
                    let res = response.clone();
                    if(event.request.url.indexOf('maps') < 0) {
                        cache.put(event.request, res);
                    }
                    return response;
                });
            });
        })
    );
});