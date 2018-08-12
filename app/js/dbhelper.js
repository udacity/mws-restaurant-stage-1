/**
 * Common database helper functions.
 */
class DBHelper {

  /**
   * Database URL.
   * Change this to restaurants.json file location on your server.
   */
  static dbPromise() { 
    return idb.open('udacity-restaurant', 2, upgradeDB => {
    switch (upgradeDB.oldVersion) {
      case 0 :
        upgradeDB.createObjectStore('restaurants', {keyPath: 'id'});
      case 1 :
        const reviewsStore = upgradeDB.createObjectStore('reviews', {keyPath:'id'});
        reviewsStore.createIndex('restaurant', 'restaurant_id');
    }
  });
  }
  static get DATABASE_URL() {
    const port = 1337; // Change this to your server port
    return [`http://localhost:${port}/restaurants`,`http://localhost:${port}/reviews`];
  }

  /**
   * Fetch all restaurants.
   */
  static fetchRestaurants(callback, id) {
    let fetchURL;
    if (!id) {
      fetchURL = DBHelper.DATABASE_URL[0];
    } else {
        fetchURL = DBHelper.DATABASE_URL[0] + '/' + id;
    }
    fetch(fetchURL,{method: 'GET'})
    .then(response => {
        response.json().then(restaurants => {
          console.log('restaurants JSON: ', restaurants);
          callback(null, restaurants);
        });
    }).catch(error => {
      DBHelper.getAllRestaurant();
      callback(`Request failed. Returned ${error}`, null);
    });
  };

  static getAllRestaurant() {
    return this.dbPromise().then(db => {
      const tx = db.transaction('restaurants');
      const restaurantsStore = tx.objectStore('restaurants');
      return restaurantsStore.getAll();
    });
  }
 /*  Fetch and Store all restaurants to idb*/
  static fetchToStoreRestaurants() {
    let fetchURL = DBHelper.DATABASE_URL[0];
    fetch(fetchURL,{method: 'GET'})
    .then(response => 
        response.json()).then(restaurants => {
          console.log('Restaurants JSON: ', restaurants);
          return this.dbPromise().then(db => {
            const tx = db.transaction('restaurants', 'readwrite');
            const restaurantsStore = tx.objectStore('restaurants');
            restaurants.forEach(restaurant => restaurantsStore.put(restaurant));
            return tx.complete.then(() => Promise.resolve(restaurants));
          });
        });
  };
  /** Update Favourite status of the restaurant */
  static updateFavorite(id, isFavorite) {
    let fetchURL = DBHelper.DATABASE_URL[0] +'/'+ id + '/?is_favorite='+ isFavorite;
    if (!navigator.onLine) {
          DBHelper.updateFavoriteOffline(id, isFavorite);
          return;
    }
    fetch(fetchURL,{method: 'PUT'})
    .then(() => {
          this.dbPromise().then(db => {
             const tx = db.transaction('restaurants', 'readwrite');
             const restaurantsStore = tx.objectStore('restaurants');
             restaurantsStore.get(id).then(restaurant => {
               restaurant.is_favorite = isFavorite;
               restaurantsStore.put(restaurant);
             });
          });
        });
  };

  static updateFavoriteOffline (id, isFavorite) {
    this.dbPromise().then(db => {
      const tx = db.transaction('restaurants', 'readwrite');
      const restaurantsStore = tx.objectStore('restaurants');
      restaurantsStore.get(id).then(restaurant => {
        restaurant.is_favorite = isFavorite;
        restaurantsStore.put(restaurant);
      });
   });
   window.addEventListener('online' , (event) => {
      DBHelper.updateFavorite(id, isFavorite);
  });
  }
 /* Fetch Reviews by Restaurant id */ 
  static fetchReviewsByRestId(id, callback) {
    let fetchURL = DBHelper.DATABASE_URL[1] + '/?restaurant_id=' + id;
    fetch(fetchURL,{method: 'GET'})
    .then(response => {
        response.json().then(reviews => {
          console.log('reviews JSON: ', reviews);
          this.dbPromise().then(db => {
            const tx = db.transaction('reviews', 'readwrite');
            const reviewStore = tx.objectStore('reviews');
            reviews.forEach(review => reviewStore.put(review));
            return tx.complete.then(() => Promise.resolve(reviews));
          })
          callback(null, reviews);
        });
    }).catch(error => {
      DBHelper.getStoredReviewById('reviews' , 'restaurant' , id );
      callback(`Request failed. Returned ${error}`, null);
    });
  };

  static getStoredReviewById(table , indx , id) {
    return this.dbPromise().then(function(db) {
    if (!db) return;
    const store = db.transaction(table).objectStore(table);
    const indexId = store.index(indx);
    return indexId.getAll(id);
  });
  
  }

  static postReview (review) {
    let fetchURL = DBHelper.DATABASE_URL[1];
    let offlineObj = {
      name : 'addReview',
      data: review,
      object_type:'review'
    };
    if (!navigator.onLine && (offlineObj.name === 'addReview')) {
      DBHelper.sendDataToServer(offlineObj);
       return;
    }
    let reviewData = {
    'restaurant_id': parseInt(review.restaurant_id),
    'name': review.name,
    'rating': parseInt(review.rating),
    'comments':review.comments
    };
    fetch(fetchURL, {
      method : 'POST',
      body : JSON.stringify(reviewData)
    }).then(response => {
      response.json().then(review => {
        console.log('reviews JSON: ', review);
        this.dbPromise().then(db => {
          const tx = db.transaction('reviews', 'readwrite');
          const reviewStore = tx.objectStore('reviews');
           reviewStore.put(review);
           reviewStore.index('restaurant').openCursor(null, 'prev').then(cursor => {
            return cursor.advance(30);
          }).then(function deleteRest(cursor) {
          if (!cursor) return;
              cursor.delete();
            return cursor.continue().then(deleteRest);
          });
          return tx.complete.then(() => Promise.resolve(reviews));
        })
      });
    }).catch( error => console.log('Error :'+ error));
  };

  static sendDataToServer(offlineObj) {
    console.log(offlineObj);
    localStorage.setItem('data', JSON.stringify(offlineObj.data));
    window.addEventListener('online' , (event) => {
      let data = JSON.parse(localStorage.getItem('data'));
      if (data !== null) {
        if (offlineObj.name === 'addReview') {
          DBHelper.postReview(offlineObj.data);
          const li = document.querySelectorAll('#review-item');
          const offlineText = document.getElementById('offlineText');
          [...li].forEach(el => {
            if (el.classList.contains('offline-style')) {
              el.classList.remove('offline-style');
              el.removeChild(offlineText);
            }
          })
        }
        localStorage.removeItem('data');
      }
  });
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
        const restaurant = restaurants.find(r => r.id == id);
        if (restaurant) { // Got the restaurant
          callback(null, restaurant);
        } else { // Restaurant does not exist in the database
          callback('Restaurant does not exist', null);
        }
      }
    });
  };

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
  };

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
  };

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
  };

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
  };

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
  };

  /**
   * Restaurant page URL.
   */
  static urlForRestaurant(restaurant) {
    return (`./restaurant.html?id=${restaurant.id}`);
  };

  /**
   * Restaurant image URL.
   */
  static imageUrlForRestaurant(restaurant) {
    return (`/img/${restaurant.id}-sm_600.jpg`);
  };
/* Restaurant image srcset URLs */
  static imageSrcsetForRestaurant(restaurant) {
    let photographs = restaurant.id;
    let srcsetUrls = [`/img/${photographs}-sm_600.webp 600w`, `/img/${photographs}-md_800.webp 800w`, `/img/${photographs}-lg_1200.webp 1200w`];
    return srcsetUrls.join(', ');
  };
 
  /**
   * Map marker for a restaurant.
   */
  static mapMarkerForRestaurant(restaurant, map) {
    const marker = new google.maps.Marker({
      position: restaurant.latlng,
      title: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant),
      map: map,
      animation: google.maps.Animation.DROP}
    );
    return marker;
  };

  

  
}