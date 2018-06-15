var CACHE_NAME = 'restaurant-reviews-cache-v1';
var urlsToCache = [
    "/",
    "/index.html",
    "/restaurant.html",
    "/css/styles.css",
    "/data/restaurants.json",
    "/js/",
    "/js/dbhelper.js",
    "/js/main.js",
    "/js/restaurant_info.js",
];

self.addEventListener("install", event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            return cache
            .addAll(urlsToCache)
            .catch(err => {
                console.log("Caches opening had an error: ", err);
            });
        })
    );
});

// self.addEventListener('fetch', event => {
//     event.respondWith(
//         new Response("Hello World")
//     );
// });

self.addEventListener('fetch', event => {
    let cache_req = event.request;
    let cache_url_obj = new URL(event.request.url);

    console.log(event);
    

    if(cache_url_obj.hostname !== "localhost") {
        event.request.mode = "no-cors";
    }

    if(event.request.url.indexOf("restaurant.html") > -1) {
        cache_req = new Request("restaurant.html");
    };

    event.respondWith(
        caches.match(cache_req).then(response => {
            return (
                response || 
                fetch(event.request)
                .then(fetch_resp => {
                    return caches.open(CACHE_NAME).then(cache => {
                        cache.put(event.request, fetch_resp.clone());
                        return fetch_resp;
                    });
                })
                .catch(err => {
                    return new Response("No internet connection", {
                        status: 404,
                        statusText: "No internet connection"
                    })
                })
            )
        })
    )
})