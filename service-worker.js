/*
The service worker file. Here we will intercept network requests and pull data from the cache if allready there
*/
(function() {
    'use strict';
    
    const staticCacheName='restaurant-static-v1';
    const ImgsCache='restaurant-imgs';
    var CachesAll=[staticCacheName,ImgsCache];

   
    self.addEventListener('install', function (event) {
            event.waitUntil(caches.open(staticCacheName).then(function (cache) {
               return cache.addAll(['/','index.html','restaurant.html','js/dbhelper.js','js/main.js','js/restaurant_info.js','css/styles.css','data/restaurants.json']);
               //return cache.addAll(['js/dbhelper.js','js/main.js','js/restaurant_info.js','css/styles.css','data/restaurants.json']);
            }));
    });

    self.addEventListener('activate', function(event) {
        event.waitUntil(caches.keys().then(function (cacheNames) {
            return Promise.all(cacheNames.filter(function (cacheName) {
              return cacheName.startsWith('restaurant-') && !CachesAll.includes(cacheName);
            }).map(function (cacheName) {
              return caches['delete'](cacheName);
            }));
        }));
    });
  
      
    self.addEventListener('fetch', function(event) {
        //console.log(event.request.url);
        var requestUrl = new URL(event.request.url);
        console.log('geo|| '+event.request.url);
        if (requestUrl.origin === location.origin) {


          
           if (event.request.url.includes('restaurant.html?id=')) {
              event.respondWith(serveDynamicUrl(event.request));
              return;
            }


            if (requestUrl.pathname.startsWith('/img/')) {
              event.respondWith(serveImage(event.request));
              return;
            }
        
           
          }
        
          event.respondWith(caches.match(event.request).then(function (response) {
            return response || fetch(event.request);
          }));
    });

    function serveDynamicUrl(request) {
      let storageUrl = request.url;

      let strippedurl=storageUrl.split('?')[0];
    
      return caches.open(staticCacheName).then(function (cache) {
        return cache.match(strippedurl).then(function (response) {
          if (response) return response;
    
          return fetch(request).then(function (networkResponse) {
            cache.put(storageUrl, networkResponse.clone());
            return networkResponse;
          });
        });
      });
    }



    function serveImage(request) {
        let storageUrl = request.url;
      
        return caches.open(ImgsCache).then(function (cache) {
          return cache.match(storageUrl).then(function (response) {
            if (response) return response;
      
            return fetch(request).then(function (networkResponse) {
              cache.put(storageUrl, networkResponse.clone());
              return networkResponse;
            });
          });
        });
      }








  
  })();
  