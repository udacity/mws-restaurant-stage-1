/**
 * Common database helper functions.
 */
class DBHelper {

  static get RESTAURANT_STORE_NAME(){
    return 'restaurant-details'
  }

  constructor(){
    this.dbPromise = idb.open(DBHelper.RESTAURANT_STORE_NAME, 1, (upgradeDb)=>{
      switch(upgradeDb.oldVersion){
        case 0:
          var restaurantStore = upgradeDb.createObjectStore('restaurant-details', {keyPath:'id'});
          restaurantStore.createIndex('by-neighborhood', 'neighborhood');
          restaurantStore.createIndex('by-cuisine', 'cuisine_type')
      }
    })

  }

  // populate the local IndexedDB database
  populateOfflineDatabase(){
    return fetch(DBHelper.DATABASE_URL)
      .then((response)=>{ return response.json(); })
      .then((restaurants)=>{ return Promise.all(restaurants.map(this.addRecord, this)) })
      .then(()=>{ console.log(`Database filled`) })
      .catch((err)=>{ console.error(`Database not filled : ${err.message}`) })
  }

  addRecord(restaurantDetails){
    return this.dbPromise.then((db)=>{
      var tx = db.transaction('restaurant-details', 'readwrite');
      var listStore = tx.objectStore('restaurant-details');
      listStore.put(restaurantDetails)
      return tx.complete;
    })
  }
  
  getRestaurants(){
    return this.dbPromise.then((db)=>{
      let tx = db.transaction('restaurant-details')
      let restaurantDetailsStore = tx.objectStore('restaurant-details')
      return restaurantDetailsStore.getAll();
    })
  }

  getRestaurantById(restaurantId, callback){ 
    return this.dbPromise.then((db)=>{  // try to get it from the local database
      let tx = db.transaction(DBHelper.RESTAURANT_STORE_NAME)
      let restaurantDetailsStore = tx.objectStore(DBHelper.RESTAURANT_STORE_NAME)
      return restaurantDetailsStore.get(restaurantId)
    }).then((response)=>{ // if nothing from the local database - get from the network
      return (response != undefined)
        ? response
        : fetch(`${DBHelper.DATABASE_URL}/${restaurantId}`) // grab the restaurant from the database
            .then(response => response.json()) // unwrap the json
            .then(response => { // store the response
              this.addRecord(response);
              return response
            })
    })
  }

  getRestaurantsByCuisine(cuisine){
    return this.dbPromise.then((db)=>{
      let tx = db.transaction(DBHelper.RESTAURANT_STORE_NAME);
      let restaurantDetailsStore = tx.objectStore(DBHelper.RESTAURANT_STORE_NAME);

      return restaurantDetailsStore.index('by-cuisine').getAll(cuisine)
    })
  }

  getRestaurantsByNeighborhood(neighborhood){
    return this.dbPromise.then((db)=>{
      let tx = db.transaction(DBHelper.RESTAURANT_STORE_NAME);
      let restaurantDetailsStore = tx.objectStore(DBHelper.RESTAURANT_STORE_NAME);

      return restaurantDetailsStore.index('by-neighborhood').getAll(neighborhood);
    })
  }

  getRestaurantsByCuisineAndNeighborhood(cuisine, neighborhood, numRecords){

    return this.dbPromise.then((db)=>{
      let tx = db.transaction(DBHelper.RESTAURANT_STORE_NAME);
      let restaurantDetailsStore = tx.objectStore(DBHelper.RESTAURANT_STORE_NAME)
      let restaurants = [];

      restaurantDetailsStore.index('by-cuisine').openCursor(cuisine, "next")
        .then(function checkRestaurant(cursor){
          if(!cursor || restaurants.length >= numRecords ) return; 
          if(cursor.value.neighborhood == neighborhood
              || neighborhood == undefined ) restaurants.push(cursor.value)
          return cursor.continue().then( checkRestaurant )
        })
      
      return tx.complete.then( () => restaurants )
    })

  }

  getCuisines(){
    return this.dbPromise.then((db)=>{
      let tx = db.transaction(DBHelper.RESTAURANT_STORE_NAME)
      let restaurantDetailsStore = tx.objectStore(DBHelper.RESTAURANT_STORE_NAME)
      let cuisineKeys = [];

      restaurantDetailsStore.index('by-cuisine').openCursor(null, "nextunique")
        .then(function collectKeys(cursor){
          if(!cursor) return; // return if we get to the end

          cuisineKeys.push(cursor.key);

          return cursor.continue().then( collectKeys ) // keep going
        })

      return tx.complete.then(() => {
        return cuisineKeys
      } ) 
    })
  }

  getNeighborhoods(){
    return this.dbPromise.then((db)=>{
      let tx = db.transaction(DBHelper.RESTAURANT_STORE_NAME)
      let restaurantDetailsStore = tx.objectStore(DBHelper.RESTAURANT_STORE_NAME)
      let neighborhoods = [];

      restaurantDetailsStore.index('by-neighborhood').openCursor(null, "nextunique")
        .then(function collectKeys(cursor){
          if(!cursor) return; // return if we get to the end
          neighborhoods.push(cursor.key);
          return cursor.continue().then( collectKeys ) // keep going
        })

      return tx.complete.then(() => {
        return neighborhoods
      } ) 
    })
  }

  /**
   * Database URL.
   * Change this to restaurants.json file location on your server.
   */
  static get DATABASE_URL() {
    const port = 1337 // Change this to your server port
    return `http://localhost:${port}/restaurants`;
  }

  /**
   * Fetch all restaurants.
   */
  static fetchRestaurants(callback) {
    // TODO: - how to deal with a failed fetch request to data source
    let xhr = new XMLHttpRequest();
    xhr.open('GET', DBHelper.DATABASE_URL);
    xhr.onload = () => {
      if (xhr.status === 200) { // Got a success response from server!
        const restaurants = JSON.parse(xhr.responseText);
        callback(null, restaurants);
      } else { // Oops!. Got an error from server.
        // grab the data from the local database
        const error = (`Request failed. Returned status of ${xhr.status}`);
        callback(error, null);
      }
    };
    xhr.send();
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
    return (restaurant.photograph != undefined)
      ? `/img/${restaurant.photograph}`
      : '/img/noneProvided'
  }
  static imageAltTextForRestaurant(restaurant){
    return (restaurant.photoAltText != undefined)
      ? restaurant.photoAltText
      : `picture of ${restaurant.name} premises`  
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
