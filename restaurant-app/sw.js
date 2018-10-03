let cacheName = "main-cache";
let cacheFiles = [
    './',
    './index.html',
    './css/styles.css',
    './img/1.jpg',
    './img/2.jpg',
    './img/3.jpg',
    './img/4.jpg',
    './img/5.jpg',
    './img/6.jpg',
    './img/7.jpg',
    './img/8.jpg',
    './img/9.jpg',
    './img/10.jpg',
    './img/favicon.png',
    './js/dbhelper.js',
    './js/idb.js',
    './js/indexController.js',
    './js/main.js',
    './js/restaurantInfo.js',
    './build/css/app.min.css',
    './build/js/app-min.js',
    'https://unpkg.com/leaflet@1.3.1/dist/leaflet.css',
    'https://unpkg.com/leaflet@1.3.1/dist/leaflet.js',
    'https://use.fontawesome.com/releases/v5.1.0/css/all.css'
];

self.addEventListener('install',function (e) {
    console.log("[ Service Worker Installed ]");
    e.waitUntil(
        caches.open(cacheName).then(function (cache) {
            console.log("Service Worker caching cache files");
            return cache.addAll(cacheFiles);
        })
    )
});

self.addEventListener('activate',function (e) {
    console.log("[ Service Worker Activated ]");
    e.waitUntil(
        caches.keys().then(function (cacheNames) {
            return Promise.all(cacheNames.map(function (thisCacheName) {
                if(thisCacheName != cacheName){
                    console.log("Service worker removing cached files from ", thisCacheName);
                    return caches.delete(thisCacheName);
                }
            }))
        })
    )
});

self.addEventListener('fetch', function(event) {
    console.log('The service worker is serving the asset.');
    event.respondWith(fromNetwork(event.request, 400).catch(function () {
        return fromCache(event.request);
    }));
});

function fromNetwork(request, timeout) {
    return new Promise(function (fulfill, reject) {
        let timeoutId = setTimeout(reject, timeout);
        fetch(request).then(function (response) {
            clearTimeout(timeoutId);
            fulfill(response);
        }, reject);
    });
}

fromCache = request => caches.open(cacheName)
    .then(cache => cache.match(request)
        .then(matching => {
            console.log("[Following found in cache] "+request.url);
            return matching || Promise.reject('no-match');
        }));
