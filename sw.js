const cacheName = 'mws-restautrant-cache-v3',
  filesToCache = [
    '/',
    '/index.html',
    '/restaurant.html',
    '/css/styles.css',
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
    '/img/10.jpg',
    '/js/dbhelper.js',
    '/js/register.js',
    '/js/main.js',
    '/js/restaurant_info.js'
  ];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(cacheName).then(cache => {
      return cache.addAll(filesToCache);
    })
      .then(() => {
        return self.skipWaiting();
      })
      .catch(
        error => {
          console.log('Cache failed: ')
          console.log(error)
        })
  );
});

self.addEventListener('activate', event => {
  console.log("Activating ...", event);
  event.waitUntil(
    caches.keys().then(keyList => {
      return Promise.all(
        keyList.filter(key => {
          return key.startsWith('mws-') && key != cacheName;
        }).map(keyList => {
          return caches.delete(keyList);
        })
      )
    })
  )
  return self.clients.claim();
});


self.addEventListener('fetch', event => {
  console.log("Fetching cache ...", event);
  event.respondWith(
    caches.match(event.request).then(response => {
      if (response) return response;
      return fetch(event.request)
        .then(networkResponse => {
          if (networkResponse === 404) return;
          return caches.open(cacheName)
            .then(cache => {
              cache.put(event.request.url, networkResponse.clone());
              return networkResponse;
            })
        })
    })
      .catch(error => {
        console.log('Error in the fetch event: ', error);
        return;
      })
  )
});

