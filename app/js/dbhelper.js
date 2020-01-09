/**  TODO: Create an Indexed Database for restaurant data **/
//if ('indexedDB' in window) {
  const dbPromise = idb.open('Restaurant-DB', 3, (upgradeDB) => {
    switch (upgradeDB.oldVersion) {
      case 0:
        // upgradeDB.createObjectStore('restaurants', { keyPath: 'id' });
        upgradeDB.createObjectStore('restaurants', { keyPath: '_id' });
      case 1:
        upgradeDB.createObjectStore('reviews', { keyPath: '_id', autoIncrement: true });
        //  upgradeDB.createObjectStore('reviews', { keyPath: 'id', autoIncrement: true });
        //  const reviews = upgradeDB.createObjectStore('reviews', { autoIncrement: true });
        //  reviews.createIndex('restaurant_id', 'restaurant_id', { unique: false });
      case 2:
        upgradeDB.createObjectStore('offline-posts', { autoIncrement: true });
    }
  });
//}

//  console.log(dbPromise);

/**
 *  Common database helper functions.
 */
class DBHelper {

  /**
   *  Database URL.
   */
  static get DATABASE_URL() {
  //   const port = 1337 // Change this to your server port
  //   return `http://localhost:${port}`;
    //return `https://chinfox.github.io/mws-restaurant-stage-1/data/restaurants.json`;
    return 'https://restaurantdb-ce94.restdb.io/rest';
  }

    /**
   *  Database Header.
   *  Change this to restaurants.json file location on your server.
   */
  static get DATABASE_HEADERS() {
    return {
      'x-apikey': '<CORS API key>',
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache'
    };
  }

  /**
   *  Fetch all restaurants.   -   From server if restaurants not in Indexed DB
   */
  static fetchRestaurants(callback) {
    //return dbPromise ? DBHelper.getRestaurantsFromIDB(callback) : DBHelper.getRestaurantsFromServer(callback);
    //idbKeyval.getAll('restaurants').then(restaurants => {
      //return restaurants.length ? callback(null, restaurants) : DBHelper.getRestaurantsFromServer(callback);
    //})
    idbKeyval.getAll('restaurants').then(restaurants => {
      if (restaurants.length) {
        callback(null, restaurants);
      } else {
        DBHelper.getRestaurantsFromServer(callback);  
      } 
    });
    //.catch(() => DBHelper.getRestaurantsFromServer(callback));    // fallback for Microsoft Edge
  }

  /**
   * Fetch all reviews.   -   From server if reviews not in Indexed DB
   */
  static fetchReviews(callback) {
    //return dbPromise ? DBHelper.getReviewsFromIDB(callback) : DBHelper.getReviewsFromServer(callback);
    idbKeyval.getAll('reviews').then(reviews => {
      if (reviews.length) {
        callback(null, reviews);
      } else {
        DBHelper.getReviewsFromServer(callback);  
      } 
    });
    //.catch(() => DBHelper.getReviewsFromServer(callback));    // fallback for Microsoft Edge
  }

  /**
   * Fetch a restaurant by its ID.
   */
  static fetchRestaurantById(id, callback) {
    // fetch all restaurants with proper error handling.
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        const restaurant = restaurants.find(r => r._id == id);
        if (restaurant) { // Got the restaurant
          callback(null, restaurant);
        } else { // Restaurant does not exist in the database
          callback('Restaurant does not exist', null);
        }
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine type with proper error handling.
   */
  static fetchRestaurantByCuisine(cuisine, callback) {
    // Fetch all restaurants  with proper error handling
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given cuisine type
        const results = restaurants.filter(r => r.cuisine_type == cuisine);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a neighborhood with proper error handling.
   */
  static fetchRestaurantByNeighborhood(neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given neighborhood
        const results = restaurants.filter(r => r.neighborhood == neighborhood);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */
  static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        let results = restaurants
        if (cuisine != 'all') { // filter by cuisine
          results = results.filter(r => r.cuisine_type == cuisine);
        }
        if (neighborhood != 'all') { // filter by neighborhood
          results = results.filter(r => r.neighborhood == neighborhood);
        }
        callback(null, results);
      }
    });
  }

  /**
   * Fetch all neighborhoods with proper error handling.
   */
  static fetchNeighborhoods(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all neighborhoods from all restaurants
        const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood)
        // Remove duplicates from neighborhoods
        const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i)
        callback(null, uniqueNeighborhoods);
      }
    });
  }

  /**
   * Fetch all cuisines with proper error handling.
   */
  static fetchCuisines(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all cuisines from all restaurants
        const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type)
        // Remove duplicates from cuisines
        const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i)
        callback(null, uniqueCuisines);
      }
    });
  }

  /**
   * Restaurant page URL.
   */
  static urlForRestaurant(restaurant) {
    return (`./restaurant.html?id=${restaurant._id}`);
  }

  /**
   * Restaurant image URL.
   */
  static imageUrlForRestaurant(restaurant) {
    // console.log(restaurant);
    const url = `./images/${restaurant.photograph}`;
    const small = url.replace('.jpg', '-small.jpg');
    const normal = url.replace('.jpg', '-normal.jpg');
    const large = url.replace('.jpg', '-normal_2x.jpg');
    // const url = `./images/${restaurant.id}`;
    // const small = `${url}-small.jpg`;
    // const normal = `${url}-normal.jpg`;
    // const large = `${url}-normal_2x.jpg`;
    return {small: small, normal: normal, large: large};
  }

  /**
   * Map marker for a restaurant.
   */
   static mapMarkerForRestaurant(restaurant, map) {
    // https://leafletjs.com/reference-1.3.0.html#marker  
    const marker = new L.marker([restaurant.latlng.lat, restaurant.latlng.lng],
      {title: restaurant.name,
      alt: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant)
      })
      marker.addTo(newMap);
    return marker;
  }


  /**  Fetch Restaurant data from Server and store a copy of response in IDB  **/
  static getRestaurantsFromServer(callback) {
    let restaurant_URL = `${DBHelper.DATABASE_URL}/restaurants?metafields=true`;

    fetch(restaurant_URL, {
      headers: DBHelper.DATABASE_HEADERS
    })
    .then(response => response.json()).then(restaurants => {
      restaurants.map(restaurant => {
        idbKeyval.set('restaurants', restaurant);
      });
      callback(null, restaurants);
    }).catch(error => callback(error, null));
  }

  /**  Fetch Reviews data from Server and store a copy of response in IDB   **/
  static getReviewsFromServer(callback) {
    let reviews_URL = `${DBHelper.DATABASE_URL}/reviews?metafields=true`;

    fetch(reviews_URL, {
      headers: DBHelper.DATABASE_HEADERS
    })
    .then(response => response.json()).then(reviews => {
      reviews.map(review => {
        idbKeyval.set('reviews', review);
      });
      callback(null, reviews);
    }).catch(error => callback(error, null));
  }
 
  /**  Fetch data from Server  **/
 /* static getFromServer(data, store, callback) {
    let restaurant_URL = `${DBHelper.DATABASE_URL}/${data}/`;
    fetch(restaurant_URL)
    .then(response => response.json()).then(restaurants => {
      restaurants.map(restaurant => {
        idbKeyval.set(store, restaurant, restaurant.id);
      });
      callback(null, restaurants);
    }).catch(error => callback(error, null));
  }*/

  /**  Fetch data from IDB   **/
  /*static getFromIDB(store, data, callback) {
    idbKeyval.getAll(store).then(data => {
      callback(null, restaurants);
    });
  }*/

  /*
  static getReviewsById(id, callback) {
    let reviews_URL = `${DBHelper.DATABASE_URL}/reviews/?restaurant_id=${id}`;
    fetch(reviews_URL).then(response => response.json())
    .then(reviews => {
      reviews.map(review => {
        idbKeyval.set('reviews', review);
      });
      callback(null, reviews);
    }).catch(error => callback(error, null));
  }*/
  
  /** Resend Posts made while offline **/
  static postOfflineData() {
    dbPromise.then(db => {
      if (!db) return;
      const tx = db.transaction('offline-posts', 'readwrite');
      const store = tx.objectStore('offline-posts');
      return store.openCursor();
    })
    .then(function postData (cursor) {
      if (!cursor) {
        return;
      }
      console.log('cursor is at: ', cursor.key);

      const offline_id = cursor.key;
      const url = cursor.value.url;
      const headers = cursor.value.headers;
      const method = cursor.value.method;
      const data = cursor.value.data;
      const flag = cursor.value.flag;
      const body = JSON.stringify(data);

      // Update Server with posts made while offline
      // then update the IndexedDB with data returned from server      
      fetch(url, {
        headers: headers,
        method: method,
        body: body
      })
      .then(response => response.json())
      .then(data => {
        console.log('Data from Server', data);

        // Check if updated data is a review or favorite
        if (flag === 'fav') {
          console.log('Favorite sent to server... IDB updated');
        } else {
            // Update IDB reviews store and delete old review data 
            dbPromise.then(db => {
              const tx = db.transaction('reviews', 'readwrite');
              const store = tx.objectStore('reviews');
              store.put(data)
              return tx.complete;
              })
            .then(() => console.log('Review sent to server.. IDB updated'))
            .catch(err => {
              tx.abort();
              console.log('Transaction error', err);
            });
        }
      })
      .then(() => {
        // Delete the http request from offline-posts store
        dbPromise.then(db => {
        const tx = db.transaction('offline-posts', 'readwrite');
        const store = tx.objectStore('offline-posts');
        store.delete(offline_id);
        return tx.complete;
        });
      })
      .then(() => {
        if (flag === 'fav') {
          return;
        }
        // Delete the offline review from the reviews store
        dbPromise.then(db => {
        const tx = db.transaction('reviews', 'readwrite');
        const store = tx.objectStore('reviews');
        store.delete(flag);
        return tx.complete;
        });
      })
      .catch(err => {
        console.log('Failed connection', err);
        return;
      });
      return cursor.continue().then(postData);
    })
    .then(() => console.log('Cursor Done!'))
    .catch(err => console.log('Could not open cursor', err)); 
  }

  /**  Temporarily update review in IDB store and return its ID, if offline **/
  static updateReviewsOffline(val) {
    return idbKeyval.setData(val);
  }

  // Update review in IDB with data returned from Server
  static updateReviewsOnline(val) {
    return idbKeyval.set('reviews', val);
  }

  /**  Save requests made when offline or if fetch fails  **/
  static saveOfflinePost(url, headers, method, data, flag) {
    const request = {
      url: url,
      headers: headers,
      method: method,
      data: data,
      flag: flag
    };
    return idbKeyval.set('offline-posts', request);
  }

  /**  Mark a restaurant as a favorite  **/
  static setFavorite(restaurant, status) {
    // const id = +restaurant.id;
    // const url = `${DBHelper.DATABASE_URL}/restaurants/${id}/?is_favorite=${status}`;
    const url = `${DBHelper.DATABASE_URL}/restaurants/${restaurant._id}`;
    const method = 'PATCH';
    const headers = DBHelper.DATABASE_HEADERS;
    const data = { "is_favorite": status };
    const body = JSON.stringify(data);
    // restaurant.is_favorite =  JSON.stringify(status);
    //restaurant.is_favorite = `"${status}"`;
    restaurant.is_favorite = status;

    fetch(url, {
      method: method,
      headers: headers,
      body: body
    }).then(response => response.json())
    .then(data => idbKeyval.set('restaurants', data))
    .catch(err => {
      // console.log(err);
      idbKeyval.set('restaurants', restaurant);
      DBHelper.saveOfflinePost(url, headers, method, data, 'fav');
    });
  }
  /*
  static addFav(id) {
    let trueFav = `${DBHelper.DATABASE_URL}/restaurants/${id}/?is_favorite=true`;
    fetch(trueFav, {
      method: 'PUT'
    }).catch(err => console.log(err));
  }
  
  static removeFav(id) {
    let falseFav = `${DBHelper.DATABASE_URL}/restaurants/${id}/?is_favorite=false`;
    fetch(falseFav, {
      method: 'PUT'
    }).catch(err => console.log(err));
  }*/
}


  // Source: idb by Jake Archibald - https://www.npmjs.com/package/idb

  const idbKeyval = {
    get(key, store) {
      return dbPromise.then(db => {
        if(!db) return;
        return db.transaction(store)
          .objectStore(store).get(key);
      });
    },
    getAll(store) {
      return dbPromise.then(db => {
        if(!db) return;
        return db.transaction(store)
          .objectStore(store).getAll();
      });
    },
    set(store, val) {
      return dbPromise.then(db => {
        if(!db) return;
        const tx = db.transaction(store, 'readwrite');
        tx.objectStore(store).put(val);
        return tx.complete;
      });
    },
    /**  Save review to IDB store and return id **/
    setData(val) {
      return dbPromise.then(db => {
        if(!db) return;
        const tx = db.transaction('reviews', 'readwrite');
        const dbStore = tx.objectStore('reviews').put(val);
        tx.complete;
        return dbStore;
      });
    },
    delete(key, store) {
      return dbPromise.then(db => {
        if(!db) return;
        const tx = db.transaction('store', 'readwrite');
        tx.objectStore('store').delete(key);
        return tx.complete;
      });
    }
  };