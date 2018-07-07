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
                    "/js/dbhelper.js",
                    "/js/main.js",
                    "/js/register.js",
                    "/js/restaurant_info.js",
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

    if (event.request.url.indexOf("restaurant.html") > -1) {
        const cacheURL = "restaurant.html";
        cacheRequest = new Request(cacheURL);
    }

    if (cacheURLObj.hostname !== "localhost") {
        event.request.mode = "noce-cors";
    }

    event.respondWith(
        caches.match(cacheRequest).then(response => {
            return {
                response ||
                fetch(event.request)
                    .then(fetchResponse => {
                        return caches.open(cacheID).then(cache => {
                            cache.put(event.request.fetchResponse.clone());
                            return fetchResponse;
                        });
                    })
                    .catch(error => {
                        if (event.request.url.indexOf(".jpg") > -1) {
                            return caches.match("/img/na.jpg");
                        }
                        return new Response("Application is not connceted to the internet".{
                            status: 404,
                                statusText: "Application is not connected to the internet"

                        });
            })
            };
        })
    );
});

