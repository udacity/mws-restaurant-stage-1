/**
 * Common database helper functions.
 */
class DBHelper {

  static IDB() {
    const dbPromise = idb.open('restaurants-app', 1, upgradeDb => {
      upgradeDb.createObjectStore('restaurants');
      upgradeDb.createObjectStore('restaurant', { keyPath: 'id' });
      upgradeDb.createObjectStore('reviews');
      upgradeDb.createObjectStore('offline-reviews', { autoIncrement : true, keyPath: 'id' });
    });

    return dbPromise;
  }

  /**
   * Database URL.
   * Change this to restaurants.json file location on your server.
   */
  static get DATABASE_URL() {
    const port = 8000 // Change this to your server port
    return `http://localhost:${port}/data/restaurants.json`;
  }

  /**
   * Server URL.
   */
  static get SERVER_URL() {
    const port = 1337;
    return `http://localhost:${port}`;
  }

  /**
   * Fetch and store all restaurants to idb.
   */
  static fetchAndStoreRestaurants() {
    const url = `${DBHelper.SERVER_URL}/restaurants`;

    return fetch(url)
    .then(resp => {
      return resp.json().then(restaurants => {
        return DBHelper.IDB().then(db => {
          const tx = db.transaction('restaurants', 'readwrite');
          const store = tx.objectStore('restaurants');
          store.put(restaurants, 'all');
          return restaurants;
        });
      });      
    });      
  }

  /**
   * Fetch all restaurants.
   */
  static fetchRestaurants() {
    return DBHelper.IDB()
    .then(db => {
      const tx = db.transaction('restaurants');
      const store = tx.objectStore('restaurants');
      return store.get('all');
    })
    .then(restaurants => {
      if(!restaurants) return DBHelper.fetchAndStoreRestaurants();
      return restaurants;
    });
  }

  /**
   * Fetch a restaurant by its ID.
   */
  static fetchAndStoreRestaurantById(id) {
    const url = `${DBHelper.SERVER_URL}/restaurants/${id}`;

    return fetch(url)
    .then(resp => {
      return resp.json().then(restaurant => {
        return DBHelper.IDB().then(db => {
          const tx = db.transaction('restaurant', 'readwrite');
          const store = tx.objectStore('restaurant');
          store.put(restaurant);
          return restaurant;
        });
      });      
    });
  }

  /**
   * Fetch a restaurant by its ID.
   */
  static fetchRestaurantById(id) {
    return DBHelper.IDB()
    .then(db => {
      const tx = db.transaction('restaurant');
      const store = tx.objectStore('restaurant');
      return store.get(parseInt(id, 10));
    })
    .then(restaurant => {
      if(!restaurant) return DBHelper.fetchAndStoreRestaurantById(id);
      return restaurant;
    });
  }

  /**
   * Fetch and store all reviews of a restaurant by ID. 
   */
  static fetchAndStoreRestaurantReviewsById(id) { 
    const url = `${DBHelper.SERVER_URL}/reviews/?restaurant_id=${id}`;

    return fetch(url)
    .then(resp => resp.json())
    .then(reviews => {
      return DBHelper.IDB().then(db => {
        const tx = db.transaction('reviews', 'readwrite');
        const store = tx.objectStore('reviews');
        store.put(reviews, id);
        return reviews;
      });  
    });
  }

  /**
   * Fetch all reviews of a restaurant by ID. 
   */
  static fetchRestaurantReviewsById(id) {
    return DBHelper.IDB()
    .then(db => {
      const tx = db.transaction('reviews');
      const store = tx.objectStore('reviews');
      return store.get(id);
    })
    .then(reviews => {
      if(!reviews) return DBHelper.fetchAndStoreRestaurantReviewsById(id);
      return reviews;
    });
  }
  /**
   * Fetch restaurants by a cuisine type with proper error handling.
   */
  static fetchRestaurantByCuisine(cuisine) {
    return DBHelper.fetchRestaurants()
                  .then(restaurants => restaurants.filter(r => r.cuisine_type == cuisine));  
  }

  /**
   * Fetch restaurants by a neighborhood with proper error handling.
   */
  static fetchRestaurantByNeighborhood(neighborhood, callback) {
    return DBHelper.fetchRestaurants()
                  .then(restaurants => restaurants.filter(r => r.neighborhood == neighborhood));
  }

  /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */
  static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood) {
    return DBHelper.fetchRestaurants()
                  .then(restaurants => {
                    let results = restaurants;

                    // filter by cuisine
                    if (cuisine != 'all') { 
                      results = results.filter(r => r.cuisine_type == cuisine);
                    }
                    
                    // filter by neighborhood
                    if (neighborhood != 'all') { 
                      results = results.filter(r => r.neighborhood == neighborhood);
                    }
                    
                    return results;
                  });
  }

  /**
   * Fetch all neighborhoods with proper error handling.
   */
  static fetchNeighborhoods() {
    return DBHelper.fetchRestaurants()
                  .then(restaurants => {
                    const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood)
                    const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i)
                    return uniqueNeighborhoods;
                  });
  }

  /**
   * Fetch all cuisines with proper error handling.
   */
  static fetchCuisines(callback) {
    return DBHelper.fetchRestaurants()
                  .then(restaurants => {
                    const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type)
                    const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i)
                    return uniqueCuisines;
                  });
  }

  /**
   * Restaurant page URL.
   */
  static urlForRestaurant(restaurant) {
    return (`./restaurant.html?id=${restaurant.id}`);
  }

  /**
   * Restaurant image URL.
   */
  static imageUrlForRestaurant(restaurant) {
    return (`/img/${restaurant.photograph}.jpg`);
  }

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
  }

  /**
   * Format date value.
   */
  static dateFormat(value, locale='en-us') {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(value).toLocaleString(locale, options);
  }

  /**
   * Store an offline review.
   */
  static storeOfflineReview(review) {
    return DBHelper.IDB().then(db => {
      const tx = db.transaction('offline-reviews', 'readwrite');
      const store = tx.objectStore('offline-reviews');
      store.put(review);
      return review;
    }); 
  }

  /**
   * Remove an offline review by ID.
   */
  static deleteReview(reviewID) {
    return DBHelper.IDB().then(db => {
      const tx = db.transaction('offline-reviews', 'readwrite');
      const store = tx.objectStore('offline-reviews');      
      return store.delete(reviewID);
    })
  }

  /**
   * Update all deferred reviews and delete successfully updated review.
   */
  static updateAndDeleteDeferredReviews() {
    return DBHelper.IDB().then(db => {
      const tx = db.transaction('offline-reviews', 'readonly');
      const store = tx.objectStore('offline-reviews');      
      return store.getAll();
    })
    .then(reviews => {
      reviews.forEach(review => {
        DBHelper.submitReview(review)
        .then(resp => DBHelper.deleteReview(review.id))
        .catch(err => console.error(err));
      });
    }); 
  }

  /**
   * Submit a review.
   */
  static submitReview(data) {
    const url = `${DBHelper.SERVER_URL}/reviews/`;
    const body = JSON.stringify(data);
    
    return fetch(url, {
      method: 'post',
      body: body
    });
  }
}
