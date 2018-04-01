/** 
 * Separate caches for the jpg images and all the other content 
 */
var CACHE_STATIC = 'restaurant-reviews-static-v1';
var CACHE_IMAGES = 'restaurant-reviews-images-v1';

/** 
 * Open caches on install of sw 
 */
self.addEventListener('install', event => {
  // Open cache for static content
  event.waitUntil(
    caches.open(CACHE_STATIC).then(
	  cache => {
	    console.log(`Cache ${CACHE_STATIC} opened`);
	  }
	)
  );
   // Open cache for images content
  event.waitUntil(
    caches.open(CACHE_IMAGES).then(
	  cache => {
	    console.log(`Cache ${CACHE_IMAGES} opened`);
	  }
	)
  );
});

/** 
 * Handle fetch 
 */
self.addEventListener('fetch', event => {
  // handle request according to its type
  if(event.request.url.endsWith('.jpg')) {
	event.respondWith(cacheImages(event.request));  
	return;
  } else {
	event.respondWith(cacheStaticContent(event.request));
	return;
  }
});

/** 
 * Fetch and cache image request 
 */
function cacheImages(request) {
	
  // Remove size-related info from image name	
  var urlToFetch = request.url.slice(0, request.url.indexOf('-'));
	
  return caches.open(CACHE_IMAGES).then(
    
	cache => {  
      return cache.match(urlToFetch)
        .then(response => {
		 
          // Cache hit - return response else fetch
	      // We clone the request because it's a stream and can be consumed only once
	      var networkFetch = fetch(request.clone()).then(
		
            networkResponse => {
              // Check if we received an invalid response
              if(networkResponse.status == 404) return;
           
              // We clone the response because it's a stream and can be consumed only once
		      cache.put(urlToFetch, networkResponse.clone());
			
              return networkResponse;
            } 
          );
		
	      //if access to network is good we want the best quality image
	      return networkFetch || response;
        })
    })
}

/** 
 * Fetch and cache static content and google map related content 
 */
function cacheStaticContent(request) {
    
  return caches.open(CACHE_STATIC).then(
	  
	  cache => {
	    return cache.match(request)
          .then(response => {
		  
            // Cache hit - return response else fetch
 	        // We clone the request because it's a stream and can be consumed only once
	        return response || fetch(request.clone()).then(
		
              networkResponse => {
                // Check if we received an invalid response
                if(networkResponse.status == 404) return;
            
                // We clone the response because it's a stream and can be consumed only once
			    cache.put(request, networkResponse.clone());
			
		        return networkResponse;
		    });
        })
    })
}