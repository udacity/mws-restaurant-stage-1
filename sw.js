const PRECACHE = 'restaurant-reviews-v3';
const RUNTIME = 'runtime-v3';

// Links to cache
const PRECACHE_URLS = [
  '/',
  'index.html',
  'manifest.json',
  'restaurant.html',
  'robots.txt',
  '/data/restaurants.json',
  '/css/styles.css',
  '/js/dbhelper.js',
  '/js/main.js',
  '/js/restaurant_info.js',
  '/sw.js',
  '/js/app.js',
];
// Cache images
for(let i = 1; i <= 10; i++) {
  PRECACHE_URLS.push(`/restaurant.html?id=${i}`);
  PRECACHE_URLS.push(`/img/${i}_800w.jpg`);
  PRECACHE_URLS.push(`/img/${i}_400w.jpg`);
}

// Service worker install handler
self.addEventListener("install", event => {
  console.log("Installing service worker...");
  event.waitUntil(
    caches
      .open(PRECACHE)
      .then(cache => {
        console.log(`Cache ${PRECACHE} opened!`);
        for (const url of PRECACHE_URLS) {
          console.log(`About to cache ${url} at index ${url}`);
          cache.add(url).catch(err => {
            console.log(`Cache.add failed for ${url}`, err);
          });
        }
      })
      .catch(error => {
        console.log("caches", error);
      })
  );
});

/**
 * fetch handles responses for same-origin resources from a cache.
 * If no response is found, it populates the runtime cache with the response
 * from the network before returning it to the page.
 * https://googlechrome.github.io/samples/service-worker/basic/
 */
self.addEventListener('fetch', (event) => {
  // skip cross-origin requests
  if (event.request.url.startsWith(self.location.origin)) {
    event.respondWith(
      caches.match(event.request)
        .then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          return caches.open(RUNTIME)
            .then((cache) => {
              return fetch(event.request)
                .then((resp) => {
                  // update runtime cache with a copy of the network response
                  return cache.put(event.request, respone.clone())
                    .then(() => response);
                });
            });
        })
    );
  }
});

/**
 * The activate handler takes care of cleaning up old caches.
 * https://googlechrome.github.io/samples/service-worker/basic/
 */
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        Promise.all(
          cacheNames.filter((cacheName) => {
            return cacheName.startsWith('restaurant-') && cacheName !== PRECACHE;
          }).map((cacheName) => caches.delete(cacheName))
        );
      })
      .then(() => self.clients.claim())
  );
});
