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

  static get SERVER_REVIEWS_URL() {
    const port = 1337; // Change this to your server port
    return `http://localhost:${port}/reviews`;
  }

  /**
   * Open or Create a Database
   * Chrome complaining about using the idb promise library
   * resulting back to idbRequest
   */
  static openOrCreateDB() {
    return new Promise((resolve) => {
      let idbOpenRequest = indexedDB.open('restaurants-db', 2);
      idbOpenRequest.onerror = (event) => console.log('Open IDB error');
      idbOpenRequest.onsuccess = (event) => {
        console.log('Resolving to ', idbOpenRequest.result);
        resolve(idbOpenRequest.result);
      };
      idbOpenRequest.onupgradeneeded = (event) => {
        let db = event.target.result;
        db.onerror = () => console.log('Error opening DB');
        db.createObjectStore('restaurants', { keyPath: 'id' });
        db.createObjectStore('reviews', { keyPath: 'id', autoIncrement: true });
        db.createObjectStore('pending-reviews', { keyPath: 'updateTime', autoIncrement: true });
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
            throw new Error('[RESTAURANT FETCH ACTION] - Network error');
          })
          .then(restaurants => {
            callback(null, restaurants);
            return restaurants;
          })
          .then((restaurants) => {
            this.openOrCreateDB()
              .then((db) => {
                if (!db) throw new Error('[DB ERROR] - No DB found.');
                let tx = db.transaction(['restaurants'], 'readwrite');
                tx.oncomplete = () => console.log('restaurants transaction success');
                tx.onerror = () => console.log('restaurants transaction error');
                let objectStore = tx.objectStore('restaurants');
                restaurants.forEach((restaurant) => {
                  console.log('Putting restaurant: ', restaurant);
                  objectStore.put(restaurant);
                  objectStore.onsuccess = () => console.log('restaurants success adding', restaurant);
                });
              });
          })
          .catch(err => {
            this.openOrCreateDB()
              .then((db) => {
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

  static fetchRestaurantReviewsById(id, callback) {
    this.openOrCreateDB()
      .then(db => {
        if (!db) return;
        // 1. Check if there are reviews in the IDB
        const tx = db.transaction('reviews');
        const store = tx.objectStore('reviews');
        return store.getAll();
      })
      .then(reviews => {
        if (reviews && reviews.length > 0) {
          // Continue with reviews from IDB
          callback(null, reviews);
        } else {
          // 2. If there are no reviews in the IDB, fetch reviews from the network
          fetch(`${DBHelper.SERVER_REVIEWS_URL}/?restaurant_id=${id}`)
            .then(res => res.json())
            .then(reviews => {
              this.openOrCreateDB()
                .then(db => {
                  if (!db) return;
                  // 3. Put fetched reviews into IDB
                  const tx = db.transaction('reviews', 'readwrite');
                  const store = tx.objectStore('reviews');
                  reviews.forEach(review => store.put(review))
                });
              // Continue with reviews from network
              callback(null, reviews);
            })
            .catch(error => {
              // Unable to fetch reviews from network
              callback(error, null);
            })
        }
      })
      .catch((err) => callback(err, null));
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
      {
        title: restaurant.name,
        alt: restaurant.name,
        url: DBHelper.urlForRestaurant(restaurant)
      })
    marker.addTo(newMap);
    return marker;
  }

  /**
   * DB Helper for handling favorite icon toggle
   * @param {string} id 
   * @param {boolean} newState 
   */
  static toggleFavorite(restaurant, isFavorite) {
    fetch(`${DBHelper.SERVER_URL}/${restaurant.id}/?is_favorite=${isFavorite}`, { method: 'PUT' })
      .then(response => {
        return response.json();
      })
      .then(data => {
        this.openOrCreateDB()
          .then(db => {
            if (!db) return;
            const tx = db.transaction('restaurants', 'readwrite');
            const store = tx.objectStore('restaurants');
            store.put(data)
          });
        return data;
      })
      .catch(error => {
        restaurant.is_favorite = isFavorite;
        this.openOrCreateDB()
          .then(db => {
            if (!db) return;
            const tx = db.transaction('restaurants', 'readwrite');
            const store = tx.objectStore('restaurants');
            store.put(restaurant);
          }).catch(error => {
            console.log(error);
            return;
          });
      });
  }

  /**
   * Save the Review to server
   */
  static postReviewToServer(review) {
    console.log('Calling postReviewToServer ', review);
    const opts = {
      body: JSON.stringify(review),
      cache: 'no-cache',
      credentials: 'same-origin',
      headers: { 'content-type': 'application/json' },
      method: 'POST',
      mode: 'cors',
      redirect: 'follow',
      referrer: 'no-referrer',
    };
    return fetch(`${DBHelper.SERVER_REVIEWS_URL}`, opts)
      .then(res => {
        res.json()
          .then(data => {
            this.openOrCreateDB()
              .then(db => {
                if (!db) return;
                // Put fetched reviews into IDB
                const tx = db.transaction('reviews', 'readwrite');
                const store = tx.objectStore('reviews');
                store.put(data);
              });
            return data;
          })
      })
      .catch(() => {
        // Network is offline, save to pending db
        review['updateTime'] = new Date().getTime();
        console.log('Updated review: ', review);
        this.openOrCreateDB()
          .then(db => {
            if (!db) return;
            // Put fetched reviews into IDB
            const tx = db.transaction('pending-reviews', 'readwrite');
            const store = tx.objectStore('pending-reviews');
            store.put(review);
            console.log('Review stored offline in IDB');
          });
        return;
      });
  }

  static postOfflineReviewsToServer() {
    console.log('Calling postOfflineReviewsToServer');
    this.openOrCreateDB()
      .then(db => {
        if (!db) return;
        const tx = db.transaction('pending-reviews', 'readwrite');
        const store = tx.objectStore('pending-reviews');
        let getAllRequest = store.getAll();
        getAllRequest.onsuccess = (event) => {
          const reviews = event.target.result;
          if (!reviews) {
            console.log('No pending reviews to post to server');
            return;
          }
          console.log('Found offline reviews: ', reviews);
          for (const review of reviews) {
            DBHelper.postReviewToServer(review);
          }
          const tx = db.transaction('pending-reviews', 'readwrite');
          const store = tx.objectStore('pending-reviews');
          store.clear();
        }
      });
  }
}
