const staticCacheName = 'resRev-static-v1';
const urlsToCache = [
        '/',
        'css/styles.css',
        'data/restaurants.json',
        'imgr/1.jpg',
        'imgr/2.jpg',
        'imgr/3.jpg',
        'imgr/4.jpg',
        'imgr/5.jpg',
        'imgr/6.jpg',
        'imgr/7.jpg',
        'imgr/8.jpg',
        'imgr/9.jpg',
        'imgr/10.jpg',
        'js/dbhelper.js',
        'js/main.js',
        'js/restaurant_info.js'
    ];



self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(staticCacheName).then(cache => {
    return cache.addAll(urlsToCache);
  }));
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((response) => {
            if (response) return response;
            return fetch(event.request);
        })
    );
})

self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then(cacheNames => {
    return Promise.all(cacheNames.filter(cacheName => { 
      return cacheName.startsWith('resRev-') && cacheName !== staticCacheName;
    })
    .map(cacheName => caches.delete(cacheName))
  );
  }));
});





