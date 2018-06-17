  var urlsToCache = [
    '/',
    'js/dbhelper.js',
    'js/main.js',
    'js/restaurant_info.js',
    'css/styles.css',
    'index.html',
    'restaurant.html'
  ];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open('mws-restaurant-static-v1').then(cache => {
      return cache.addAll(urlsToCache);
    }));
});


self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      if(response){
        return response;
      }
      return fetch(event.response);
    })
  );
});