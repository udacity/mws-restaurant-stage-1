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
              caches.open(ImgsCache).then(function (cacheimg){
                //we add noimage.jpg by default in case a restaurant is not visited
                return cacheimg.addAll(['img/noimage.jpg','img/small/noimage.jpg','icons/favorite.png','icons/notfavorite.png']);
              }).then(() => {
                return cache.addAll(['/','index.html','restaurant.html','js/idb.js','js/dbhelper.js','js/main.js','js/restaurant_info.js','css/styles.css']);
              })
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
        var requestUrl = new URL(event.request.url);
        if (requestUrl.origin === location.origin) {
          /*
          The restaurant details url is dynamic
          */
           if (event.request.url.includes('restaurant.html?id=')) {
              event.respondWith(serveDynamicUrl(event.request));
              return;
            }

             /*
          If request is an image
          */
            if (requestUrl.pathname.startsWith('/img/') || requestUrl.pathname.startsWith('/icons/')) {
              event.respondWith(serveImage(event.request));
              return;
            }


          }



          event.respondWith(caches.match(event.request).then(function (response) {
            return response || fetch(event.request);
          }));
    });

    function serveDynamicUrl(request) {
      const storageUrl = request.url;

       /*
          We remove the ?id=... part so as to not recache restaurant.html every time a restaurant is called with a different id
          */
      const strippedurl=storageUrl.split('?')[0];

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
        return caches.open(ImgsCache).then(function (cache) {//first check if image is cache
          return cache.match(storageUrl).then(function (response) {
            if (response) return response;

            return fetch(request).then(function (networkResponse) {//if not in cache fetch
                cache.put(storageUrl, networkResponse.clone());
                return networkResponse;
            }).catch(err => {
                //if fetch fails(probably offline) then get default noimage.jpg from cache
              return cache.match(`${storageUrl.substring(0, storageUrl.lastIndexOf("/") + 1)}noimage.jpg`).then(function (response) {
                 return response;
              });

            });
          });
        });
      }



  })();
