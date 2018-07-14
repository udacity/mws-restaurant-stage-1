var cacheID = "mws-001";

self.addEventListener("install", event => {
    event.waitUntil(
        caches.open(cacheID).then(cache => {
            return cache.addAll([
                `/`,
                `/index.html`,
                `/restaurant.html`,
                `/css/styles.css`,
                `/js/main.js`,
                `/js/restaurant_info.js`,
                `/js/dbhelper.js`,
                `/js/register.js`,
                `/sw.js`,
                `/data/restaurants.json`
                ])
                .then(() => self.skipWaiting());
        })
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', function (event) {
    event.respondWith(
        caches.open(cacheID).then(function (cache)
        {
            return cache.match(event.request)
                .then(function (response)
                {
                    return response || fetch(event.request)
                        .then(function (response)
                        {
                            if (event.request.url.includes('.jpg') || event.request.url.includes('.html')) {
                                cache.put(event.request, response.clone());
                            }
                            return response;
                        })
                        .catch(error => {
                            return new Response('No internet and item not cached', { status: 404, statusText: 'No internet and item not cached' });
                        })
                });
        })
    );
});
