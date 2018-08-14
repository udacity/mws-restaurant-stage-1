var staticCachName = 'restaurant-v3';

const BLACKLIST =[
    '/?restaurant_id=*',
    '/restaurants',
    '/reviews',
    'images/*'
] 
self.addEventListener('fetch', function(event) {
    event.respondWith(
        caches.match(event.request).then(function(response) {
          if (response) {
             return response;
          }
  
          return fetch(event.request).then(function(response) {
            var shouldCache = response.ok;
  
            for (var i = 0; i < BLACKLIST.length; ++i) {
              var b = new RegExp(BLACKLIST[i]);
              if (b.test(event.request.url)) {
                shouldCache = false;
                break;
              }
            }
  
            if (event.request.method == 'POST') {
              shouldCache = false;
            }
  
            if (shouldCache) {
              return caches.open(staticCachName).then(function(cache) {
                cache.put(event.request, response.clone());
                return response;
              });
            } else {
              return response;
            }
          });
        })
    );
  });
  
  

