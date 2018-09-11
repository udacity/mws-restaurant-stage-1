/**
 * Common database helper functions.
 */
//import idb from 'idb';
class DBHelper {

  //adapted from Wittr and Jake Archibald IDB examples
  static openDatabase() {
    // console.log('in open database');
      this.dbPromise = idb.open('mws', 3, upgradeDB => {
        // Note: we don't use 'break' in this switch statement,
        // the fall-through behaviour is what we want.
        switch (upgradeDB.oldVersion) {
          case 0:
            upgradeDB.createObjectStore('objs', {keyPath: 'id'});
          case 1:
            var objStore = upgradeDB.transaction.objectStore('objs');
            objStore.createIndex('updateDate', 'updatedAt');
          case 2:
            upgradeDB.createObjectStore('revs', {keyPath: 'id'});
            const revStore = upgradeDB.transaction.objectStore('revs');
            revStore.createIndex('restId','restaurant_id');
            revStore.createIndex('updateDate','updatedAt');
            console.log('revs created');
          }
      });
      return this.dbPromise;
    }
  
  // Given json list of restaurants data store in indexedDB
  // read google promises primer then wrote this
  static SaveRestaurants () {
    return Promise.all([this.openDatabase(),this.fetchRestaurants()]).then(values => {
// console.log('promises resolved');
      const db=values[0];
      const restaurants=values[1];
      if (!db) {return};
      // console.log('starting transactions',restaurants);
      var tx = db.transaction('objs', 'readwrite');
      var store = tx.objectStore('objs');
      restaurants.forEach(function(restaurant) {
        store.put(restaurant);
        // console.log('saved', restaurant);
      });
      // console.log('all saved');
      return restaurants;
    });
  }

  // Given json list of restaurants data store in indexedDB
  // read google promises primer then wrote this
  static SaveReviews () {
    return Promise.all([this.openDatabase(),this.fetchReviews()]).then(values => {
// console.log('promises resolved');
      const db=values[0];
      const reviews=values[1];
      if (!db) {return};
      // console.log('starting transactions',restaurants);
      var tx = db.transaction('revs', 'readwrite');
      var store = tx.objectStore('revs');
      reviews.forEach(function(review) {
        store.put(review);
        // console.log('saved', restaurant);
      });
      console.log('all reviews saved',reviews);
      return reviews;
    });
  }

  /**
   * Database URL.
   * Change this to restaurants.json file location on your server.
   */
  static get DATABASE_URL() {
    const port = 1337 // Change this to your server port
    return `http://localhost:${port}`;
    // const port = 8080;
    // return `http://localhost:${port}/data/restaurants.json`; //old project 1 URL
  }

  /**
   * Fetch all restaurants from the server.
   */
  static fetchRestaurants() {
    return fetch(DBHelper.DATABASE_URL + '/restaurants').then((response) =>{
      if (!response.ok) {
        throw new Error('Response data not retrieved');
      }
      return response.json(); // return promise;
    })
    .catch((error) =>{
      // console.log('fetch error',error);
    });
    
  }
    
  /**
   * Fetch all reviews from the server.
   */
  static fetchReviews() {
    // Implemented after consulting Adnan Usman to convert to promise/fetch
    return fetch(DBHelper.DATABASE_URL + '/reviews').then((response) =>{
      if (!response.ok) {
        throw new Error('Response data not retrieved');
      }
      // reviews=response.json();
      // console.log('retrieved',reviews);
      return response.json(); // return promise;
    })
    .catch((error) =>{
      // console.log('fetch error',error);
    });
    
  }


  /**
   * Read all restaurants from IndexedDB.
   */
  static readRestauraunts(callback) {
    this.dbPromise.then(function(db) {
      if (!db) { return};
      return db.transaction('objs')
        .objectStore('objs').getAll();

    }).then((restaurants)=> {
      // console.log('data retrieved',restaurants);
      
      callback(null,restaurants);
    }).catch((error) =>{

      // console.log('fetch error',error);
      callback(error,null);
    });
  }

  /**
   * Read all restaurants from IndexedDB.
   */
  static readReviews() {
    
  return this.openDatabase().then(db => {
      if (!db) {console.log('no db'); return Promise.resolve()};
      let reviews=db.transaction('revs')
                    .objectStore('revs').getAll();
      console.log('read',reviews);
      return reviews;
    }).catch((error) =>{

      console.log('read reviews error',error);
    });
  }


  // /**
  //  * Fetch a restaurant by its ID.
  //  */
  static readRestaurauntsById(id, callback) {
    // fetch all restaurants with proper error handling.
    //attempted to retrieve single item but didn't get it to work
    //performance adequate return all and then filter so left as is
    DBHelper.readRestauraunts((error, restaurants) => {
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

  // /**
  //  * Fetch all reviews for a restaurant by its ID.
  //  */
  static readReviewsForRestaurant(restaurant_id) {
    return this.readReviews().then(reviews => {
      console.log('all reviews',reviews);
      const restaurant_reviews = reviews.filter(r => r.restaurant_id == restaurant_id);
      console.log('filtered reviews',restaurant_reviews);
      return Promise.resolve(restaurant_reviews);
    })
  }

  /**
   * Fetch a restaurant by its ID.
   */
  static readRestaurauntsByIdSingle(id, callback) {
//This was early attempt to to retrieve single item from IndexedDB
//didn't work so kept existing method
    this.dbPromise.then(db => {
      var results= db.transaction('objs')
        .objectStore('objs').get(id);
        // console.log('var is',results);
        return results;
    }).then((restaurant)=> {
      // console.log('calling back with ',restaurant);
      callback(null,restaurant);
    }).catch(error => {
      // console.log('fetch error',error);
      callback(error,null);
    });

  }

  /**
   * Fetch restaurants by a cuisine type with proper error handling.
   */
  static readRestaurauntsByCuisine(cuisine, callback) {
    // Fetch all restaurants  with proper error handling
    // console.log('rest by cuisine');
    DBHelper.readRestauraunts((error, restaurants) => {
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
    DBHelper.readRestauraunts((error, restaurants) => {
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
  static readRestaurauntsByCuisineAndNeighborhood(cuisine, neighborhood, callback) {
    // Fetch all restaurants
    // console.log('rest by cuis neigh');
    
    DBHelper.readRestauraunts((error, restaurants) => {
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
  static readNeighborhoods(callback) {
    // console.log('fetch neigh');
    DBHelper.readRestauraunts((error, restaurants) => {
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
  static readCuisine(callback) {
    // Fetch all restaurants
    // console.log('fetch cuis');
    DBHelper.readRestauraunts((error, restaurants) => {
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

