self.addEventListener('install', function(event){
    event.waitUntil(
        caches.open('restraunt-static-v3').then(function(cache){
            return cache.addAll([
                '/',
                '/css/styles.css',
                '/js/main.js',
                '/js/restaurant_info.js',
                '/restaurant.html',
                'https://unpkg.com/leaflet@1.3.1/dist/leaflet.js',
                'js/dbhelper.js',
                'js/main.js',
                'manifest.json'
            ]);
        })
    );
});

self.addEventListener('fetch', function(event){
    var requestUrl = new URL(event.request.url);

    if(requestUrl.pathname.startsWith('/img/')){
        event.respondWith(servePhoto(event.request));
        return;
    }
    
    event.respondWith(
        caches.match(event.request).then(function(response) {
          return response || fetch(event.request);
        })
      );
    
});

function servePhoto(request) {
    let storageUrl = request.url.replace(/\-.*/,'');
    return caches.open('restraunt-images').then(function(cache){
        return cache.match(storageUrl).then(function(response){
            if(response) return response;

            return fetch(request).then(function(networkResponse){
                cache.put(storageUrl,networkResponse.clone());
                return networkResponse;
            });
        });
    });
}