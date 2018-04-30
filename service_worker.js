const staticCacheName = "static-cache-v3";

function getAllImages(){
    const images = [];
    for(let i=1; i<11; i++){
        images.push(`./img/${i}.webp`);
    }
    return images;
}

self.addEventListener('install', function(event) {
    event.waitUntil(
        caches.open(staticCacheName).then(function(cache) {
            return cache.addAll([
                './',
                './index.html',
                './restaurant.html',
                './js/apihelper.js',
                './js/dbhelper.js',
                './js/localforage.min.js',
                './js/main.js',
                './js/restaurant_info.js',
                './css/styles.css'
                ].concat(getAllImages()));
        })
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keyList => {
            return Promise.all(keyList.map(key => {
                if(key !== staticCacheName) {
                    console.log('removing old cache', key);
                    return caches.delete(key);
                }
            }));
        })
    );
});

self.addEventListener('fetch', function(event) {
    event.respondWith(
        caches.open(staticCacheName).then(function(cache) {
            return cache.match(event.request , { ignoreSearch: true }).then(function (response) {
                return response || fetch(event.request).then(function(response) {
                    let res = response.clone();
                    if(event.request.url.indexOf('img/') > 0) {
                        cache.put(event.request, res);
                    }
                    return response;
                });
            });
        })
    );
});