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
    return `http://localhost:${port}/restaurants/`;
  }

  /**
   * Fetch all restaurants.
   */
  static fetchRestaurants(callback) {

    fetch(DBHelper.DATABASE_URL)
      .then(response => response.json())
      .then(restaurants => callback(null, restaurants))
      .catch(e => {
        // Oops!. Got an error from server.
        console.log('Error', e);
        const error = (`Request failed. Returned status of ${e.status}`);
        callback(error, null);
      });
  }

  static fetchRestaurantsAsync() {

    return fetch(DBHelper.DATABASE_URL)
      .then(response => response.json())
      .catch(e => {
        //console.log("Error", e);
        const error = (`Request failed. Returned status of ${e.status}`);
        throw error;
      });

  }

  /**
   * Fetch a restaurant by its ID.
   */
  static fetchRestaurantById(id, callback) {
    fetch(DBHelper.DATABASE_URL + id)
      .then(response => response.json())
      .then(restaurant => callback(null, restaurant))
      .catch(e => {
        // Oops!. Got an error from server.
        //console.log('Error', e);
        const error = (`Request failed. Returned status of ${xhr.status}`);
        callback(e, null);
      });
  }

  static fetchRestaurantByIdAsync(id) {
    return fetch(DBHelper.DATABASE_URL + id)
      .then(response => response.json())
      .catch(e => {
        //console.log("Error", e);
        const error = (`Request failed. Returned status of ${e.status}`);
        throw error;
      });
  }


  /**
   * Fetch restaurants by a cuisine type with proper error handling.
   */
  static fetchRestaurantByCuisine(cuisine, callback) {
    // Fetch all restaurants  with proper error handling
    DBHelper.fetchRestaurantsAsync()
      .then(restaurants => {
        // Filter restaurants to have only given cuisine type
        const results = restaurants.filter(r => r.cuisine_type == cuisine);
        callback(null, results);
      })
      .catch(error => callback(error, null));


    // DBHelper.fetchRestaurants((error, restaurants) => {
    //   if (error) {
    //     callback(error, null);
    //   } else {
    //     // Filter restaurants to have only given cuisine type
    //     const results = restaurants.filter(r => r.cuisine_type == cuisine);
    //     callback(null, results);
    //   }
    // });
  }

  /**
   * Fetch restaurants by a neighborhood with proper error handling.
   */
  static fetchRestaurantByNeighborhood(neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurantsAsync()
      .then(restaurants => {
        // Filter restaurants to have only given neighborhood
        const results = restaurants.filter(r => r.neighborhood == neighborhood);
        callback(null, results);
      })
      .catch(error => callback(error, null));


    // DBHelper.fetchRestaurants((error, restaurants) => {
    //   if (error) {
    //     callback(error, null);
    //   } else {
    //     // Filter restaurants to have only given neighborhood
    //     const results = restaurants.filter(r => r.neighborhood == neighborhood);
    //     callback(null, results);
    //   }
    // });
  }

  /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */
  static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurantsAsync()
      .then(restaurants => {
        let results = restaurants
        if (cuisine != 'all') { // filter by cuisine
          results = results.filter(r => r.cuisine_type == cuisine);
        }
        if (neighborhood != 'all') { // filter by neighborhood
          results = results.filter(r => r.neighborhood == neighborhood);
        }
        callback(null, results);
      })
      .catch(error => callback(error, null));


    // DBHelper.fetchRestaurants((error, restaurants) => {
    //   if (error) {
    //     callback(error, null);
    //   } else {
    //     let results = restaurants
    //     if (cuisine != 'all') { // filter by cuisine
    //       results = results.filter(r => r.cuisine_type == cuisine);
    //     }
    //     if (neighborhood != 'all') { // filter by neighborhood
    //       results = results.filter(r => r.neighborhood == neighborhood);
    //     }
    //     callback(null, results);
    //   }
    // });
  }

  /**
   * Fetch all neighborhoods with proper error handling.
   */
  static fetchNeighborhoods(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurantsAsync()
      .then(restaurants => {
        // Get all neighborhoods from all restaurants
        const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood)
        // Remove duplicates from neighborhoods
        const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i)
        callback(null, uniqueNeighborhoods);
      })
      .catch(error => callback(error, null));


    // DBHelper.fetchRestaurants((error, restaurants) => {
    //   if (error) {
    //     callback(error, null);
    //   } else {
    //     // Get all neighborhoods from all restaurants
    //     const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood)
    //     // Remove duplicates from neighborhoods
    //     const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i)
    //     callback(null, uniqueNeighborhoods);
    //   }
    // });
  }

  /**
   * Fetch all cuisines with proper error handling.
   */
  static fetchCuisines(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurantsAsync()
      .then(restaurants => {
        // Get all cuisines from all restaurants
        const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type)
        // Remove duplicates from cuisines
        const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i)
        callback(null, uniqueCuisines);
      })
      .catch(error => callback(error, null));
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
    return (`/images/${restaurant.photograph}.jpg`);
  }

  /**
   * Restaurant image URL reduced size
   */
  static imageUrlForRestaurantReduced(restaurant, info) {
    const filename = restaurant.photograph.replace('.jpg', info) + '.jpg';
    return (`/images/${filename}`);
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
      animation: google.maps.Animation.DROP
    }
    );
    return marker;
  }

}
