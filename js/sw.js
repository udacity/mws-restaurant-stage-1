var cacheID = "mws-001";

self.addEventListener("install", event => {
    event.waitUntil(
        caches.open(cacheID)
        .then(cache => {
            return cache
                .addAll([
                    "/",
                    "/index.html",
                    "/restaurant.html",
                    "/css/styles.css",
                    "/js/main.js",
                    "/js/restaurant_info.js",
                    "/js/dbhelper.js",
                    "/js/register.js",
                    "/js/sw.js"
                ])
                .catch(error => {
                    console.log("Failed to open cache" + error);
                });
        })
    );
});

self.addEventListener("fetch", event => {

    let cacheRequest = event.request;
    let cacheURLObj = new URL(event.request.url);

    event.respondWith(
        caches.match(cacheRequest).then(response => {
            return (response ||
                fetch(event.request)
                    .then(fetchResponse => {
                        return caches.open(cacheID).then(cache => {
                            cache.put(event.request.fetchResponse.clone());
                            return fetchResponse;
                        });
                    })
                    .catch(error => {
                        let nCText = "Not connected to the internet";
                        let nCResp = new Response(nCText);
                        nCResp.status = 404;
                        nCResp.statusText = nCText;
                    })
            );
        })
    );
});