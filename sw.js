// In addition to the Udacity Jake Archibald content, I've been using Max
// Schwarzmueller's PWA course on Udemy.
// The service worker reflects patterns, I've learned from both courses
// https://www.udemy.com/progressive-web-app-pwa-the-complete-guide/learn/v4/

const SW_VERSION = "3";

// Service Worker Lifecycle Events
self.addEventListener("install", event => {
  console.log(`[Service Worker v${SW_VERSION}] Installing...`, event);
  // When we install our service worker, we want to cache all of the static
  // assets needed to render our app shell
  event.waitUntil(
    caches.open(`static-v${SW_VERSION}`).then(cache => {
      console.log(
        `[Service Worker v${SW_VERSION}] Precaching App Shell to static-v${SW_VERSION}...`
      );
      cache.addAll([
        "/",
        "/index.html",
        "/restaurant.html",
        "/css/styles.css",
        "/js/main.js",
        "/js/dbhelper.js",
        "/js/restaurant_info.js"
      ]);
    })
  );
});

self.addEventListener("activate", event => {
  console.log(`[Service Worker v${SW_VERSION}] Activating...`, event);
  // Prune all caches that are not appended with the appropriate SW version
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.map(key => {
          if (!key.includes(`-v${SW_VERSION}`)) {
            console.log(
              `[Service Worker v${SW_VERSION}] Removing old cache ${key}`
            );
            return caches.delete(key);
          } else {
            // Otherwise just immediately resolve so that Promise.all receives a Promise
            return Promise.resolve();
          }
        })
      )
    )
  );
  return self.clients.claim();
});

// Fetch Proxy
self.addEventListener("fetch", event => {
  // Intercept Fetch requests for the static content that comprises
  // our app shell and instead serve this out of the Cache
  event.respondWith(
    caches.match(event.request).then(cacheResponse => {
      // return the cached response if it exists, else fetch over the network
      // If cacheResponse is null, nothing in the caches matched the request,
      // so we fetch the response over the network, cache a clone of the result
      // for future requests, and return the result.
      // If cacheResponse is truthy, we return the response immediately
      if (!cacheResponse) {
        console.log(
          `[Service Worker v${SW_VERSION}] Fetching...`,
          event.request.url
        );
        return (
          fetch(event.request)
            .then(fetchResponse =>
              caches.open(`dynamic-v${SW_VERSION}`).then(cache => {
                // responses can only be used once, so we need to use the response
                // object's clone method to cache the response without consuming it
                cache.put(event.request.url, fetchResponse.clone());
                return fetchResponse;
              })
            )
            // Silently catch errors thrown because we were offline
            .catch(err => {})
        );
      } else {
        return cacheResponse;
      }
    })
  );
});
