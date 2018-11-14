/* Help from https://developers.google.com/web/fundamentals/primers/service-workers/lifecycle
  on how to use a service worker's lifecycle to cache important content 
  and serve it when it's requested */

let staticCacheName = 'restaurant-v1';
let imagesCache = 'restaurant-content-imgs';
let allCaches = [staticCacheName, imagesCache];

// Determine pages to cache
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(staticCacheName)
    .then(cache => {
      return cache.addAll([
        '/',
        '/index.html',
        '/restaurant.html',
        'data/restaurants.json',
        'css/styles.css',
        'js/',
        'js/dbhelper.js',
        'js/main.js',
        'js/restaurant_info.js',
        'js/register.js',
      ])
      .catch(error => {
        console.log(`Cache failed to open ${error}.`);
      });
    }));
});

// Delete old caches that aren't being used anymore
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(cacheNames => {
    return Promise.all(cacheNames.filter(cacheName => {
      return cacheName.startsWith('restaurant-') && !allCaches.includes(cacheName);
    }).map(cacheName => {
      return caches['delete'](cacheName);
    }));
  }));
});

// Tell the cache what to respond with
self.addEventListener('fetch', event => {
  var requestUrl = new URL(event.request.url);

  if (requestUrl.origin === location.origin) {
    if (requestUrl.pathname === '/') {
      event.respondWith(caches.match('/index.html'));
      return;
    }
    if (requestUrl.pathname.startsWith('/images/')) {
      event.respondWith(serveImage(event.request));
      return;
    }
  }

  event.respondWith(caches.match(event.request).then(response => {
    return response || fetch(event.request);
  }));
});

// Serve any cached requested images
function serveImage(request) {
  var storageUrl = request.url.replace(/-\d+px\.jpg$/, '');

  return caches.open(imagesCache).then(cache => {
    return cache.match(storageUrl).then(response => {
      if (response) return response;

      return fetch(request).then(networkResponse => {
        cache.put(storageUrl, networkResponse.clone());
        return networkResponse;
      });
    });
  });
}
