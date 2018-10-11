var staticCacheName = 'restaurants-v10';
var contentImgsCache = 'rest-imgs';
var allCaches = [
  staticCacheName,
  contentImgsCache
];

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(staticCacheName).then(function(cache) {
      return cache.addAll([
        './',
		'index.html',
		'restaurant.html',
		'./js/main.js',
        './css/styles.css',
		'./img/1.jpg',
		'./img/2.jpg',
		'./img/3.jpg',
		'./img/4.jpg',
		'./img/5.jpg',
		'./img/6.jpg',
		'./img/7.jpg',
		'./img/8.jpg',
		'./img/9.jpg'
      ]);
    })
  );
});

self.addEventListener('fetch', function(event) {
//console.log(event.request.url);
  var requestUrl = new URL(event.request.url);
  console.log(requestUrl.pathname);
  if (requestUrl.origin === location.origin) {
    if (requestUrl.pathname === '/') {
      event.respondWith(caches.match('/skeleton'));
       return;
    }
    // if (requestUrl.pathname.startsWith('/restaurant.html')) {
      // event.respondWith((event.request));
      // return;
    // }
  }
 
  event.respondWith(
    caches.match(event.request).then(function(response) {
      return response || fetch(event.request);
    })
  );
});

self.addEventListener('activate', function(event) {
	console.log('sw activates');
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.filter(function(cacheName) {
          return cacheName.startsWith('restaurants-') &&
                 !allCaches.includes(cacheName);
        }).map(function(cacheName) {
          return caches.delete(cacheName);
        })
      );
    })
  );
});
