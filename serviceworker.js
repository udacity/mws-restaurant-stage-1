const cacheName = 'mws-restaurant';
const urlsToCache = [
  "./",
  "./css/styles.css",
  "./js/main.js",
  "./js/restaurant_info.js",
  "./js/dbhelper.js",
  "./data/restaurants.json",
  "./restaurant.html",
  "http://localhost:8000/data/restaurants.json",
  "https://unpkg.com/leaflet@1.3.1/dist/leaflet.css",
  "https://unpkg.com/leaflet@1.3.1/dist/leaflet.js"
];

// install service worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(cacheName).then(cache => {
      return cache.addAll(urlsToCache);
    })
  );
});

// listen for fetch event
self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);

  if (requestUrl.origin === location.origin) {
    if (requestUrl.pathname === '/') {
      event.respondWith(caches.match('/'));
      return;
    }

    if (requestUrl.href.includes('restaurant.html')) {
      event.respondWith(caches.match('restaurant.html'));
    }

    if (requestUrl.pathname === '/data/restaurants.json') {
      event.respondWith(serveRestaurantData(event.request));
      return;
    }

    if (requestUrl.pathname === '/js/main.js') {
      event.respondWith(caches.match('js/main.js'));
      return;
    }

    if (requestUrl.pathname === '/css/styles.css') {
      event.respondWith(caches.match('css/styles.css'));
      return;
    }

    if (requestUrl.pathname === '/js/restaurant_info.js') {
      event.respondWith(caches.match('js/restaurant_info.js'));
      return;
    }
  }

  // if (requestUrl.origin === "https://unpkg.com") {
  //   if (requestUrl.pathname.endsWith === 'leaflet.css') {
  //     // serve css
  //     console.log('css')
  //   }
  //   if (requestUrl.pathname.endsWith === 'leaflet.js') {
  //     // serve css
  //     console.log('js')
  //   }
  // }
});

// possible refactor for general reuse
const serveRestaurantData = (request) => {
  const storageUrl = 'data/restaurants.json';
  return caches.open(cacheName).then(cache => {
    return cache.match(storageUrl).then(response => {
      let networkFetch = fetch(request).then(networkResponse => {
        cache.put(storageUrl, networkResponse.clone());
        return networkResponse;
        return networkResponse;
      });

      return response || networkFetch
    });
  });
};
