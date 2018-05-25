var staticCachName = 'restaurant-v2';

self.addEventListener('fetch', function(event) {
    if (event.request.url.endsWith('/restaurants')) return ; 
    event.respondWith(
        caches.match(event.request).then(function(response) {
        if (response) {
            return response;
        }

        return fetch(event.request).then(function(response) {
            var shouldCache = response.ok;
            
            if (shouldCache) {
            return caches.open(staticCachName).then(function(cache) {
                cache.put(event.request, response.clone());
                return response;
            });
            } else {
            return response;
            }
        });
        })
    );
});