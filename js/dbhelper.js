/**
 * Common database helper functions.
 */
class DBHelper {

  /**
   * Database URL.
   * Change this to restaurants.json file location on your server.
   */
  static get DATABASE_URL() {
    const port = 8000 // Change this to your server port
    return `http://localhost:${port}/data/restaurants.json`;
  }

  /**
   * Fetch all restaurants.
   */
   static fetchRestaurants() {
     return fetch(DBHelper.DATABASE_URL)
     .then(function(response) {
       if (!response.ok) {
         throw Error(response.statusText);
       }
       // Read the response as json.
       return response.json();
     })
     .catch(function(error) {
       console.log('Looks like there was a problem: \n', error);
       return errror;
     });
   }

  /**
   * Fetch a restaurant by its ID.
   */
   static fetchRestaurantById(id) {
     // fetch all restaurants with proper error handling.
     return DBHelper.fetchRestaurants()
     .then(function(response) {
       const restaurant = response.restaurants.find((r) => r.id == id);
       if (restaurant) { // Got the restaurant
         return restaurant;
       } else { // Restaurant does not exist in the database
         return null;
       }
     })
     .catch(function(error) {
       console.log('Looks like there was a problem: \n', error);
       return error;
     });
   }

  /**
   * Fetch restaurants by a cuisine type with proper error handling.
   */
   static fetchRestaurantByCuisine(cuisine) {
     // Fetch all restaurants  with proper error handling
     DBHelper.fetchRestaurants()
     .then((response)=>{
       const restaurants = response.restaurants;
       // Filter restaurants to have only given cuisine type
       const results = restaurants.filter((r) => r.cuisine_type == cuisine);
       return results;
     })
     .catch((error)=>{
       return error;
     });
   }

  /**
   * Fetch restaurants by a neighborhood with proper error handling.
   */
   static fetchRestaurantByNeighborhood(neighborhood, callback) {
     // Fetch all restaurants

     DBHelper.fetchRestaurants()
     .then((response)=>{
       const restaurants = response.restaurants;
       // Filter restaurants to have only given neighborhood
       const results = restaurants.filter((r) => r.neighborhood == neighborhood);
       return results;
     })
     .catch((error)=>{
       return error;
     });
   }

  /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */
   static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood) {
     // Fetch all restaurants
     return DBHelper.fetchRestaurants()
     .then((response)=>{
       const restaurants = response.restaurants;
       let results = restaurants;
       if (cuisine != 'all') { // filter by cuisine
         results = results.filter((r) => r.cuisine_type == cuisine);
       }
       if (neighborhood != 'all') { // filter by neighborhood
         results = results.filter((r) => r.neighborhood == neighborhood);
       }
       return results;
     })
     .catch((error)=>{
       console.log('Looks like there was a problem: \n', error);
       return error;
     });
   }
  /**
   * Fetch all neighborhoods with proper error handling.
   */
   static fetchNeighborhoods() {
     return DBHelper.fetchRestaurants()
     .then((response)=>{
       const restaurants = response.restaurants;
       // Get all neighborhoods from all restaurants
       const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood);
       // Remove duplicates from neighborhoods
       const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i);
       return uniqueNeighborhoods;
     })
     .catch(function(error) {
       console.log('Looks like there was a problem: \n', error);
       return error;
     });
   }

  /**
   * Fetch all cuisines with proper error handling.
   */
   static fetchCuisines() {
     // Fetch all restaurants
     return DBHelper.fetchRestaurants()
     .then((response)=>{
       const restaurants = response.restaurants;
       // Get all cuisines from all restaurants
       const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type);
       // Remove duplicates from cuisines
       const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i);
       return uniqueCuisines;
     })
     .catch(function(error) {
       console.log('Looks like there was a problem: \n', error);
       return error;
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
    return (`/img/${restaurant.photograph}`);
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
