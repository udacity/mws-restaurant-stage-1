import idb from 'idb';

let dbPromise = idb.open("mws-restaurant-review", 3, upgradeDB => {
  switch (upgradeDB.oldVersion) {
    case 0:
      upgradeDB.createObjectStore("restaurants", { keyPath: "id" });
    case 1:
    {
      const reviewsStore = upgradeDB.createObjectStore("reviews", { keyPath: "id" });
      reviewsStore.createIndex("restaurant_id", "restaurant_id");
    }
    case 2:
    upgradeDB.createObjectStore("queuedData", {keyPath: "id", autoIncrement: true});
  }
});

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


  static get DATABASE_REVIEWS_URL() {
    const port = 1337; // Change this to your server port
    return `http://localhost:${port}/reviews`;
  }

  
  /**
   * Fetch all restaurants.
   */
  static fetchRestaurants(callback, restaurantId) {
    let url = DBHelper.DATABASE_URL;
    if (restaurantId)
      url = `${DBHelper.DATABASE_URL}/${restaurantId}`;  
    var request = new Request(url, {method: 'GET'});

    fetch(request).then(response => {
      response.json().then( restaurants => {
        callback(null, restaurants);
      });
    })
    .catch((error) => {
      callback(`Request failed. Error reponse: ${error}`, null);
    });
    // let xhr = new XMLHttpRequest();
    // xhr.open('GET', DBHelper.DATABASE_URL);
    // xhr.onload = () => {
    //   if (xhr.status === 200) { // Got a success response from server!
    //     const json = JSON.parse(xhr.responseText);
    //     const restaurants = json.restaurants;
    //     callback(null, restaurants);
    //   } else { // Oops!. Got an error from server.
    //     const error = (`Request failed. Returned status of ${xhr.status}`);
    //     callback(error, null);
    //   }
    // };
    // xhr.send();
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
        //const restaurant = restaurants;
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
    if(restaurant.photograph)
      return (`/img/${restaurant.photograph}.jpg`);
    return (`/img/${restaurant.id}.jpg`);
  }

  /**
   * Map marker for a restaurant.
   */
  static mapMarkerForRestaurant(restaurant, map) {
    // https://leafletjs.com/reference-1.3.0.html#marker  
    const marker = new L.marker([restaurant.latlng.lat, restaurant.latlng.lng],
      {
        title: restaurant.name,
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


   /**
   * Fetch all reviews by restaurant id
   */
  static fetchReviewsById(restaurantId, callback) {
    // Fetch reviews for a restaurant id
    const url = `${DBHelper.DATABASE_REVIEWS_URL}/?restaurant_id=${restaurantId}`;
    fetch(url, {method: "GET"}).then(response => {
      if (!response.clone().ok && !response.clone().redirected) {
        throw "No reviews yet!";
      }
      response.json().then(reviews => {
          callback(null, reviews);
        })
    }).catch(error => callback(`Request failed. Error reponse: ${error}`, null));
  }

  static updateFavoriteSelection(id, newState, callback) {
   
    const url =  `${DBHelper.DATABASE_URL}/${id}/?is_favorite=${newState}`;
    const method = "PUT";
    DBHelper.storeLatestFavouriteRestaurant(id, {"is_favorite": newState});
    DBHelper.addRequestToQueuedData(url, method);   
    callback(null, {id, value: newState});
    // fetch(url, {method}).then(response => {
     
    //   callback(null, response);
      
    // }).catch(error => callback(`Request failed. Error reponse: ${error}`, null));
    
  }

  static saveReview(id, name, rating, comment, callback) {
    // Create the POST body
    const request = {
      restaurant_id: id,
      name: name,
      rating: rating,
      comments: comment
    }  
	
	const url = `${DBHelper.DATABASE_REVIEWS_URL}`;
    const method = "POST";
    DBHelper.storeLatestReview(id,request);
    DBHelper.addRequestToQueuedData(url,method, request);
    callback(null,id);
    // fetch(url, {method, body: request}).then(response => {
     
    //   callback(null, response);
      
    // }).catch(error => callback(`Request failed. Error reponse: ${error}`, null));
	
  }

  static storeLatestFavouriteRestaurant(id, latestObj) {
    if(!dbPromise) dbPromise = idb.open("mws-restaurant-review");
    dbPromise.then(db => {
      console.log("Getting db transaction");
      const tx = db.transaction("restaurants", "readwrite");
      const value = tx
        .objectStore("restaurants")
        .get("-1")
        .then(value => {
          if (!value) return;
          
          const data = value.data;
          const restaurant = data.filter(r => r.id === id)[0];
          if (!restaurant)
            return;
          const keys = Object.keys(latestObj);
          keys.forEach(k => {
            restaurant[k] = latestObj[k];
          })

          dbPromise.then(db => {
            const tx = db.transaction("restaurants", "readwrite");
            tx
              .objectStore("restaurants")
              .put({id: "-1", data: data});
            return tx.complete;
          })
        })
    })

    dbPromise.then(db => {
      console.log("Getting db transaction");
      const tx = db.transaction("restaurants", "readwrite");
      const value = tx
        .objectStore("restaurants")
        .get(id + "")
        .then(value => {
          if (!value) return;
          const restaurantObj = value.data;
          console.log("Specific restaurant obj: ", restaurantObj);
          if (!restaurantObj)
            return;
          const keys = Object.keys(latestObj);
          keys.forEach(k => {
            restaurantObj[k] = latestObj[k];
          })

          dbPromise.then(db => {
            const tx = db.transaction("restaurants", "readwrite");
            tx
              .objectStore("restaurants")
              .put({
                id: id + "",
                data: restaurantObj
              });
            return tx.complete;
          })
        })
    })
  }

  static storeLatestReview(id, bodyObj) {
    dbPromise.then(db => {
       const tx = db.transaction("reviews", "readwrite");
       const store = tx.objectStore("reviews");
       store.put({
         id: Date.now(),
         "restaurant_id": id,
         data: bodyObj
       });
       return tx.complete;
     })
   }

   static addRequestToQueuedData(url, method, body) {
    const dbPromise = idb.open("mws-restaurant-review");
    dbPromise.then(db => {
      const tx = db.transaction("queuedData", "readwrite");
      tx
        .objectStore("queuedData")
        .put({
          data: {
            url,
            method,
            body
          }
        })
    })
      .catch(error => {})
      .then(DBHelper.pendingQueuedData());
  }
  
  
   static pendingQueuedData() {
    DBHelper.saveQueuedData(DBHelper.pendingQueuedData);
  }

  static saveQueuedData(callback) {
    let url;
    let method;
    let body;
    if(!dbPromise) dbPromise = idb.open("mws-restaurant-review");
    dbPromise.then(db => {
      if (!db.objectStoreNames.length) {
        db.close();
        return;
      }

      const tx = db.transaction("queuedData", "readwrite");
      tx
        .objectStore("queuedData")
        .openCursor()
        .then(cursor => {
          if (!cursor) {
            return;
          }
          const value = cursor.value;
          url = cursor.value.data.url;
          method = cursor.value.data.method;
          body = cursor.value.data.body;

          if ((!url || !method) || (method === "POST" && !body)) {
            cursor
              .delete()
              .then(callback());
            return;
          };

          const properties = {
            body: JSON.stringify(body),
            method: method
          }
          console.log("sending post from queue: ", properties);
          fetch(url, properties).then(response => {
            if (!response.ok && !response.redirected) {
              return;
            }
          })
            .then(() => {
              const deltx = db.transaction("queuedData", "readwrite");
              deltx
                .objectStore("queuedData")
                .openCursor()
                .then(cursor => {
                  cursor
                    .delete()
                    .then(() => {
                      callback();
                    })
                })
              console.log("deleted pending item from queue");
            })
        })
        .catch(error => {
          console.log(error);
          return;
        })
    })
  }

}

window.DBHelper = DBHelper;