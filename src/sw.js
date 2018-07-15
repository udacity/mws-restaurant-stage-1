import idb from 'idb';

/** 
 * Separate caches for the jpg images and all the other content 
 */
var CACHE_STATIC = 'restaurant-reviews-static-v1';
var CACHE_IMAGES = 'restaurant-reviews-images-v1';
const offlinePage = './404.html';
var dbPromise;
var reviewsDbPromise;
var reviewsDbTempPromise;
var reviewFormData;


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
 * Fetches from network and puts in indexed db latest data
 */
function getLatestData(request) {

  var pathSlices = request.url.split("/");
  var restaurantId = parseInt(pathSlices[pathSlices.length - 1]) || 0;

  return fetch(request.clone()).then(networkResponse => {

    if(networkResponse.status == 404) return;

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
    });

    return networkResponse;

  }).catch(() => {
    return caches.match(offlinePage); 
  });
}

/**
 * Searches the indexed db for data and if nothing found tries the nework
 */
function searchInIDB(request) {

  var pathSlices = request.clone().url.split("/");
  var restaurantId = parseInt(pathSlices[pathSlices.length - 1]) || 0;
  var dataPromise;

  // if not indexed db functionality
  if(!dbPromise) return getLatestData(request.clone());

  return dbPromise.then(db => {
    
    if(!db) return getLatestData(request.clone());

    var store = db.transaction('restaurants').objectStore('restaurants');

    if(!restaurantId) { // if all data are requested
      dataPromise = store.getAll();
    } else { // if per restaurant data are requested
      dataPromise = store.get(restaurantId);
    }
    
    if(!dataPromise) return getLatestData(request.clone());

    return dataPromise.then(data => {  

      var networkFetch = getLatestData(request.clone());

      // if data found in indexed db return them
      if(JSON.stringify(data) !== JSON.stringify([]) && data !== undefined)  { 

        console.log('Found cached');
        return new Response(JSON.stringify(data)); 
      }

      return networkFetch;
    });
  }).catch(() => {
    return caches.match(offlinePage); 
  });
}

/**
 * Fetches from network and puts in indexed db the latest reviews
 */
function getLatestReviews(request) {
  
  return fetch(request.clone()).then(networkResponse => {

    if(networkResponse.status == 404) return;

    networkResponse.clone().json().then(json => {

      if(!reviewsDbPromise) return;

      reviewsDbPromise.then(db => {
            
        if(!db) return;

        var tx = db.transaction('restaurant-reviews', 'readwrite');
        var store = tx.objectStore('restaurant-reviews');

        json.forEach(review => {
          store.put(review, review.id);
        });
      });
    });

    return networkResponse;

  }).catch(() => {
    return caches.match(offlinePage); 
  });
}

/**
 * Searches the indexed db for reviews and if nothing found tries the nework
 */
function searchIDBForReviews(request) {

  var pathSlices = request.clone().url.split("restaurant_id=");
  var restaurantId = parseInt(pathSlices[pathSlices.length - 1]) || 0;

  // if not indexed db functionality
  if(!reviewsDbPromise) return getLatestReviews(request.clone());

  return reviewsDbPromise.then(db => {
    
    if(!db) return getLatestReviews(request.clone());

    var store = db.transaction('restaurant-reviews').objectStore('restaurant-reviews');
    var index = store.index('by-restaurant');
  
    return index.getAll([restaurantId,`${restaurantId}`]).then(data => {  

      var networkFetch = getLatestReviews(request.clone());

      // if data found in indexed db return them
      if(JSON.stringify(data) !== JSON.stringify([]) && data !== undefined)  { 

        console.log('Found cached');
        return new Response(JSON.stringify(data)); 
      }

      return networkFetch;
    });

  }).catch(() => {
    return caches.match(offlinePage); 
  });
}


function findTempReview(review_id) {

  return new Promise((resolve, reject) => {

    if(!reviewsDbTempPromise) return;

    return reviewsDbTempPromise.then(db => {
              
      if(!db) return;
  
      var tx = db.transaction('restaurant-reviews-temp', 'readwrite');
      var store = tx.objectStore('restaurant-reviews-temp');
  
      return store.get(review_id).then(tempReview => {
        
        return sendToServer(tempReview)
        .then((networkResponse) => {
          console.log(networkResponse);
          
          store.delete(data.createdAt);
      
          resolve();
      
          return networkResponse;
      
        }).catch(error => {
          console.log('No connection!');
        });
      });
    });
  });
  
}

function sendToServer(data) {

  return fetch(data.url, {
    headers: {

      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8",
      "Connection": "keep-alive",
      "Content-Length": `${serializeObject(data.formData).length}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    method: data.method,
    body: serializeObject(data.formData),

  });
}

function saveReviewInTempDB(data) {
  
  if(!reviewsDbTempPromise) return;

  return reviewsDbTempPromise.then(db => {
            
    if(!db) return;

    var tx = db.transaction('restaurant-reviews-temp', 'readwrite');
    var store = tx.objectStore('restaurant-reviews-temp');

    store.put(data, data.createdAt);

    return data;

  });
}

function markFavorite(restaurant_id) {
    
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
 * Create an indexed db of keyval type named `restaurant-reviews`
 */
function createReviewDB() {
  return idb.open('restaurant-reviews', 1, upgradeDB => {
    var store = upgradeDB.createObjectStore('restaurant-reviews', {
      keypath: 'id'
    });

    store.createIndex('by-restaurant', 'restaurant_id');
    store.createIndex('by-date', 'createdAt');
  });
}

/**
 * Create an indexed db of keyval type named `restaurant-reviews`
 */
function createTempReviewDB() {
  return idb.open('restaurant-reviews-temp', 1, upgradeDB => {
    var store = upgradeDB.createObjectStore('restaurant-reviews-temp', {
      keypath: 'createdAt'
    });
  });
}

//============================================================ EVENTS

/** 
 * Open caches on install of sw 
 */
self.addEventListener('install', event => {
  // Open cache for static content and cache 404 page

    var openStaticCachePromise = caches.open(CACHE_STATIC).then(cache => {
      cache.addAll([offlinePage]);
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
  reviewsDbPromise = createReviewDB();
  reviewsDbTempPromise = createTempReviewDB();
  event.waitUntil(dbPromise);
  event.waitUntil(reviewsDbPromise);
  event.waitUntil(reviewsDbTempPromise);

});

/** 
 * Handle fetch event
 */
self.addEventListener('fetch', event => {

  // handle request according to its type

  if(event.request.method === 'GET') {

    if(event.request.url.endsWith('.jpg')) {
      event.respondWith(cacheImages(event.request));  
      return;
    } else if (event.request.url.includes('reviews')) {
      event.respondWith(searchIDBForReviews(event.request));
      return;
    } else if (event.request.url.includes('restaurants')) {
      event.respondWith(searchInIDB(event.request));
      return;
    } else {
      event.respondWith(cacheStaticContent(event.request));
      return;
    }
  }  
});

self.addEventListener('message', event => {

  if(event.data.type === 'new-review') {

    event.data.createdAt = Date.parse(new Date());

    return saveReviewInTempDB(event.data).then((jsonSaved)=>{

      reviewFormData = jsonSaved;
      self.registration.sync.register('submit-review-'+ event.data.createdAt);
    });
  }

  
});

self.addEventListener('sync', event => {

  if (event.tag.startsWith('submit-review')) {

    var taglices = event.tag.split("submit-review-");
    var review_id = parseInt(taglices[taglices.length - 1]) || 0;
    event.waitUntil(findTempReview(review_id));
  }

  if (event.tag == 'mark-favorite') {
    event.waitUntil(markFavorite(restaurant_id));
  }
  
});

function serializeObject(params) {

  return Object.keys(params).map(key => key + '=' + params[key]).join('&');
}
