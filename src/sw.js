const appName = 'restaurant-app';
const version = appName + '-v3';
const imgVersion = appName + '-images';
const allCaches = [version, imgVersion]
const toCache = [
    '/', 
    '/restaurant.html',
    '/css/styles.css',
    '/css/styles-medium.css',
    '/css/styles-large.css',
    '/js/main.js',
    '/js/restaurant_info.js',
    'manifest.json',
];

self.addEventListener('install', function(event){
    event.waitUntil(
        caches.open(version).then(function(cache){
            return cache.addAll(toCache);
        })
    )
})

self.addEventListener('activate', function(event){
    event.waitUntil(
        caches.keys().then(function(cacheNames){
            return Promise.all(
                cacheNames.filter(function(cacheName){
                    return cacheName.startsWith(appName) && !allCaches.includes(cacheName)
                }).map(function(cacheName){
                    return caches.delete(cacheName);
                })
            )
        })
    )
})


self.addEventListener('fetch', function(event){
    event.respondWith(
        caches.match(event.request).then(function(res){
            return res || fetch(event.request).then(function(response){
                return caches.open(version).then(function(cache){
                    cache.put(event.request, response.clone());
                    return response;
                })
            })
        })
    )
})