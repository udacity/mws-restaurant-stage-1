const staticCacheName = 'restaurant-reviews-static-v9';
const restaurantReviewsImgs = 'restaurant-reviews-imgs-v2';
const allCaches = [
  staticCacheName,
  restaurantReviewsImgs
];

self.addEventListener('install', event =>
  event.waitUntil(
    caches.open(staticCacheName).then(cache => {
      return cache.addAll([
        '/',
        'restaurant.html',
        'js/main.js',
        'js/dbhelper.js',
        'js/restaurant_info.js',
        'css/styles.css',
        'data/restaurants.json'
      ]);
    })
  )
);

/**
 * Look for new SW. If I find it, delete it.
 */
self.addEventListener('activate', event =>
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.filter(cacheName =>
          cacheName.startsWith('restaurant-reviews-') &&
          !allCaches.includes(cacheName)
        ).map(cacheName => caches.delete(cacheName))
      );
    })
  )
);

self.addEventListener('fetch', event => {
  const requestUrl = new URL(event.request.url);

  if (requestUrl.origin === location.origin) {
    if (requestUrl.pathname === '/') {
      event.respondWith(caches.match('/'));
      return;
    }

    if (requestUrl.pathname === '/restaurant.html') {
      event.respondWith(caches.match('restaurant.html'));
      return;
    }

    if (requestUrl.pathname.startsWith('/images/')) {
      event.respondWith(serveImages(event.request));
      return;
    }
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});

function serveImages(request) {
  const storageUrl = request.url.replace(/.jpg$/, '');

  return caches.open(restaurantReviewsImgs).then(cache => {
    return cache.match(storageUrl).then(response => {
      return response || fetch(request).then(networkResponse => {
        cache.put(storageUrl, networkResponse.clone());
        return networkResponse;
      });
    });
  });
}
