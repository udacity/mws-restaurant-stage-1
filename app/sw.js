const STATIC_CACHE = 'mws-restaurant-v1';
const GLOBAL_CACHE = 'mws-contents';
const PHOTO_CACHE = 'mws-content-imgs';

const staticUrls = [
    '/',
    'restaurant.html',
    'scripts/all_restaurant.js',
    'scripts/all_main.js',
    'styles/main.css'
  ];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then(cache => {
      return cache.addAll(staticUrls);
    }));
});


self.addEventListener('fetch', event => {
  var requestUrl = new URL(event.request.url);

  if (requestUrl.pathname.startsWith('/images')){
    event.respondWith(servePhoto(event.request));
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if(response !== undefined){
          return response;
        }

        return fetch(event.request).then(networkResponse => {

          if(event.request.method !== 'POST'){
            let cachedResponse = networkResponse.clone();
            caches.open(GLOBAL_CACHE).then(cache => 
              cache.put(event.request, cachedResponse));
          }
          return networkResponse;
        });
    })
  );

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
