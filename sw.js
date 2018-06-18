  var urlsToCache = [
    '/',
    'js/dbhelper.js',
    'js/main.js',
    'js/restaurant_info.js',
    'css/styles.css',
    'index.html',
    'restaurant.html',
    'data/restaurants.json'  
  ];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open('mws-restaurant-static-v1').then(cache => {
      return cache.addAll(urlsToCache);
    }));
});


self.addEventListener('fetch', event => {
  var requestUrl = new URL(event.request.url);

  if (requestUrl.pathname.startsWith('/img')){
    event.respondWith(servePhoto(event.request));
    return;
  }


  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.response);
    })
  );
});

function servePhoto(request){

  var storageUrl = request.url.replace(/-\d+px\.jpg$/, '');

  return caches.open('mws-content-imgs').then(cache => {
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