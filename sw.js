let version = 'restaurant-app-cache-v4';
let toCache = ['/', '/img/resized/*', '/js/*', '/css/*'];

self.addEventListener('install', function(event){
    event.waitUntil(
        caches.open(version).then(function(cache){
            return cache.addAll(toCache);
        })
    )
})

// self.addEventListener('activate', function(event){
//     event.waitUntil(
//         caches.keys().then(function(cacheNames){
//             return Promise.all(
//                 cacheNames.filter(function(cacheName){
//                     return cacheName.startsWith('restaurant')
//                 }).map(function(cacheName){
//                     return caches.delete(cacheName);
//                 })
//             )
//         })
//     )
// })

// self.addEventListener('fetch', function(event){
//     event.respondWith(
//         caches.match(event.request).then(function(res){
//             return res || fetch(event.request).then(function(response){
//                 return caches.open(version).then(function(cache){
//                     cache.put(event.request, response.clone());
//                     return response;
//                 })
//             })
//         })
//     )
// })