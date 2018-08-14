// import swal from 'sweetalert';

/**
 * Common database helper functions.
 */
/**
 * Register Service Worker
 */

if ('serviceWorker' in navigator) {
  window.addEventListener('load', function() {
    navigator.serviceWorker.register('/sw.js').then(function(registration) {
      // Registration was successful
      console.log('ServiceWorker registration successful with scope: ', registration.scope);
    }, function(err) {
      // registration failed :(
      console.log('ServiceWorker registration failed: ', err);
    });
  });
}

/*
* Open Indexed Database .
*/

function openIndexedDB (){
  if (!'serviceWorker' in navigator) return ;

  indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
  if (!indexedDB) {
    console.error("Your browser doesn't support a stable version of IndexedDB. Such and such feature will not be available.");
  }
  const openRequst = indexedDB.open('restaurants', 2);
  openRequst.onupgradeneeded = function(event) {
    idb = event.target.result;
    idb.createObjectStore('restaurant', {
      keyPath: 'id'
    });
    idb.createObjectStore('reviews', {
      keyPath: 'id'
    });
  }
  return openRequst ;
}

class DBHelper {

  /**
   * Database URL.
   * Change this to restaurants.json file location on your server.
   */
  static get DATABASE_URL() {
    const port = 1337
    const local = `http://localhost:${port}/restaurants`;
    const remote = `https://reviews-server.tt34.com/restaurants`;
    return local ;
  }

  static get DATABASE_FOR_REVIEWS () { 
    const port = 1337
    const local = `http://localhost:${port}/reviews`;
    const remote = `https://reviews-server.tt34.com/reviews`;
    return local ;
  }

  /**
   * Fetch all restaurants.
   */
  static fetchRestaurants(callback) {
    let xhr = new XMLHttpRequest();
    const openIDB = openIndexedDB();
    openIDB.onsuccess = (event)=> {
      const idb= event.target.result;
      const objectStore = idb.transaction('restaurant').objectStore('restaurant');
      const dbGetRequest = objectStore.getAll();
      dbGetRequest.onsuccess = ()=>{
        if (dbGetRequest.result)  {
          console.log(dbGetRequest.result);
          
          callback(null, dbGetRequest.result);
        }        
      }

    }
    xhr.open('GET', DBHelper.DATABASE_URL);
    xhr.onload = () => {
      if (xhr.status === 200) { // Got a success response from server!
        const restaurants = JSON.parse(xhr.responseText);   
       

        openIDB.onsuccess = (event)=> { 
          const idb= event.target.result;
          const objectStore = idb.transaction('restaurant', 'readwrite').objectStore('restaurant');
          restaurants.forEach(restaurant => {
            objectStore.add(restaurant);
          });
        }
        openIDB.onerror = (error)=> { 
          console.error('IDB is not opened');
        }
        callback(null, restaurants);
      } else { // Oops!. Got an error from server.
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
    return (`/img/${restaurant.photograph}`);
  }

  
  /**
   * Restaurant images  URL.
   */
  static imgSetUrlForRestaurantSmall(restaurant) {
    return (`/images/${restaurant.id}-small_1x.jpg 1x,/images/${restaurant.id}-small_2x.jpg 2x`);
  }
  static imgSetUrlForRestaurantLarg(restaurant) {
    return (`/images/${restaurant.id}-larg_1x.jpg 1x,/images/${restaurant.id}-larg_2x.jpg 2x`);
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

  /**
   * update resturant status .
   */

  static changeFavoriteStatus (resturantId, newStatus) { 
    fetch(`${DBHelper.DATABASE_URL}/${resturantId}/?is_favorite=${newStatus}`, {
      method: 'PUT'
    }).then(()=>{
      const openIDB = openIndexedDB();
      openIDB.onsuccess = (event)=> {
        const idb= event.target.result;
        const objectStore = idb.transaction('restaurant', 'readwrite').objectStore('restaurant');
        const dbGetRequest = objectStore.get(resturantId);
        dbGetRequest.onsuccess = event =>{
           const restuarant = event.target.result;
          console.log(restuarant);
          restuarant.is_favorite = newStatus;
          objectStore.put(restuarant);
        }
  
      }
    })
  }

  /**
   * Fetch all reviews for a restuarant .
   */

   static featchRestuarantReviews (id){
    return  fetch(`${DBHelper.DATABASE_FOR_REVIEWS}/?restaurant_id=${id}`)
      .then(res => res.json()).then(reviews=>{
        const openIDB = openIndexedDB();
          openIDB.onsuccess = (event)=> {
            const idb= event.target.result;
            const store = idb.transaction('reviews', 'readwrite').objectStore('reviews');
            if (Array.isArray(reviews)){
              reviews.forEach(review=>{
                store.put(review);
              })
            } else { 
              store.put(reviews);
            }
          }
          return reviews;
     })
   }

   static getStoredbjectsById (table, iID, id) { 
      openIDB.onsuccess = (event)=> {
        const idb= event.target.result;
        if (!idb ) return;

        const store = idb.transaction(table).objectStore(table);
        const indexedID = store.index(iID);
        return indexedID.getAll(id);
      }
   }
  
   /**
    * Check If user online to handle send review  . 
    */
   static addReview (review) { 
     const offlineReview = {
       name: 'addReview',
       data: review,
       object_type: 'review'
     }
     console.log(!navigator.onLine, 'online');
     
     if (!navigator.onLine) { 
       DBHelper.sendReviewWhenOnline(offlineReview);
       return Promise.reject(offlineReview);
     }
    return  DBHelper.sendReview(review)
   }

   /**
    * Send Review To  Server .
    */
   static sendReview (review) { 
      const reviewSend = { 
        "name": review.name,
        "rating": parseInt(review.rating),
        "comments": review.comments,
        "restaurant_id": parseInt(review.restaurant_id)
      }
      const  fetchOption = { 
        method: 'POST',
        body: JSON.stringify(reviewSend),
        // headers: new Headers({
        //   'Content-type': 'application/json'
        // })
      };

     return fetch(`${DBHelper.DATABASE_FOR_REVIEWS}`, fetchOption)
   }

   /**
    * Listin if user come back online and send the review to the server .
    */
   static sendReviewWhenOnline(offlineReview){ 
     console.log('event Listin');
     
    localStorage.setItem('reviews', JSON.stringify(offlineReview.data));
    window.addEventListener('online', (event)=>{
      console.log('Now I am Online ...... ');
      
      const review = JSON.parse(localStorage.getItem('reviews'));
      let  offlineReviewUI = document.querySelectorAll('.reviews-offline');
      offlineReviewUI.forEach(el=>{
        el.classList.remove("reviews-offline");
        el.removeChild(document.getElementById('offline-lable'));
      });
      if (review) {
        DBHelper.addReview(review);
      }
      localStorage.removeItem('reviews');
    })
   }

}
