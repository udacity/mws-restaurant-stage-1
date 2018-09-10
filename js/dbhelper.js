/**
 * Common database helper functions.
 */
//import idb from 'idb';
class DBHelper {
  static openDatabase() {
console.log('in open database');
    this.dbPromise = idb.open('mws', 2, upgradeDB => {
      // Note: we don't use 'break' in this switch statement,
      // the fall-through behaviour is what we want.
      switch (upgradeDB.oldVersion) {
        case 0:
          upgradeDB.createObjectStore('objs', {keyPath: 'id'});
        case 1:
          var objStore = upgradeDB.transaction.objectStore('objs');
          objStore.createIndex('updateDate', 'updatedAt');
      }
    });
  
  }
  // Given json list of restaurants data store in indexedDB
  static SaveRestaurants () {
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        console.log('Save Error',error);
        // callback(error, null);
      } else {
        // Filter restaurants to have only given cuisine type
        this.dbPromise.then(function(db) {
          if (!db) return;
      
          var tx = db.transaction('objs', 'readwrite');
          var store = tx.objectStore('objs');
          restaurants.forEach(function(restaurant) {
            store.put(restaurant);
            // console.log('saved', restaurant);
          });
        });
          }
    });

  }

  /**
   * Database URL.
   * Change this to restaurants.json file location on your server.
   */
  static get DATABASE_URL() {
    const port = 1337 // Change this to your server port
    return `http://localhost:${port}/restaurants`;
    // const port = 8080;
    // return `http://localhost:${port}/data/restaurants.json`; //old project 1 URL
  }

  /**
   * Fetch all restaurants.
   */
  static fetchRestaurants(callback) {
// Implemented after consulting Adnan Usman to convert
// XHR to fetch 
    fetch(DBHelper.DATABASE_URL).then((response) =>{
      if (!response.ok) {
        throw new Error('Response data not retrieved');
      }
      return response.json(); // return promise;
    //  return JSON.parse(response.text);
    }).then((jsonData)=> {
      const returnData=jsonData;
      callback(null,returnData);
    }).catch((error) =>{
      console.log('fetch error',error);
      callback(error,null);
    });
    
  }

  /**
   * Fetch all restaurants from IndexedDB.
   */
  static fetchRestaurantsIdb(callback) {
    this.dbPromise.then(function(db) {
      if (!db) { console.log('no db'); return};
      return db.transaction('objs')
        .objectStore('objs').getAll();

    }).then((restaurants)=> {
      console.log('data retrieved',restaurants);
      callback(null,restaurants);
    }).catch((error) =>{

      console.log('fetch error',error);
      callback(error,null);
    });
  }

  // /**
  //  * Fetch a restaurant by its ID.
  //  */
  static fetchRestaurantByIdIdb(id, callback) {
    // fetch all restaurants with proper error handling.
    //attempted to retrieve single item but didn't get it to work
    //performance adequate return all and then filter so let as is
    DBHelper.fetchRestaurantsIdb((error, restaurants) => {
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
   * Fetch a restaurant by its ID.
   */
  static fetchRestaurantByIdIdbSingle(id, callback) {
//This was early attempt to to retrieve single item from IndexedDB
//didn't work so kept existing method
    this.dbPromise.then(db => {
      var results= db.transaction('objs')
        .objectStore('objs').get(id);
        console.log('var is',results);
        return results;
    }).then((restaurant)=> {
      console.log('calling back with ',restaurant);
      callback(null,restaurant);
    }).catch(error => {
      console.log('fetch error',error);
      callback(error,null);
    });

  }

  /**
   * Fetch restaurants by a cuisine type with proper error handling.
   */
  static fetchRestaurantByCuisine(cuisine, callback) {
    // Fetch all restaurants  with proper error handling
    // console.log('rest by cuisine');
    DBHelper.fetchRestaurantsIdb((error, restaurants) => {
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
    // console.log('rest by neigh');
    DBHelper.fetchRestaurantsIdb((error, restaurants) => {
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
    // console.log('rest by cuis neigh');
    
    DBHelper.fetchRestaurantsIdb((error, restaurants) => {
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
    // console.log('fetch neigh');
    DBHelper.fetchRestaurantsIdb((error, restaurants) => {
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
    // console.log('fetch cuis');
    DBHelper.fetchRestaurantsIdb((error, restaurants) => {
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
    //missing photo ID in JSON data
    //use simple fix knowning photo "ID" matches restaurant ID and use that ID if photo ID is missing
    let imageID=restaurant.photograph;
    if (!imageID) {
      imageID=restaurant.id;
    }
    // console.log('usingID=',imageID);
    return (`/img/${imageID}.jpg`);
  }


  /**
   * Restaurant image srcset URL.
   */
  static imageUrlForRestaurantSrcset(restaurant) {
    //missing photo ID in JSON data
    //use simple fix knowning photo "ID" matches restaurant ID and use that ID if photo ID is missing
    let imageID=restaurant.photograph;
    if (!imageID) {
      imageID=restaurant.id;
    }
    let imgURL=`/img/${imageID}-sm.jpg 400w, /img/${imageID}-med.jpg 800w, /img/${imageID}-lg.jpg 1600w `;
    return (imgURL);
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

