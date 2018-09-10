importScripts('serviceWorker-cache-polyfill.js');

// Open a cache in local storage
// Cache all the assets from the website

var cacheID = "restaruant-001";

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(cacheID).then(cache => {
      return cache
        .addAll([
          "/",
          "/index.html",
          "/restaurant.html",
          "/serviceWorker-cache-polyfill.js",
          "/css/styles.css",
          "/data/restaurants.json",
          "/js/",
          "/js/dbhelper.js",
          "/js/main.js",
          "/js/restaurant_info.js",
          "/img/",
          "/img/1.jpg",
          "/img/2.jpg",
          "/img/3.jpg",
          "/img/4.jpg",
          "/img/5.jpg",
          "/img/6.jpg",
          "/img/7.jpg",
          "/img/8.jpg",
          "/img/9.jpg",
          "/img/10.jpg",
          "/img/notavailable.jpg",
          "/js/register.js"
        ])
        .catch(error => {
          console.log("Caches open failed: " + error);
        });
    })
  );
});

self.addEventListener("fetch", event => {
  let cacheRequest = event.request;
  let cacheUrlObj = new URL(event.request.url);
  if (event.request.url.indexOf("restaurant.html") > -1) {
    const cacheURL = "restaurant.html";
    cacheRequest = new Request(cacheURL);
  }
  if (cacheUrlObj.hostname !== "localhost") {
    event.request.mode = "no-cors";
  }

  event.respondWith(
    caches.match(cacheRequest).then(response => {
      return (
        response ||
        fetch(event.request)
          .then(fetchResponse => {
            return caches.open(cacheID)
                        .then(cache => {
                            cache.put(event.request, fetchResponse.clone());
                            return fetchResponse;
                        });
          })
          .catch(error => {
              if (event.request.url.indexOf(".jpg") > -1) {
                  return caches.match("/img/notavailable.jpg");
              }
              return new Response("Restaurant Reviews is currently not connected to the Internet.  Please connect and try again.", {
                  status: 404,
                  statusText: "Restaurant Reviews is currently not connected to the Internet.  Please connect and try again."
              });
          })
      );
    })
  );
});
