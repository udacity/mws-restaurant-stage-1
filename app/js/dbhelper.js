/**   Create Indexed Database for data    **/ 
const dbPromise = idb.open('restaurants-DB', 1, upgradeDB => {
  switch (upgradeDB.oldVersion) {
    case 0:
      upgradeDB.createObjectStore('restaurants');
  }
});

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
    return `http://localhost:${port}`;
    //return `https://chinfox.github.io/mws-restaurant-stage-1/data/restaurants.json`;
  }

  /**   Fetch data from IDB   **/
  static getFromIDB(callback){
    dbPromise.then(db => {
      let tx = db.transaction('restaurants');
      let store = tx.objectStore('restaurants');
      return store.getAll();
    }).then(function(restaurants) {
      callback(null, restaurants);
    });
  }

  /**   Fetch data from Server and store a copy of response in IDB    **/
  static getFromServer(callback){
    let restaurant_URL = `${DBHelper.DATABASE_URL}/restaurants/`;
    fetch(restaurant_URL)
    .then(response => response.json()).then(restaurants => {
      restaurants.map(restaurant => {
        dbPromise.then(db => {
          let tx = db.transaction('restaurants', 'readwrite')
          let store = tx.objectStore('restaurants');
          store.put(restaurant, restaurant.id);
        });
      });
      callback(null, restaurants);
    }).catch(error => callback(error, null));
  }
  
  static addFav(id) {
    let trueFav = `${DBHelper.DATABASE_URL}/restaurants/${id}/?is_favorite=true`;
    fetch(trueFav, {
      method: 'PUT'
    });
  }
  
  static removeFav(id) {
    let falseFav = `${DBHelper.DATABASE_URL}/restaurants/${id}/?is_favorite=false`;
    fetch(falseFav, {
      method: 'PUT'
    });
  }  

  static getReviews(callback) {
    let reviews_URL = `${DBHelper.DATABASE_URL}/reviews/`;
    fetch(reviews_URL).then(response => response.json())
    .then(reviews => callback(null, reviews))
    .catch(error => callback(error, null));
  }

  static getReviewsById(id, callback) {
    let reviews_URL = `${DBHelper.DATABASE_URL}/reviews/?restaurant_id=${id}`;
    fetch(reviews_URL).then(response => response.json())
    .then(reviews => callback(null, reviews))
    .catch(error => callback(error, null));
  }

  /**
   * Fetch all restaurants.
   */
  static fetchRestaurants(callback) {
    //  check if Service Worker controls page
  /*  if (navigator.serviceWorker.controller) {
      DBHelper.getFromIDB(callback);
      return;
    } */
    DBHelper.getFromServer(callback);
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
    //const url = `./images/${restaurant.photograph}`;
    const url = `./images/${restaurant.id}`;
    const small = `${url}-small.jpg`;
    const normal = `${url}-normal.jpg`;
    const large = `${url}-normal_2x.jpg`;
    //const small = url.replace('.jpg', '-small.jpg');
    //const normal = url.replace('.jpg', '-normal.jpg');
    //const large = url.replace('.jpg', '-normal_2x.jpg');
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
}