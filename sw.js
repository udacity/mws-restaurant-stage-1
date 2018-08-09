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
            ]);
        })
    );
});

self.addEventListener('fetch', function(event){
  
    event.respondWith(
        caches.match(event.request).then(function(response) {
          return response || fetch(event.request);
        })
      );

    
})