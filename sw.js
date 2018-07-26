var staticCacheName='mws-restaurant-v1';
// Service worker install built upon code used for Wittr project
self.addEventListener('install', function(event) {
  console.log('install');
  event.waitUntil(
    caches.open(staticCacheName).then(function(cache) {
      console.log('caching all');
      return cache.addAll([
        '/index.html',
        '/restaurant.html',
        'data/restaurants.json',
        'js/main.js',
        'js/dbhelper.js',
        'js/register.js',
        'js/restaurant_info.js',
        'css/styles.css'
      ]);
    })
  );
});
//Fetch code build upon code from Wittr project
self.addEventListener('fetch', function(event) {
  var requestUrl = new URL(event.request.url);
// for now do simple cache of all requests 
console.log('in fetch for ',requestUrl);
  event.respondWith(
    caches.match(event.request).then(function(response) {
      console.log('in match');  //,response);
      return response || fetch(event.request);
    }).catch(function(e) {
      console.log('fetch promise failed for ',e);
    })
  );
});
