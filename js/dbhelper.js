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
   * Server URL.
   */
  static get SERVER_URL() {
    const port = 1337;
    return `http://localhost:${port}`;
  }

  /**
   * Fetch all restaurants.
   */
  static fetchRestaurants() {
    const url = `${DBHelper.SERVER_URL}/restaurants`;
    return fetch(url).then(resp => resp.json());
  }

  /**
   * Fetch a restaurant by its ID.
   */
  static fetchRestaurantById(id) {
    const url = `${DBHelper.SERVER_URL}/restaurants/${id}`;
    return fetch(url).then(resp => resp.json());
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

}
