let dbPromise;

/**
 * Common database helper functions.
 */
class DBHelper {
  /**
   * Server URL.
   * Change this to read the estaurants information from external server.
   */
  static get SERVER_URL() {
    const port = 1337 // Change this to your server port
    return `http://localhost:${port}/restaurants`;
  }

  /**
   * Open or Create a Database
   * Chrome complaining about using the idb promise library
   * resulting back to idbRequest
   */
  static openOrCreateDB() {
    return new Promise((resolve) => {
      let idbOpenRequest = indexedDB.open('restaurants-db', 1);
      idbOpenRequest.onerror = (event) => console.log('Open IDB error');
      idbOpenRequest.onsuccess = (event) => {
        resolve(idbOpenRequest.result);
      };
      idbOpenRequest.onupgradeneeded = (event) => {
        let db = event.target.result;
        db.onerror = () => console.log('Error opening DB');
        db.createObjectStore('restaurants', { keyPath: 'id'});
      };
    });
  }

  /**
   * Fetch all restaurants.
   */
  static fetchRestaurants(callback) {
    this.openOrCreateDB()
      .then(data => {
        // If restaurant data exists return that 
        if (data.length > 0) {
          return callback(null, data);
        }
        // Fetch from network
        return fetch(`${this.SERVER_URL}`)
          .then(res => {
            if (res.ok) {
              return res.json()
            }
            throw new Error('[FETCH ACTION] - Network error');
          })
          .then(restaurants => {
            callback(null, restaurants);
            return restaurants;
          })
          .then((err, restaurants) => {
            this.openOrCreateDB()
              .then((db) => {
                if (!db) throw new Error('[DB ERROR] - No DB found.');
                let tx = db.transaction(['restaurants'], 'readwrite');
                tx.oncomplete = () => console.log('transaction success');
                tx.onerror = () => console.log('transaction error');
                let objectStore = tx.objectStore('restaurants');
                restaurants.forEach((restaurant) => {
                  objectStore.put(restaurant);
                  objectStore.onsuccess = () => console.log('success adding', restaurant);
                });
              });
          })
          .catch(err => {
            this.openOrCreateDB()
              .then(function (db) {
                let tx = db.transaction(['restaurants']);
                let objectStore = tx.objectStore('restaurants');
                let getAllRequest = objectStore.getAll();
                getAllRequest.onsuccess = (event) => {
                  callback(null, event.target.result);
                }
            });
          });
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
    return (`./restaurant.html?id=${restaurant.id}`);
  }

  /**
   * Restaurant image URL.
   */
  static imageUrlForRestaurant(restaurant) {
    return (`/img/${restaurant.id}_800w.jpg`);
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
}

