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
  static get DATABASE_REVIEWS_URL() {
    const port = 1337 // Change this to your server port
        return `http://localhost:${port}/reviews/`;
  }
  static openDB() {
    return idb.open('adamoDB', 4, upgradeDB => {
      switch (upgradeDB.oldVersion) {
        case 0:
        const rests =upgradeDB.createObjectStore('restaurants', {keyPath: 'id'});
        case 1:
        const reviews =upgradeDB.createObjectStore('reviews', {keyPath: 'id'});
        reviews.createIndex('restaurant_id', 'restaurant_id', {unique: false});
        case 2:
        //create a table to hold favorite actions when offline
        const pendingFavorite =upgradeDB.createObjectStore('pending_favorite', {keyPath: 'id',autoIncrement:true});
        case 3:
        //create a table to hold favorite actions when offline
        const pendingReviews =upgradeDB.createObjectStore('pending_reviews', {keyPath: 'id',autoIncrement:true});
        pendingReviews.createIndex('restaurant_id', 'restaurant_id', {unique: false});
      }

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

  static saveReviewsToDB(reviews) {
    //save data from db api to indexedDB for offline use
    if (!('indexedDB' in window)) {
      return null;
    }

    return DBHelper.openDB().then(db => {
      //console.log(db);
      const tx = db.transaction('reviews', 'readwrite');
      const store = tx.objectStore('reviews');
      return Promise.all(reviews.map(review => store.put(review))).then(() => {return reviews})
      .catch(() => {
        tx.abort();
        throw Error('Restaurants were not added to db');
      });
    });
  }

  static savePendingFavorite(objs) {
    //save data from db api to indexedDB for offline use
    if (!('indexedDB' in window)) {
      return null;
    }

    return DBHelper.openDB().then(db => {
      //console.log(db);
      const tx = db.transaction('pending_favorite', 'readwrite');
      const store = tx.objectStore('pending_favorite');
      return Promise.all(objs.map(obj => store.put(obj))).then(() => {return objs})
      .catch(err => {
        tx.abort();
        throw Error('Favorites were not added to indexed db');
      });
    });
  }

  static savePendingReview(objs) {
    //save data from db api to indexedDB for offline use
    if (!('indexedDB' in window)) {
      return null;
    }

    return DBHelper.openDB().then(db => {
      //console.log(db);
      const tx = db.transaction('pending_reviews', 'readwrite');
      const store = tx.objectStore('pending_reviews');
      return Promise.all(objs.map(obj => store.put(obj))).then(() => {return objs})
      .catch(err => {
        tx.abort();
        throw Error('Reviews were not added to indexed db');
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


  static getLocalReviewsByRestaurantId(id){
    //get reviews by restaurant_id from indexedDB when offline
    if (!('indexedDB' in window)) {
      return null;
    }
    return DBHelper.openDB().then(db => {
      return db.transaction('reviews')
        .objectStore('reviews').index('restaurant_id').getAll(parseInt(id));
    }).then(reviews => {
      //we check for pendig_reviews when offline to show the users local review
      return DBHelper.openDB().then(db => {
        return db.transaction('pending_reviews')
          .objectStore('pending_reviews').index('restaurant_id').getAll(parseInt(id));
      }).then(pending_reviews => {
        //return merged array
        return [...reviews,...pending_reviews];
      })


    });
  }


  static syncOfflineData(){
    //send temp data to server and delete them locally
    //first we check if there are any pending favorites

   return DBHelper.openDB().then(db => {
      return db.transaction('pending_favorite')
        .objectStore('pending_favorite').getAll();
    }).then(favorites => {
      if(!favorites.length){
        return null;
      }
      return Promise.all(favorites.map(favorite => DBHelper.sendFavoritesToServer(favorite)))
    }).then(favorites => {
      if(!favorites){
        return null;
      }
      //delete all pending favorites from local db
      return DBHelper.openDB().then(db => {
        //console.log(db);
        const tx = db.transaction('pending_favorite', 'readwrite');
        const store = tx.objectStore('pending_favorite');
        return store.clear();
      });
    })
    .catch(err => {
        tx.abort();
        throw Error('Panding favorites were not sent to server');
        return null;
      }).then(() => {
      //sendReviewsToServer
      return DBHelper.openDB().then(db => {
          return db.transaction('pending_reviews')
            .objectStore('pending_reviews').getAll();
      })
     }).then(reviews => {
        if(!reviews.length){
          return null;
        }
        return Promise.all(reviews.map(review => DBHelper.sendReviewToServer(review)))
      }).then(reviews => {
        if(!reviews){
          return null;
        }
        //delete all pending reviews from local db
        return DBHelper.openDB().then(db => {
          //console.log(db);
          const tx = db.transaction('pending_reviews', 'readwrite');
          const store = tx.objectStore('pending_reviews');
          return store.clear();
        });
      })
      .catch(err => {
          throw Error('Panding reviews were not sent to server');
          return null;
        })

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
   * Toggle favorite  restaurant by its ID and add to localDB when offline.
   */
  static toggleFavorite(restaurant_id,favorite, callback) {
   fetch(`${DBHelper.DATABASE_URL}${restaurant_id}/?is_favorite=${favorite}`,{method: 'put'})
    .catch(() => {
      //if offline we store the action to pending_favorites table to send it when online again
      DBHelper.savePendingFavorite([{restaurant_id:parseInt(restaurant_id),is_favorite:`${favorite}`}])
    }).then(() => DBHelper.getLocalRestaurantsDataById(restaurant_id))
    .then(restaurant => {
      restaurant.is_favorite=`${favorite}`;
      DBHelper.saveRestaurantsToDB([restaurant])
    });

  }

/**
   * Send pending favorites to server
   */
  static sendFavoritesToServer(pending) {
    return fetch(`${DBHelper.DATABASE_URL}${pending.restaurant_id}/?is_favorite=${pending.is_favorite}`,{method: 'put'});
  }

  /**
   * Send pending favorites to server
   */
  static sendReviewToServer(review) {
    //indexedDB reviews have createdAt and updatedAt for display purpose and autoincrement id so we remove them to send it to the server
    if(review.createdAt){
      delete review.createdAt;
    }
    if(review.updatedAt){
      delete review.updatedAt;
    }
    if(review.id){
      delete review.id;
    }
    let formData=new FormData();
    for (let [key, value] of Object.entries(review)) {
      formData.append(key, value);
    }
    return fetch(`${DBHelper.DATABASE_REVIEWS_URL}`,{method: 'post',body:formData});
  }


  /**
   * Fetch reviews by restaurant ID.
   */
  static fetchReviewsByRestaurantId(id, callback) {

    fetch(`${DBHelper.DATABASE_REVIEWS_URL}?restaurant_id=${id}`).then(response => response.json())
    .then(reviews => {
      //force restaurant_id to be integer (for indexedDB index to work correctly)
      for (let review of reviews) {
        review['restaurant_id'] = parseInt(review['restaurant_id']);
      }
      //save to local db
      return DBHelper.saveReviewsToDB(reviews)
    })
     .then(reviews => callback(null,reviews))
     .catch(err => {
      //no network get them from indexedDB
      DBHelper.getLocalReviewsByRestaurantId(id).then(reviews => callback(null,reviews))
      }
    );

    }

    /**
   * Add review to server and add to localDB when offline.
   */
  static addReview(formData) {
    return fetch(`${DBHelper.DATABASE_REVIEWS_URL}`,{method: 'post',body:formData})
     .then(formData => {return formData})
     .catch(() => {
      //if offline we store the review to pending_reviews table to send it when online again
      //create an object from formData
      let object = {};
      for (let [key, value] of formData) {
        object[key] = value;
      }
      //force restaurant_id to be integer (for indexedDB index to work correctly)
      object['restaurant_id'] = parseInt(object['restaurant_id']);

      //add created and updated dates
      const unx=Date.now();
      object['createdAt'] = unx;
      object['updatedAt'] = unx;
      return DBHelper.savePendingReview([object])
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
        let results = restaurants;
        //we return here the unique cuisines and neighborhoods since this is called by default
        //GET UNIQUE NEIGHBORHOODS
        const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood)
        const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i)
        //GET UNIQUE CUISINES
        const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type)
        const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i)

        if (cuisine != 'all') { // filter by cuisine
          results = results.filter(r => r.cuisine_type == cuisine);
        }
        if (neighborhood != 'all') { // filter by neighborhood
          results = results.filter(r => r.neighborhood == neighborhood);
        }
        const final_result={restaurants:results,cuisines:uniqueCuisines,neighborhoods:uniqueNeighborhoods}
        callback(null, final_result);
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
   * Convert timestamp to Date.
   */
  static toDate(timestamp) {
    return new Date(timestamp).toDateString();

  }

/**
   * parse string to boolean
   */
  static parseBoolean(str) {
    if(typeof str === 'boolean'){
      return str;
    }
    switch (str.toLowerCase()) {
      case "false":
      return false;
      break;
      case "true":
      return true;
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
