var CACHE_STATIC = 'restaurant-reviews-static-v1';
var CACHE_IMAGES = 'restaurant-reviews-images-v1';

self.addEventListener('activate', event => {
  // Open cache
  event.waitUntil(
    caches.open(CACHE_STATIC).then(
		cache => {
			console.log(`Cache ${CACHE_STATIC} opened`);
		}
	)
  );
  
  event.waitUntil(
    caches.open(CACHE_IMAGES).then(
		cache => {
			console.log(`Cache ${CACHE_IMAGES} opened`);
		}
	)
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
		  
        // Cache hit - return response else fetch
		// We clone the request because it's a stream and can be consumed only once
       
		return response || fetch(event.request.clone()).then(
		
          response => {
			  
            // Check if we received a valid response
            if(!response || response.status !== 200 || response.type !== 'basic')  return response;
            
             // We clone the response because it's a stream and can be consumed only once
            var responseToCache = response.clone();
			
			if(responseToCache.url.endsWith('.jpg')) {
				
				caches.open(CACHE_IMAGES)
				  .then(cache => {
					cache.put(event.request.url.replace('.jpg',''), responseToCache);
				  }
				);
				
			} else {
				
				caches.open(CACHE_STATIC)
				  .then(cache => {
					cache.put(event.request, responseToCache);
				  }
				);
			}
			
            return response;
          }
        );
      })
    );
});