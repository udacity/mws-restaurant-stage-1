/**
 * Common database helper functions.
 */
//import idb from 'idb';
class DBHelper {

  //adapted from Wittr and Jake Archibald IDB examples
  static openDatabase() {
    // console.log('in open database');
      this.dbPromise = idb.open('mws', 5, upgradeDB => {
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
            // console.log('revs created');
          case 3:
            upgradeDB.createObjectStore('localrevs', {keyPath: 'id', autoIncrement: true});
            // console.log('localrev created');
          case 4:
            upgradeDB.createObjectStore('favQueue',{keyPath: 'id', autoIncrement: true});
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
    return Promise.all([this.openDatabase(),this.fetchAllReviews()]).then(values => {
// console.log('promises resolved');
      const db=values[0];
      const reviews=values[1];
      if (!db) {return};
      // console.log('starting transactions',restaurants);
      var tx = db.transaction('revs', 'readwrite');
      var store = tx.objectStore('revs');
      reviews.forEach(function(review) {
        store.put(review);
        // console.log('saved', review);
      });
      // console.log('all reviews saved',reviews);
      return reviews;
    });
  }
  // Given json list of restaurants data store in indexedDB
  // read google promises primer then wrote this
  static SaveRestaurantReviews (restaurant_id) {
    // console.log('in save rest reviews for id',restaurant_id);
    return Promise.all([this.openDatabase(),this.fetchRestaurantReviews(restaurant_id)]).then(values => {
      // console.log('promises resolved');
      const db=values[0];
      const reviews=values[1];
      if (!db) {return};
      // console.log('starting transactions',reviews);
      var tx = db.transaction('revs', 'readwrite');
      var store = tx.objectStore('revs');
      reviews.forEach(function(review) {
        store.put(review);
        // console.log('saved', review);
      });
      // console.log('all restaurant reviews saved',reviews);
      return reviews;
    }).catch(error => {
      console.log('save restaurant review error',error);
      return Promise.resolve('done in reviews');
    });
    tx.complete.then(()=> {
      // console.log('save reviews done');
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

  //This is the location of the Server for
  static get DATABASE_SERVER_URL() {
    const port = 1337 // Change this to your server port
    return `http://localhost:${port}`;
    // const port = 8080;
    // return `http://localhost:${port}/data/restaurants.json`; //old project 1 URL
  }

  //End point for the restaurant data fetch/Put
  static get DATABASE_RESTAURANTS_URL() {
    return this.DATABASE_SERVER_URL + '/restaurants';
  }

  static get DATABASE_REVIEWS_URL() {
    return this.DATABASE_SERVER_URL + '/reviews';
  }
  /**
   * Fetch all restaurants from the server.
   */
  static fetchRestaurants() {
    return fetch(DBHelper.DATABASE_RESTAURANTS_URL).then((response) =>{
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
  static fetchAllReviews() {
    // Implemented after consulting Adnan Usman to convert to promise/fetch
    return fetch(DBHelper.DATABASE_REVIEWS_URL).then((response) =>{
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
   * Fetch all reviews from the server.
   */
  static fetchRestaurantReviews(restaurant_id) {
    // Implemented after consulting Adnan Usman to convert to promise/fetch
    return fetch(DBHelper.DATABASE_REVIEWS_URL + '/?restaurant_id=' + restaurant_id).then((response) =>{
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
    this.openDatabase().then(function(db) {
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
    // console.log('in read reviews');
  return this.openDatabase().then(db => {
    // console.log('read rev db open');    
    if (!db) {
      // console.log('no db'); 
      return Promise.resolve()
    };
      //retrieve reviews from main list and locally saved reviews not posted to server yet
      // console.log('before promise all');
      return Promise.all([
        db.transaction('revs')
                    .objectStore('revs').getAll()
                    ,
                    db.transaction('localrevs')
                    .objectStore('localrevs').getAll()           
      ]).then(values => {
        // console.log('both rev db read',values);
        // return values[0];
        return values[0].concat(values[1]);
      })
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
      // console.log('all reviews',reviews);
      const restaurant_reviews = reviews.filter(r => r.restaurant_id == restaurant_id);
      // console.log('filtered reviews',restaurant_reviews);
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
   * Read restaurants by a neighborhood with proper error handling.
   */
  static readRestaurantByNeighborhood(neighborhood, callback) {
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
   * read restaurants by a cuisine and a neighborhood with proper error handling.
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
   * read all neighborhoods with proper error handling.
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
   * read all cuisines with proper error handling.
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
  static updateFavoriteForRestaurant(restaurant,isFavorite) {
    restaurant.is_favorite=isFavorite;
    restaurant.updatedAt = new Date().toString();
    console.log('update',restaurant,'favorite',isFavorite);

    this.openDatabase().then((db) =>{
      if (!db) {
        console.log('no database');
        return;
      }
      var tx = db.transaction(['objs','favQueue'], 'readwrite');
      var objstore = tx.objectStore('objs');
      var qStore = tx.objectStore('favQueue')
      console.log('updating',restaurant);
      objstore.put(restaurant); 
      qStore.put({
        restaurant_id:restaurant.id,
        is_favorite: restaurant.is_favorite
      });
      tx.complete.then(() => {
        // console.log('updated favorite',DBHelper.DATABASE_RESTAURANTS_URL + '/' + restaurant.id + '/?is_favorite=' + restaurant.is_favorite);
        // this.sendFavoriteUpdate(restaurant.id,restaurant.is_favorite);
        this.sendWaitingFavorites();
    }).catch(error => {
      console.log('error sending favorite',error);
    });
    });
  }

  static addReview(restaurantId,name,rating,comments){
    // console.log('in add review', restaurantId,name,comments);
    return this.openDatabase().then(db =>{
      if (!db) {
        // console.log('no review database');
      }
      // console.log('db opened', restaurantId,name,comments);
      var tx = db.transaction('localrevs', 'readwrite');
      var store = tx.objectStore('localrevs');
      let review={
        restaurant_id: restaurantId,
        name: name,
        rating: rating,
        comments: comments,
        createdAt:  new Date().toString(),
        updatedAt:  new Date().toString()
      };
      // console.log('adding review',review);
      store.put(review).then(request =>{
        // console.log('review is updated', request);
        // const review=request.data;
        // console.log('put request',review);
        this.sendNewReview(review);
      })
      .catch(error => {
        // console.log('put failed',error);
        return Promise.resolve('put failed');
      }); 

    })

    .catch(error => {
      // console.log('failed to open db',error);
      return Promise.resolve('no db');
    })
  }

  //send review to server
  static sendNewReview(review) {
    // console.log('in send review');
    
    const msgBody=`{
      "restaurant_id": ${review.restaurant_id},
      "name": "${review.name}",
      "rating": ${review.rating},
      "comments": "${review.comments}"
    }`;
    // console.log('review body',msgBody);

    return fetch(DBHelper.DATABASE_REVIEWS_URL + '/',{
      method: "POST",
      body: msgBody
    }).then(response => {
      const cpyResponse=response.clone();
      // console.log('response',cpyResponse);
      return response;
    })
  }

  //send pending reviews to server
  //watched Doug Brown's walkthrough.  Liked the idea of the saved queue
  //implemented this after watching
  static sendWaitingReviews() {
    // console.log('in send waiting review');
    
    this.openDatabase().then(db => {
      if (!db) {
        // console.log('send waiting rev no db');
        return;
      }
      const tx = db.transaction('localrevs', 'readonly');
      const store = tx.objectStore('localrevs');
      store.openCursor().then(function cursorIterate(cursor) {
        if (!cursor) {
          // console.log('no cursor');
          return;
        }
        // console.log('send waiting value is ',cursor.value,' entry ', cursor.key);
        let curKey=cursor.key;
        DBHelper.sendNewReview(cursor.value).then(response => {
          if (!response){
            console.log('no send new review response');
            return;
          }
          if (response.ok) {
            // console.log('continuing');
            DBHelper.deletePendingReview(curKey).then(()=>{
              DBHelper.sendWaitingReviews();
            })
          }
        })
      }).catch(error =>{
        console.log('error in cursor',error);
      });
      tx.complete.then(()=> {
        // console.log('rev cursor done');
      });
    });
  }

  // delete queued review after successfully posting to server
  static deletePendingReview(key) {
    return this.openDatabase().then(db => {
      if (!db) {
        // console.log('send waiting rev no db');
        return;
      }
      const tx = db.transaction('localrevs', 'readwrite');
      const store = tx.objectStore('localrevs');
      
      store.delete(key).then((response)=>{
        // console.log('delete successful');
      }).catch(error =>{
        console.log('error in delete',error);
      });
      tx.complete.then(()=> console.log('delete done'));
      return Promise.resolve('Review deleted');
    }).catch(error => {
      console.log('error opening delete db',error);
      return Promise.reject();
    });

  }

   //send pending reviews to server
  //watched Doug Brown's walkthrough.  Liked the idea of the saved queue
  //implemented this after watching
  static sendWaitingFavorites() {
    // console.log('in send waiting review');
    
    this.openDatabase().then(db => {
      if (!db) {
        // console.log('send waiting rev no db');
        return;
      }
      const tx = db.transaction('favQueue', 'readonly');
      const store = tx.objectStore('favQueue');
      store.openCursor().then(function cursorIterate(cursor) {
        if (!cursor) {
          // console.log('no cursor');
          return;
        }
        // console.log('send waiting value is ',cursor.value,' entry ', cursor.key);
        let curKey=cursor.key;
        DBHelper.sendFavoriteUpdate(cursor.value).then(response => {
          if (!response){
            console.log('no send new review response');
            return;
          }
          if (response.ok) {
            // console.log('continuing');
            DBHelper.deletePendingFavorite(curKey).then(()=>{
              DBHelper.sendWaitingFavorites();
            })
          }
        })
      }).catch(error =>{
        console.log('error in cursor',error);
      });
      tx.complete.then(()=> {
        // console.log('rev cursor done');
      });
    });
  }

  // delete queued favorite update after successfully posting to server
  static deletePendingFavorite(key) {
    return this.openDatabase().then(db => {
      if (!db) {
        // console.log('send waiting rev no db');
        return;
      }
      const tx = db.transaction('favQueue', 'readwrite');
      const store = tx.objectStore('favQueue');
      
      store.delete(key).then((response)=>{
        // console.log('delete successful');
      }).catch(error =>{
        console.log('error in delete',error);
      });
      tx.complete.then(()=> console.log('delete done'));
      return Promise.resolve('fav deleted');
    }).catch(error => {
      console.log('error opening fav db',error);
      return Promise.reject();
    });

  }


  static sendFavoriteUpdate(favData) {
    
    // can use fetch API
    return fetch(DBHelper.DATABASE_RESTAURANTS_URL + '/' + favData.restaurant_id + '/?is_favorite=' + favData.is_favorite, 
    {
      method: "PUT"
    }).then(response => {
      if (response.ok) {
        console.log('successful put');        
      } else {
        console.log('did not post');
      }
      return response;
    }).catch(error => {
      console.log('favorite update failed',error);
      return Promise.reject('no fav update');
    });
  }
}
