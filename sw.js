/**
 * Service Worker configurations
 */

 const CACHE_VERSION = 'mws-v7';

self.addEventListener('fetch', function(event) {
    
    //Uncomment this to disable cache
    //return;

    event.respondWith(

        caches.match(event.request).then(function(responseFromCache) {

            if (responseFromCache) return responseFromCache;

            return fetch(event.request).then(function(responseFromWeb) {

                return caches.open(CACHE_VERSION).then(function(cache) {
                    cache.put(event.request.url, responseFromWeb.clone());
                    return responseFromWeb;
                });
            });
        })
    )
});