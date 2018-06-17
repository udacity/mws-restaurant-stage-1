/*self.addEventListener( 'fetch', function(event) {
    console.log(event.request);
});*/
var staticCacheName = 'Restaurant-Reviews-v2';

self.addEventListener( 'install', function(event) {
    event.waitUntil (
        caches.open(staticCacheName).then( function(cache) {
            return cache.addAll([
                '/',
                'index.html',
                'js/main.js',
                'js/restaurant_info.js',
                'restaurant.html',
                'css/styles.css'
            ]);
        })
    );
});

/*self.addEventListener('fetch', function(event) {
    event.respondWith(
        caches.match( event.request ).then( function( response ) {
            return response || fetch(event.request);
        }).catch( function( error ) {
            console.log( error, 'no cache entry for:', event.request.url );
        })
    );
});*/

self.addEventListener('activate', function(event){
    event.waitUntil(
        caches.keys().then(function(cacheNames) {
            return Promise.all(
                cacheNames.filter(function(cacheName) {
                    return cacheName.startsWith('Restaurant-Reviews-') && cacheName !== staticCacheName
                }).map(function(cacheName) {
                    return caches.delete(cacheName);
                })
            );
        })
    );
})