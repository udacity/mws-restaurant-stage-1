import idb from 'idb';

/**
 * Common database helper functions.
 */
class DBHelper {

  /**
   * Database URL.
   * Change this to restaurants.json file location on your server.
   */
  static get DATABASE_URL() {
    const port = 1337 // Change this to your server port
    return `http://localhost:${port}/restaurants`;
  }

  /**
   * Idb database name.
   */
  static get IDB_DATABASE_NAME() {
    return `mws-restaurant-stage-1-idb`;
  }

  static get IDB_VERSION() {
    return 1;
  }

  /**
   * Get idb database
   */
  static getIdbDatabase() {
    if (!navigator.serviceWorker) return Promise.resolve();

    return idb.open(DBHelper.IDB_DATABASE_NAME, DBHelper.IDB_VERSION, (upgradeCallback) => {
      upgradeCallback.createObjectStore('restaurants', {
        keyPath: 'id'
      });
    });
  }

  /**
   * Fetch all restaurants.
   */
  static fetchRestaurants(callback) {
    let idbRestaurants = [];
    const restaurantsStore = DBHelper.getIdbDatabase();

    restaurantsStore
      .then((db) => {
        const tx = db.transaction('restaurants');
        tx.objectStore('restaurants')
          .getAll()
          .then((restaurants) => {
            idbRestaurants = restaurants;
          });
        return db;
      })
      .then((db) => {
        if (idbRestaurants) {
          console.log('idbRestaurants = ', idbRestaurants);
          callback(null, idbRestaurants);
        } else {
          fetch(DBHelper.DATABASE_URL)
            .then((response) => {
              return response.json();
            })
            .then((restaurants) => {
              // restaurantsStore.then((db) => {
              const tx = db.transaction('restaurants', 'readwrite');
              const restaurantsStore = tx.objectStore('restaurants');
              restaurants.forEach((restaurant) => {
                restaurantsStore.put(restaurant);
              });
              // });
              callback(null, restaurants);
            })
            .catch((e) => {
              const error = `Request failed`;
              console.log('err = ', e);
              callback(error, null);
            });
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
    return `./restaurant.html?id=${restaurant.id}`;
  }

  /**
   * Restaurant image utils.
   */
  static imageUrlForRestaurant(restaurant) {
    let imgName;
    // The photograph property of restaurant *10* is missing from the server restaurants data
    // A pull request have already been created, but not merged yet
    // The next line hack is done to bypass errors
    if (restaurant.id === 10) {
      imgName = '10';
    } else {
      const jpgIndex = restaurant.photograph.indexOf('.jpg');
      imgName = jpgIndex > -1 ? restaurant.photograph.substring(0, jpgIndex) : restaurant.photograph;
    }
    return `/img/${imgName}_small.jpg`;
  }

  static imageSrcsetUrlsForRestaurant(restaurant) {
    let imgName;
    // The photograph property of restaurant *10* is missing from the server restaurants data
    // A pull request have already been created, but not merged yet
    // The next line hack is done to bypass errors
    if (restaurant.id === 10) {
      imgName = '10';
    } else {
      const jpgIndex = restaurant.photograph.indexOf('.jpg');
      imgName = jpgIndex > -1 ? restaurant.photograph.substring(0, jpgIndex) : restaurant.photograph;
    }
    return `/img/${imgName}_small.jpg 400w, /img/${imgName}_medium.jpg 600w, /img/${imgName}_large.jpg 800w`;
  }

  static imageSizes() {
    return `(min-width: 769px) 50%, 100%`;
  }

  static imageAltForRestaurant(restaurant) {
    return `Restaurant ${restaurant.name}`;
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

}
