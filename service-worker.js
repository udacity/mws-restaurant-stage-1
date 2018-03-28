(function () {
  'use strict';

  const cacheName = "restaurents-v0"
  const filesToCache = [
    '/',
    '/index.html',
    '/restaurant.html',

    '/css/styles.css',
    '/css/overrides.css',

    '/js/dbhelper.js',
    '/js/main.js',
    '/js/restaurant_info.js',

    '/data/restaurants.json',

    '/img/1.jpg',
    '/img/2.jpg',
    '/img/3.jpg',
    '/img/4.jpg',
    '/img/5.jpg',
    '/img/6.jpg',
    '/img/7.jpg',
    '/img/8.jpg',
    '/img/9.jpg',
    '/img/10.jpg'
  ];

  self.addEventListener('install', function (event) {
    event.waitUntil(
      caches.open(cacheName).then(function (cache) {
        return cache.addAll(filesToCache);
      })
    );
  });

  self.addEventListener('activate', function (event) {
    var cacheWhitelist = [cacheName];

    event.waitUntil(
      caches.keys().then(function (cacheNames) {
        return Promise.all(
          cacheNames.map(function (cacheName) {
            if (cacheWhitelist.indexOf(cacheName) === -1) {
              return caches.delete(cacheName);
            }
          })
        );
      })
    );
  });

  self.addEventListener('fetch', function (event) {
    console.log('Fetch event for ', event.request.url);
    event.respondWith(
      caches.match(event.request).then(function (response) {
        if (response) {
          return response;
        }

        return fetch(event.request)
          .then(function (response) {
            if (!response || response.status !== 200) {
              return response;
            }

            return caches.open(cacheName).then(function (cache) {
              cache.put(event.request.url, response.clone());
              return response;
            });
          });

      }).catch(function (error) {
        console.log('Error, ', error);
        // Respond with custom offline page
      })
    );
  });

})();