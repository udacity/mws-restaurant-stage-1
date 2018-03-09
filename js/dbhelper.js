/**
 * Common database helper functions.
 * Implementing IndexedDB Promised library by https://github.com/jakearchibald/idb.git
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
  static openDB() {
    return idb.open('adamoDB', 1, upgradeDB => {
      const rests =upgradeDB.createObjectStore('restaurants', {keyPath: 'id'});
    });
  }

  static saveRestaurantsToDB(restaurants) {
    //save data from db api to indexedDB for offline use
    if (!('indexedDB' in window)) {
      return null;
    }

    return DBHelper.openDB().then(db => {
      //console.log(db);
      const tx = db.transaction('restaurants', 'readwrite');
      const store = tx.objectStore('restaurants');
      return Promise.all(restaurants.map(restaurant => store.put(restaurant))).then(() => {return restaurants})
      .catch(() => {
        tx.abort();
        throw Error('Restaurants were not added to db');
      });
    });
  }

  static getLocalRestaurantsData(){
    //get all restaurants from indexedDB when offline
    if (!('indexedDB' in window)) {
      return null;
    }
    return DBHelper.openDB().then(db => {
      return db.transaction('restaurants')
        .objectStore('restaurants').getAll();
    }).then(restaurants => {return restaurants});
  }

  static getLocalRestaurantsDataById(id){
    //get restaurant by id from indexedDB when offline
    if (!('indexedDB' in window)) {
      return null;
    }
    return DBHelper.openDB().then(db => {
      return db.transaction('restaurants')
        .objectStore('restaurants').get(parseInt(id));
    }).then(restaurant => {return restaurant});
  }

  /**
   * Fetch all restaurants.
   */
  static fetchRestaurants(callback) {

   fetch(DBHelper.DATABASE_URL).then(response => response.json())
    .then(restaurants => DBHelper.saveRestaurantsToDB(restaurants))
    .then(restaurants => callback(null,restaurants))
    .catch(err => {
      //no network get them from indexedDB
      DBHelper.getLocalRestaurantsData().then(restaurants => callback(null,restaurants))
      }
    );

  }

  /**
   * Fetch a restaurant by its ID.
   */
  static fetchRestaurantById(id, callback) {

  fetch(`${DBHelper.DATABASE_URL}${id}`).then(response => response.json())
   .then(restaurant => callback(null,restaurant))
   .catch(err => {
    //no network get them from indexedDB
    DBHelper.getLocalRestaurantsDataById(id).then(restaurant => callback(null,restaurant))
    }
  );

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
  static imageUrlForRestaurant(restaurant,isthumb=false) {
    let imgname='noimage';//if db has no image info, display default no image
    let imgextension='.jpg';//if we detect chrome then we serve .webp
    if(navigator.userAgent.indexOf('Chrome') > -1){
      imgextension='.webp';
    }
    if(restaurant.photograph){
      imgname=restaurant.photograph;
    }
    switch (isthumb)
	  {
			case false :
        return (`img/${imgname}${imgextension}`);
        break;
      case true :
        return (`img/small/${imgname}${imgextension}`);
        break;
  	}


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
