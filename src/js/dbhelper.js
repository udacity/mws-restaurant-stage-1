import dbPromise from './dbpromise';

/**
 * Common database helper functions.
 */
export default class DBHelper {

  /**
   * Database URL.
   * Change this to restaurants.json file location on your server.
   */
  static get DATABASE_URL() {
    const port = 8000 // Change this to your server port
    return `http://localhost:${port}/data/restaurants.json`;
  }

    /**
   * API URL
   */
  static get API_URL() {
    const port = 1337; // port where sails server will listen.
    return `http://localhost:${port}`;
  }

  /**
   * Fetch all restaurants.
   */
  // static fetchRestaurants(callback) {
  //   let xhr = new XMLHttpRequest();
  //   xhr.open('GET', `${DBHelper.API_URL}/restaurants`);
  //   xhr.onload = () => {
  //     if (xhr.status === 200) { // Got a success response from server!
  //       const restaurants = JSON.parse(xhr.responseText);
  //       callback(null, restaurants);
  //     } else { // Oops!. Got an error from server.
  //       const error = (`Request failed. Returned status of ${xhr.status}`);
  //       callback(error, null);
  //     }
  //   };
  //   xhr.send();
  // }
  static fetchRestaurants(callback) {
    let xhr = new XMLHttpRequest();
    xhr.open('GET', `${DBHelper.API_URL}/restaurants`);
    xhr.onload = () => {
      if (xhr.status === 200) { // Got a success response from server!
        const restaurants = JSON.parse(xhr.responseText);
        dbPromise.putRestaurants(restaurants);
        callback(null, restaurants);
      } else { // Oops!. Got an error from server.
        console.log(`Request failed. Returned status of ${xhr.status}, trying idb...`);
        // if xhr request isn't code 200, try idb
        dbPromise.getRestaurants().then(idbRestaurants => {
          // if we get back more than 1 restaurant from idb, return idbRestaurants
          if (idbRestaurants.length > 0) {
            callback(null, idbRestaurants)
          } else { // if we got back 0 restaurants return an error
            callback('No restaurants found in idb', null);
          }
        });
      }
    };
    // XHR needs error handling for when server is down (doesn't respond or sends back codes)
    xhr.onerror = () => {
      console.log('Error while trying XHR, trying idb...');
      // try idb, and if we get restaurants back, return them, otherwise return an error
      dbPromise.getRestaurants().then(idbRestaurants => {
        if (idbRestaurants.length > 0) {
          callback(null, idbRestaurants)
        } else {
          callback('No restaurants found in idb', null);
        }
      });
    }
    xhr.send();
  }

  /**
   * Fetch a restaurant by its ID.
   */

  // static fetchRestaurantById(id, callback) {
  //   fetch(`${DBHelper.API_URL}/restaurants/${id}`).then(response => {
  //     if (!response.ok) return Promise.reject("Restaurant couldn't be fetched from network");
  //     return response.json();
  //   }).then(fetchedRestaurant => {
  //     // if restaurant could be fetched from network:
  //     return callback(null, fetchedRestaurant);
  //   }).catch(networkError => {
  //     // if restaurant couldn't be fetched from network:
  //     return callback(networkError, null);
  //   });
  // }

  static fetchRestaurantById(id, callback) {
    fetch(`${DBHelper.API_URL}/restaurants/${id}`).then(response => {
      if (!response.ok) return Promise.reject("Restaurant couldn't be fetched from network");
      return response.json();
    }).then(fetchedRestaurant => {
      // if restaurant could be fetched from network:
      dbPromise.putRestaurants(fetchedRestaurant);
      return callback(null, fetchedRestaurant);
    }).catch(networkError => {
      // if restaurant couldn't be fetched from network:
      console.log(`${networkError}, trying idb.`);
      dbPromise.getRestaurants(id).then(idbRestaurant => {
        if (!idbRestaurant) return callback("Restaurant not found in idb either", null);
        return callback(null, idbRestaurant);
      });
    });
  }

  // static fetchRestaurantById(id, callback) {
  //   // fetch all restaurants with proper error handling.
  //   DBHelper.fetchRestaurants((error, restaurants) => {
  //     if (error) {
  //       callback(error, null);
  //     } else {
  //       const restaurant = restaurants.find(r => r.id == id);
  //       if (restaurant) { // Got the restaurant
  //         callback(null, restaurant);
  //       } else { // Restaurant does not exist in the database
  //         callback('Restaurant does not exist', null);
  //       }
  //     }
  //   });
  // }

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
  // static imageUrlForRestaurant(restaurant) {
  //   return (`/img/${restaurant.photograph}`);
  // }

/**
   * Restaurant image URL. It defaults to a medium sized image. It uses restaurant.photograph
   * and fallbacks to restaurant.id if former is missing.
   */
  static imageUrlForRestaurant(restaurant) {
    let url = `/img/${(restaurant.photograph||restaurant.id)}.jpg`;
    return url;
  }

  /**
   * Restaurant srcset attribute for browser to decide best resolution. It uses restaurant.photograph
   * and fallbacks to restaurant.id if former is missing.
   */
  static imageSrcsetForRestaurant(restaurant) {
    const imageSrc = `/img/${(restaurant.photograph||restaurant.id)}`;
    return `${imageSrc}-small.jpg 300w,
            ${imageSrc}-medium.jpg 600w,
            ${imageSrc}-large.jpg 800w`;
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
      marker.addTo(map);
    return marker;
  }
  /* static mapMarkerForRestaurant(restaurant, map) {
    const marker = new google.maps.Marker({
      position: restaurant.latlng,
      title: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant),
      map: map,
      animation: google.maps.Animation.DROP}
    );
    return marker;
  } */

}

