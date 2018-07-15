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

  static openDB() {// call this before every idb transaction
    return idb.open('mwsDb', 1, upgradeDB => {
      const reviews = upgradeDB.createObjectStore('reviews', {keyPath: 'id'});
    });
  }

  /**
   * Fetch all restaurants.
   */
  static fetchRestaurants(callback) {

    fetch(DBHelper.DATABASE_URL)
        .then(response => response.json())
        .then(json => callback(null, json))
        .catch(err => callback(err, null));
  }

  /**
   * Fetch a restaurant by its ID.
   */
  static fetchRestaurantById(id, callback) {
    // fetch all restaurants with proper error handling.
    DBHelper.openDB().then(db => {
        const transaction = db.transaction('reviews');
        const reviewsObjStore = transaction.objectStore('reviews');

        //Parse int because the keys are actually int...not string
        reviewsObjStore.get(parseInt(id))
          .then(val => {
            if(val){
              callback(null, val);
            }
            else{
              DBHelper.fetchRestaurantByIdFromDataServer(id, callback);
            }
        });
      })
    //If db fails, then always retrieve from server
    .catch(err => DBHelper.fetchRestaurantByIdFromDataServer(id, callback));
  }

//Note to self: this is utilizing in-line key 'id', don't put a second arg otherwise it's consider an out-of-line key
//which means you are specifying the id rather than extracting it "in-line"
 static addRestaurantInfoToIndexDb(value){
  DBHelper.openDB().then(db => {
    const transaction = db.transaction('reviews', 'readwrite');
    const reviewsObjStore = transaction.objectStore('reviews');
    reviewsObjStore.put(value);
  });
 }

 static fetchRestaurantByIdFromDataServer(id, callback){
    DBHelper.fetchRestaurants((error, restaurants) => {
    if (error) {
      callback(error, null);
    } else {
      const restaurant = restaurants.find(r => r.id == id);
      if (restaurant) { 
        DBHelper.addRestaurantInfoToIndexDb(restaurant);
        callback(null, restaurant);
      } else { 
        callback('Restaurant does not exist', null);
      }
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
   * Restaurant page URL.
   */
  static urlForRestaurant(restaurant) {
    return (`./restaurant.html?id=${restaurant.id}`);
  }

  /**
   * Restaurant image URL.
   */
  static imageUrlForRestaurant(restaurant) {
    return (`/images/${restaurant.id}`);
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
