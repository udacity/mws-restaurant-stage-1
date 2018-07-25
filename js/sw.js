var restaurantCacheName = 'restaurant-v1';
var filesToCache=[
  '/',
  '/restaurant.html',
  '/js/main.js',
  '/js/restaurant_info.js',
  '/js/dbhelper.js',
  '/css/styles.css',
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
// to add cache to storage
self.addEventListener('install', function(event) {
  console.log('Attempting to install service worker and cache static assets');
  event.waitUntil(
    caches.open(restaurantCacheName).then(function(cache) {
      return cache.addAll(filesToCache);
    }).catch(function(error){
      console.log(error);
    })
  );
});
//check for new caches and delete the old ones
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.filter(cacheName => {
          return cacheName.startsWith('restaurant-') &&
                 cacheName != restaurantCacheName;
        }).map(cacheName => {
          return caches.delete(cacheName);
        })
      );
    })
  );
});
// to get the stored cache
self.addEventListener('fetch',(event)=>{
  event.respondWith(
    caches.match(event.request).then(response => {
      if(response) {
        return response;
      }
      return fetch(event.request).then(netResponse => {
        if(netResponse.status === 404){
          // console.log(netResponse.status);
          return new NetResponse('Woops');
        }
        return netResponse;
      }).catch(err => {
          console.log('Error:', err);
          return;
      })
  );
});
