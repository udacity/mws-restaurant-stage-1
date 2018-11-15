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

  static get DATABASE_URL_REVIEWS() {
    const port = 1337 // Change this to your server port
    return `http://localhost:${port}/reviews`;
  }

  

  /**
   * Fetch all restaurants.
   */
  static fetchRestaurants(callback) { 
    console.log('fetch rests');
     // openLocalDataBase();
      //var restaurants = fetchRestaurantsFromLocalDatabase();
      DBHelper.fetchRestaurantsFromLocalDatabase().then(restaurants => {
          if( restaurants.length>0)
              return callback(null, restaurants);
          else
              DBHelper.fetchRestaurantsFromServer(callback);
      })
    //  restaurants.then(function(restaurants){
      //if (restaurants==undefined || restaurants.length==0)
        
     // else
       // callback(null, Promise.resolve(restaurants));
  //})
  }
    
  static fetchRestaurantsFromServer(callback) {
     fetch(DBHelper.DATABASE_URL).then(function(response) {
         //DBHelper.openLocalDataBase();
         return response.json();
        }).then(function(restaurants) {
         console.log('got rests from server');
            DBHelper.AddRestaurantsToLocalDatabase(restaurants);
            callback(null, restaurants);
        }).catch( (error) => {
            console.log(`Request failed. ${error}`);
            callback(error, null);
        });
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
     if (restaurant.photograph!= undefined)
      return (`/img/${restaurant.photograph}.jpg`);
    else
      return (`/img/undefined.jpg`);
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
  //openLocalDataBase = () => {
 static OpenLocalDatabase(callback) {
 if (!navigator.serviceWorker) {
    return Promise.resolve();
  }
    return idb.open('local-db', 1, function(upgradeDb) {
      var keyValStore2 = upgradeDb.createObjectStore('restaurantList');
    //keyValStore2.put("world", "hello");
    console.log('opened db');
   });
  //return this._dbPromise;
 }
    
static AddRestaurantsToLocalDatabase(restaurants) {
  if (!navigator.serviceWorker) {
    return Promise.resolve();
  }
  var dbPromise = DBHelper.OpenLocalDatabase();

  return dbPromise.then(function(db) {
   if (!db) return;

     var tx = db.transaction('restaurantList', 'readwrite');
     var store = tx.objectStore('restaurantList');
     //store.put("restaurant", 'photograph')
      restaurants.forEach(function(restaurant) {
          //console.log(restaurant.photograph);
          var tx = db.transaction('restaurantList', 'readwrite');
          var store = tx.objectStore('restaurantList');
          store.put(restaurant, restaurant.id);
        });
      return tx.complete;
        //callback(null, results);
    });
 // });
 }
    
static fetchRestaurantsFromLocalDatabase () {

  var dbPromise = DBHelper.OpenLocalDatabase();
  return dbPromise.then(function (db) {
    if (!db) return;

     var tx = db.transaction('restaurantList', 'readonly');
     var store = tx.objectStore('restaurantList');
     return store.getAll();
     //callback(null, restaurants);
     //return tx.complete;
  });
}

  /**
   * Fetch reviews
   */
  static fetchReviewsByRestaurantId(restaurantID) {
    // Fetch all restaurants
    const DATABASE_URL_ALL_REVIEWS_FOR_RESTAURANT= DBHelper.DATABASE_URL_REVIEWS + '/?restaurant_id=' + restaurantID;

    fetch(DATABASE_URL_ALL_REVIEWS_FOR_RESTAURANT).then((response) => {
      return response.json();  
     })
    //  .then( (reviews) => {
    //   return reviews;
    // });
  }

}

