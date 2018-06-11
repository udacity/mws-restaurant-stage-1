import idb from 'idb';

/** 
 * Separate caches for the jpg images and all the other content 
 */
var CACHE_STATIC = 'restaurant-reviews-static-v1';
var CACHE_IMAGES = 'restaurant-reviews-images-v1';
const offlinePage = './404.html';
var dbPromise;

/** 
 * Fetch and cache image request 
 */
function cacheImages(request) {
  
  // Remove size-related info from image name 
  var urlToFetch = request.url.slice(0, request.url.indexOf('-'));
   
  
  return caches.open(CACHE_IMAGES).then(cache => {  
    return cache.match(urlToFetch).then(response => {
  
      // Cache hit - return response else fetch
      // We clone the request because it's a stream and can be consumed only once
      var networkFetch = fetch(request.clone()).then((networkResponse) => {
        // Check if we received an invalid response
        if(networkResponse.status == 404) return;

        // We clone the response because it's a stream and can be consumed only once
        cache.put(urlToFetch, networkResponse.clone());

        return networkResponse;

      }, (rejected) => {
        return response;
      }).catch(() => {
        return response;
      });

      // //if access to network is good we want the best quality image
      return networkFetch;

    }).catch(() => { 

      return fetch(request.clone()).then((networkResponse) => {
        // Check if we received an invalid response
        if(networkResponse.status == 404) return;

        // We clone the response because it's a stream and can be consumed only once
        cache.put(urlToFetch, networkResponse.clone());

        return networkResponse;

      }, (rejected) => {
        return caches.match(offlinePage); 
      }).catch(() => {
        return caches.match(offlinePage); 
      });
    })
  });
}

/** 
 * Fetch and cache static content and google map related content 
 */
 function cacheStaticContent(request) {
    
  return caches.open(CACHE_STATIC).then(cache => {
    return cache.match(request).then(response => {
    
        // Cache hit - return response else fetch
        // We clone the request because it's a stream and can be consumed only once
      return response || fetch(request.clone()).then(networkResponse => {
        // Check if we received an invalid response
        if(networkResponse.status == 404) return;
    
        // We clone the response because it's a stream and can be consumed only once
        cache.put(request, networkResponse.clone());
        return networkResponse;

      }).catch(() => { 
        return caches.match(offlinePage); 
      })
    });
  });
}

/**
 * Search in indexed DB and if no result fetch from network  ///TODO recheck!!!
 */
function getData(request) {

  var pathSlices = request.url.split("/");
  var restaurantId = parseInt(pathSlices[pathSlices.length - 1]) || 0;

  return fetch(request.clone()).then(networkResponse => {

    if(networkResponse.status == 404) return searchInIDB(request.clone());

    networkResponse.clone().json().then(json => {

      if(!dbPromise) return;

      dbPromise.then(db => {
            
        if(!db) return;

        var tx = db.transaction('restaurants', 'readwrite');
        var store = tx.objectStore('restaurants');

        if(!restaurantId){ // if we refer to all data

          json.forEach(restaurant => {
            store.put(restaurant, restaurant.id);
          });
        
        } else { // if we refer to per restaurant data 
           store.put(json, json.id);
        }
      });
    })

    console.log('Fetched from network');
    return networkResponse;

  }, rejected => {
    return searchInIDB(request.clone());
  }).catch(() => {
    return searchInIDB(request.clone());
  });
}

function searchInIDB(request) {

  var pathSlices = request.clone().url.split("/");
  var restaurantId = parseInt(pathSlices[pathSlices.length - 1]) || 0;
  var dataPromise;

  // if not indexed db functionality
  if(!dbPromise) return;

  return dbPromise.then(db => {
    
    if(!db) return;

    var store = db.transaction('restaurants').objectStore('restaurants');

    if(!restaurantId) { // if all data are requested
      dataPromise = store.getAll();
    } else { // if per restaurant data are requested
      dataPromise = store.get(restaurantId);
    }
    
    if(!dataPromise) return;

    return dataPromise.then(data => {  
    
      // if data found in indexed db return them
      if(JSON.stringify(data) !== JSON.stringify([]) && data !== undefined)  { 

        console.log('Found cached');
        return new Response(JSON.stringify(data)); 
      }
      
    }, rejected => {
      return caches.match(offlinePage); 
    }).catch(() => {
      return caches.match(offlinePage); 
    });
  }).catch(() => {
    return caches.match(offlinePage); 
  });
}

/**
 * Create an indexed db of keyval type named `restaurants`
 */
function createDB() {
  return idb.open('restaurants', 1, upgradeDB => {
    var store = upgradeDB.createObjectStore('restaurants', {
      keypath: 'id'
    });
  });
}

/** 
 * Open caches on install of sw 
 */
self.addEventListener('install', event => {
  // Open cache for static content and cache 404 page

    var openStaticCachePromise = caches.open(CACHE_STATIC).then(cache => {
      cache.addAll([offlinePage]);
      // cache.put('start_url', fetch('/'));
      console.log(`Cache ${CACHE_STATIC} opened`);
    });

    var openImageCachePromise = caches.open(CACHE_IMAGES).then(cache => {
      console.log(`Cache ${CACHE_IMAGES} opened`);
    })

    dbPromise = createDB();

    event.waitUntil(
      Promise.all([openStaticCachePromise, openImageCachePromise])
      .then(() => {
        return self.skipWaiting()
      })
    );
});


/** 
 * Open index db on activate
 */
self.addEventListener('activate', event => {

  dbPromise = createDB();
  event.waitUntil(dbPromise);

});

/** 
 * Handle fetch 
 */
self.addEventListener('fetch', event => {
  // handle request according to its type
  if(event.request.url.endsWith('.jpg')) {
    event.respondWith(cacheImages(event.request));  
    return;
  } else if (event.request.url.includes('restaurants')) {
    event.respondWith(getData(event.request));
    return;
  } else {
    event.respondWith(cacheStaticContent(event.request));
    return;
  }
});