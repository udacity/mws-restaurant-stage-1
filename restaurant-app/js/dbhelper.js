let fetchStatus = 0;
class IDbOperationsHelper {
  static checkForIDbSupport() {
    if (!("indexedDB" in window)) {
      return 0;
    } else {
      return 1;
    }
  }
  static openIDb(name, version, objectStoreName) {
    const dbPromise = idb.open(name, version, upgradeDB => {
      upgradeDB.createObjectStore(objectStoreName, { autoIncrement: true });
    });
    return dbPromise;
  }
  static addToDb(dbPromise, objectStoreName, permision, jsonData) {
    dbPromise
      .then(db => {
        const transact = db.transaction(objectStoreName, permision);
        //Add all the json content here
        transact.objectStore(objectStoreName).put(jsonData);
        //
        return transact.complete;
      })
      .then(response => {
        console.log("RESTAURANT SAVED TO IDb");
      });
  }
  static getAllData(dbPromise, transactionName, objectStoreName) {
    let responseArrayPromise = dbPromise.then(db =>
      db
        .transaction(transactionName)
        .objectStore(objectStoreName)
        .getAll()
    );
    responseArrayPromise.then(arry => {
      IDbOperationsHelper.setRestaurantsData(arry);
    });
  }
  //
  static getRestaurantsFromServer(
    dbPromise,
    objectStoreName,
    permision,
    callback
  ) {
    let url = "http://localhost:1337/restaurants";
    fetch(url)
      .then(function(response) {
        return response.json();
      })
      .then(function(responseJson) {
        responseJson.forEach(restaurant => {
          restaurant = IDbOperationsHelper.addMissingData(restaurant);
        });
        if (fetchStatus != 1) {
          fetchStatus = 1;
          responseJson.forEach(restaurantData => {
            //Here we got json data for every single restaurant
            //Now we add it to IDb
            IDbOperationsHelper.addToDb(
              dbPromise,
              objectStoreName,
              permision,
              restaurantData
            );
          });
        }
        console.log(responseJson);
        callback(null, responseJson);
      });
  }
  //
  static getRestaurantsData(callback) {
    const idbName = "restaurants-data";
    const dbVersion = 1;
    const objectStoreNameString = "restaurants";
    const transactionNameString = "restaurants";
    const dbPermission = "readwrite";
    let dbPromise = IDbOperationsHelper.openIDb(
      idbName,
      dbVersion,
      objectStoreNameString
    );
    dbPromise
      .then(db =>
        db
          .transaction(transactionNameString)
          .objectStore(objectStoreNameString)
          .getAll()
      )
      .then(responseObejcts => {
        //Here the response is an array
        if (responseObejcts.length <= 0) {
          IDbOperationsHelper.getRestaurantsFromServer(
            dbPromise,
            objectStoreNameString,
            dbPermission,
            callback
          );
        } else {
          callback(null, responseObejcts);
        }
      });
  }
  static addMissingData(restaurantJson) {
    if (!isNaN(restaurantJson.photograph)) {
      restaurantJson.photograph = restaurantJson.photograph + ".jpg";
    } else {
      restaurantJson["photograph"] = restaurantJson.id + ".jpg";
    }
    return restaurantJson;
  }
}

/**
 * Common database helper functions.
 */
class DBHelper {
  /**
   * Database URL.
   * Change this to restaurants.json file location on your server.
   */
  static get NEW_URL() {
    return `http://localhost:1337/restaurants`;
  }
  /**
   * Fetch a restaurant by its ID.
   */
  static fetchRestaurantById(id, callback) {
    // fetch all restaurants with proper error handling.
    IDbOperationsHelper.getRestaurantsData((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        const restaurant = restaurants.find(r => r.id == id);
        if (restaurant) {
          // Got the restaurant
          callback(null, restaurant);
        } else {
          // Restaurant does not exist in the database
          callback("Restaurant does not exist", null);
        }
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine type with proper error handling.
   */
  static fetchRestaurantByCuisine(cuisine, callback) {
    // Fetch all restaurants  with proper error handling
    IDbOperationsHelper.getRestaurantsData((error, restaurants) => {
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
    IDbOperationsHelper.getRestaurantsData((error, restaurants) => {
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
  static fetchRestaurantByCuisineAndNeighborhood(
    cuisine,
    neighborhood,
    callback
  ) {
    // Fetch all restaurants
    IDbOperationsHelper.getRestaurantsData((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        let results = restaurants;
        if (cuisine != "all") {
          // filter by cuisine
          results = results.filter(r => r.cuisine_type == cuisine);
        }
        if (neighborhood != "all") {
          // filter by neighborhood
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
    IDbOperationsHelper.getRestaurantsData((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all neighborhoods from all restaurants
        const neighborhoods = restaurants.map(
          (v, i) => restaurants[i].neighborhood
        );
        // Remove duplicates from neighborhoods
        const uniqueNeighborhoods = neighborhoods.filter(
          (v, i) => neighborhoods.indexOf(v) == i
        );
        callback(null, uniqueNeighborhoods);
      }
    });
  }

  /**
   * Fetch all cuisines with proper error handling.
   */
  static fetchCuisines(callback) {
    // Fetch all restaurants
    IDbOperationsHelper.getRestaurantsData((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all cuisines from all restaurants
        const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type);
        // Remove duplicates from cuisines
        const uniqueCuisines = cuisines.filter(
          (v, i) => cuisines.indexOf(v) == i
        );
        callback(null, uniqueCuisines);
      }
    });
  }

  /**
   * Restaurant page URL.
   */
  static urlForRestaurant(restaurant) {
    return `./restaurant.html?id=${restaurant.id}`;
  }

  /**
   * Restaurant image URL.
   */
  static imageUrlForRestaurant(restaurant) {
    return `/img/${restaurant.photograph}`;
  }

  /**
   * Map marker for a restaurant.
   */
  static mapMarkerForRestaurant(restaurant, map) {
    const marker = new L.marker(
      [restaurant.latlng.lat, restaurant.latlng.lng],
      {
        title: restaurant.name,
        alt: restaurant.name,
        url: DBHelper.urlForRestaurant(restaurant)
      }
    );
    marker.addTo(newMap);
    return marker;
  }
}