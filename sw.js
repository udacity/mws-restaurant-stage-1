var staticCacheName = 'restaurants-v18';
var contentImgsCache = 'restaurants-imgs';
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
		    './js/idb.js',
        './js/dbhelper.js',
        './js/newReviewModal.js',
        './js/restaurant_info.js',
        './css/styles.css',
        './js/leaflet.min.js',
        './css/images/marker-icon.png',
        './css/images/marker-shadow.png',
        './css/leaflet.min.css'
      ]);
    })
  );
});

self.addEventListener('fetch', function(event) {
  var requestUrl = new URL(event.request.url);
 // console.log(requestUrl.pathname + " from sw");
  if (requestUrl.origin === location.origin) {
    if (requestUrl.pathname === '/') {
      event.respondWith(caches.match('/skeleton'));
       return;
    }
     if (requestUrl.pathname.startsWith('/img/')) {
       event.respondWith(serveImages(event.request));
       return;
     }
  }

    
  if(requestUrl.pathname.startsWith('/restaurant') && requestUrl.method == "POST"){
      // event.respondWith(fetchRestaurantsFromLocalDatabase());
      event.respondWith(serveRestaurant(event.request));
      return;
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


serveImages = (request) => {
  const url = new URL(request.url);
  return caches.open(contentImgsCache).then(cache => {
    return cache.match(url).then(response => {
      return (
        response ||
        fetch(url, {
          method: "GET", 
          // mode: "cors", 
          cache: "default",
          credentials: "same-origin",
          headers: {
              // "Content-Type": "charset=utf-8",
               "Cache-Control": "max-age=86400"
          },
          redirect: "follow",
          referrer: "no-referrer"
      }).then(networkResp => {
          cache.put(url, networkResp.clone());
          return networkResp;
        })
      );
    });
  });
};


serveRestaurant = (request) => {
    const url = new URL(request.url);
   return caches.open(staticCacheName).then(cache => {
    return cache.match(url.pathname).then(response => {
     return (response ||
      fetch(url).then(networkResp => {
        cache.put(url, networkResp.clone());
        return networkResp;
       })
     );
   });
  });
};
