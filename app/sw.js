const GLOBAL_CACHE = 'mws-restaurant-v1';
const PHOTO_CACHE = 'mws-content-imgs';

var urlsToCache = [
    '/',
    'scripts/dbhelper.js',
    'scripts/main.js',
    'scripts/restaurant_info.js',
    'styles/styles.css',
    'restaurant.html'
  ];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(GLOBAL_CACHE).then(cache => {
      return cache.addAll(urlsToCache);
    }));
});


self.addEventListener('fetch', event => {
  var requestUrl = new URL(event.request.url);

  if (requestUrl.pathname.startsWith('/images')){
    event.respondWith(servePhoto(event.request));
    return;
  }

  event.respondWith(caches.open(GLOBAL_CACHE).then(cache => {
    return cache.match(event.request).then(response => {
      if(response !== undefined){
        return response;
      }

      return fetch(event.request).then(networkResponse => {
        cache.put(event.request, networkResponse.clone());
        return networkResponse;
      });
    });
  }));


});

function servePhoto(request){

  var storageUrl = request.url.replace(/-\d+px\.jpg$/, '');

  return caches.open(PHOTO_CACHE).then(cache => {
    return cache.match(storageUrl).then(response => {
      if(response){
        return response;
      }

      return fetch(request).then(networkResponse => {
        cache.put(storageUrl, networkResponse.clone());
        return networkResponse;
      });
    });
  });
}
