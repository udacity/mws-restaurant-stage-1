// const staticCacheName = 'UdacityYelp-v1';
//
// self.addEventListener('fetch', event => {
//     event.respondWith(
//         caches.open(staticCacheName).then(cache => {
//             return cache.match(event.request).then(response => {
//                 if (response) {
//                     return response;
//                 }
//                 return fetch(event.request).then(fetch_response => {
//                     cache.put(event.request, fetch_response.clone());
//                     return fetch_response;
//                 });
//             });
//         })
//     );
// })
//
// self.addEventListener('activate', event => {
//     event.waitUntil(
//         caches.keys()
//             .then(cacheNames => {
//                 cacheNames.filter(cacheName => cacheName.startsWith('UdacityYelp') && cacheName !== staticCacheName)
//                     .map(cacheName => caches.delete(cacheName))
//             })
//     );
// })
//
// self.addEventListener('install', event => {
//     event.waitUntil(
//         caches.open(staticCacheName).then(cache => {
//             return cache.addAll([
//                 '/',
//                 '/index.html',
//                 '/restaurant.html',
//                 '/data/restaurants.json',
//                 '/css/styles.css',
//                 '/js/api_helper.js',
//                 '/js/main.js',
//                 '/js/restaurant_info.js',
//             ]);
//         })
//     );
// });
