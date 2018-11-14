let staticCacheName = 'restaurant-v1';
let contentImgsCache = 'restaurant-content-imgs';
let allCaches = [staticCacheName, contentImgsCache];

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

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(cacheNames => {
    return Promise.all(cacheNames.filter(cacheName => {
      return cacheName.startsWith('restaurant-') && !allCaches.includes(cacheName);
    }).map(cacheName => {
      return caches['delete'](cacheName);
    }));
  }));
});

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

function serveImage(request) {
  var storageUrl = request.url.replace(/-\d+px\.jpg$/, '');

  return caches.open(contentImgsCache).then(cache => {
    return cache.match(storageUrl).then(response => {
      if (response) return response;

      return fetch(request).then(networkResponse => {
        cache.put(storageUrl, networkResponse.clone());
        return networkResponse;
      });
    });
  });
}
