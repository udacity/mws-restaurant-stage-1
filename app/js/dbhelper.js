/**
 * Common database helper functions.
 */
import idb from "idb";

const dbPromise = idb.open('mws-restaurants', 3, upgradeDB => {
  switch (upgradeDB.oldVersion) {
    case 0:
      upgradeDB.createObjectStore('restaurants', { keyPath: 'id' });
    case 1:
      upgradeDB.createObjectStore('pending', {
        keyPath: 'id',
        autoIncrement: true
      });
    case 2:
      const reviewsStore = upgradeDB.createObjectStore('reviews', { keyPath: 'id' });
      reviewsStore.createIndex("restaurant_id", "restaurant_id")
  }
});

class DBHelper {

  /**
   * Database URL.
   * Change this to restaurants.json file location on your server.
   */
  static get DATABASE_URL() {
    const port = 1337 // Change this to your server port
    return `http://localhost:${port}/restaurants`;
  }

  static get DATABASE_URL_REVIEWS() {
    const port = 1337 // Change this to your server port
    return `http://localhost:${port}/reviews`;
  }

  /**
   * Fetch all restaurants.
   */

  // Use Fetch instead of XHR.
  static fetchRestaurants(callback, id) {
    let fetchUrl;
    if (!id) {
      fetchUrl = DBHelper.DATABASE_URL;
    } else {
      fetchUrl = DBHelper.DATABASE_URL + '/' + id;
    }
    fetch(fetchUrl)
      .then(response => { return response.json(); })
      .then(data => callback(null, data))
      .catch(error => callback(`The request failed with ${error}.`, null))
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
        const restaurant = restaurants;
        if (restaurant) { // Got the restaurant
          callback(null, restaurant);
        } else { // Restaurant does not exist in the database
          callback('Restaurant does not exist', null);
        }
      }
    }, id);
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
  static imageUrlForRestaurant(restaurant, type) {
    return (`/images/${type}/${restaurant.photograph}.jpg`);
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

  static fetchRestaurantReviews(id, callback) {
    // Fetch all reviews for the specific restaurant
    const fetchURL = `${DBHelper.DATABASE_URL_REVIEWS}/?restaurant_id=` + id;
    fetch(fetchURL, { method: "GET" }).then(response => {
      if (!response.clone().ok && !response.clone().redirected) {
        throw "No reviews available";
      }
      response
        .json()
        .then(result => {
          callback(null, result);
        })
    }).catch(error => callback(error, null));
  }

  static updateFavoriteDB(restaurantID, newState, callback) {
    DBHelper.updateRestaurantInfo(restaurantID, { 'is_favorite': newState });
    callback(null, { restaurantID, newState })
  }

  static handleFavorite(restaurant, newState) {
    DBHelper.updateFavoriteDB(restaurant.id, newState, (error, result) => {
      if (error) return;

      const favoriteBtn = document.getElementById(`favorite-${result.restaurantID}`);
      favoriteBtn.innerHTML = (result.newState) ? '<i class="fas fa-star is-favorited"></i> favorite' : '<i class="fas fa-star is-not-favorited"></i> favorite';
      const attr = document.createAttribute('aria-label');
      attr.value = (result.newState) ? `${restaurant.name} is favorited` : `${restaurant.name} is not favorited`;
      favoriteBtn.setAttributeNode(attr);
    });
  }

  static savePostReview(restaurantID, properties, callback) {
    DBHelper.updateReviewInfo(restaurantID, properties);
    callback(null, null)
  }

  static handlePostReview(restaurantID, name, rating, comments, callback) {
    const reviewBtn = document.getElementById('post-review');
    reviewBtn.onclick = null;

    const properties = {
      createdAt: Date.now(),
      restaurant_id: restaurantID,
      name: name,
      rating: rating,
      comments: comments
    }

    DBHelper.savePostReview(restaurantID, properties, (error, result) => {
      if (error) {
        callback(error, null);
        return;
      }
      callback(null, result);
    })
  }

  static updateReviewInfo(restaurantID, properties) {
    dbPromise.then(db => {
      const tx = db.transaction('reviews', 'readwrite');
      const reviewStore = tx.objectStore('reviews');

      /* Help from https://www.twilio.com/blog/2017/02/send-messages-when-youre-back-online-with-service-workers-and-background-sync.html
              on how to implement background sync to create a queue for when requests are sent while in offline mode */
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js').then(function (reg) {
          if ('sync' in reg) {
            let requestProperties = {
              method: 'post',
              body: {
                'restaurant_id': properties.restaurant_id,
                'name': properties.name,
                'rating': properties.rating,
                'comments': properties.comments,
                'createdAt': properties.createdAt
              },
              url: DBHelper.DATABASE_URL_REVIEWS
            };

            dbPromise.then(() => {
              const tx = db.transaction('pending', 'readwrite');
              return tx.objectStore('pending').put(requestProperties);
            }).then(function () {
              return reg.sync.register('pending');
            }).catch(function (err) {
              // something went wrong with the database or the sync registration
              console.error(err);
            });
          }
        }).catch(function (err) {
          console.error(err); // the Service Worker didn't install correctly
        });
      }

      //must store by Date.now() so keys are unique in the store
      reviewStore.put({ id: Date.now(), "restaurant_id": restaurantID, data: properties });
      return tx.complete;
    });
  }

  static updateRestaurantInfo(restaurantID, updateObject) {
    dbPromise.then(db => {
      const tx = db.transaction('restaurants', 'readwrite');
      const storeVal = tx.objectStore('restaurants').get('-1') //where all restaurant data is stored
        .then(storeVal => {
          //make sure the cache isn't empty, if it is break
          if (!storeVal) {
            console.log('Nothing is cached.');
            return;
          }

          const restaurantData = storeVal.data;

          //make sure the array isn't empty at index we need to update
          if (restaurantData[restaurantID - 1] != null) {
            let updateRestaurantKeys = Object.keys(updateObject);
            for (const restaurantKey of updateRestaurantKeys) {
              restaurantData[restaurantID - 1][restaurantKey] = updateObject[restaurantKey];

              /* Help from https://www.twilio.com/blog/2017/02/send-messages-when-youre-back-online-with-service-workers-and-background-sync.html
              on how to implement background sync to create a queue for when requests are sent while in offline mode */
              if ('serviceWorker' in navigator) {
                navigator.serviceWorker.register('/sw.js').then(function (reg) {
                  if ('sync' in reg) {
                    let properties = {
                      method: 'put',
                      body: updateObject[restaurantKey],
                      url: `${DBHelper.DATABASE_URL}/${restaurantID}/?is_favorite=${updateObject[restaurantKey]}`
                    };

                    dbPromise.then(() => {
                      const tx = db.transaction('pending', 'readwrite');
                      return tx.objectStore('pending').put(properties);
                    }).then(function () {
                      return reg.sync.register('pending');
                    }).catch(function (err) {
                      // something went wrong with the database or the sync registration
                      console.error(err);
                    });
                  }
                }).catch(function (err) {
                  console.error(err); // the Service Worker didn't install correctly
                });
              }
            }
            dbPromise.then(db => {
              tx.objectStore('restaurants').put({ id: '-1', data: storeVal.data });
              return tx.complete;
            })
          }
        });
    });
  }
}

window.DBHelper = DBHelper;
