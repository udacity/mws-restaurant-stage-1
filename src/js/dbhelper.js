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
    return { 
      restaurants:`http://localhost:${port}/restaurants`,
      reviews: `http://localhost:${port}/reviews`,
    };
  }

  /**
   * Fetch all restaurants.
   */
  static fetchRestaurants(callback) {
    return fetch(DBHelper.DATABASE_URL.restaurants)
      .then(restaurants => {
        restaurants.json().then(json => {
          callback(null, json);
        })
      })
      .catch(error => {
        console.log(error);
      })
  }

  /**
   * Fetch a restaurant by its ID.
   */
  static fetchRestaurantById(id, callback) {
    // fetch all restaurants with proper error handling.
    return fetch(`${DBHelper.DATABASE_URL.restaurants}/${id}`)
      .then(restaurant => {
        restaurant.json().then(json => {
          callback(null, json);
        })
      })
      .catch(error => {
        console.log(error);
      })
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
   * !!Changed to get the responsive images path!!
   */
  static imageUrlForRestaurant(restaurant) {
    if(restaurant.photograph) {
      return (`/responsive_images/${restaurant.photograph}.jpg`);
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
      animation: google.maps.Animation.DROP
    });
    return marker;
  }

  /**
   * Fetches reviews
   * @param {*} callback 
   */
  static fetchReviews(callback) {
    return fetch(DBHelper.DATABASE_URL.reviews)
      .then(reviews => {
        reviews.json().then(json => {
          callback(null, json);
        })
      })
      .catch(error => {
        console.log(error);
      })
  }

  /**
   * Fetches reviews by restaurant id
   * @param {*} restaurant_id 
   * @param {*} callback 
   */
  static fetchReviewsByRestaurantId(restaurant_id,callback) {
    return fetch(`${DBHelper.DATABASE_URL.reviews}/?restaurant_id=${restaurant_id}`)
    .then(reviews => {
      reviews.json().then(json => {
        callback(null, json);
      })
    })
    .catch(error => {
      console.log(error);
    })
  }

  /**
   * Submits new review
   * 
   * @param {*} callback 
   */
  static submitReview(callback) {

    return fetch(DBHelper.DATABASE_URL.reviews, {
      headers: {

        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8",
        "Connection": "keep-alive",
        "Content-Length": `${jsHelper.serializeObject(jsHelper.getFormValues()).length}`,
        "Content-Type": "application/x-www-form-urlencoded"
      },
      method: 'post',
      body: jsHelper.serializeObject(jsHelper.getFormValues())

    }).then(response => {

      callback();
    }).catch(error => {

      if('SyncManager' in window) {

        navigator.serviceWorker.ready.then(swr=>{
          console.log('Sw ready');
          return swr.pushManager.getSubscription();
        })
        .then(subscription =>{
    
          return navigator.serviceWorker.controller.postMessage({
            url: DBHelper.DATABASE_URL.reviews,
            formData: jsHelper.getFormValues(),
            type: 'create-review',
            method: 'POST'
          });
  
        }).then(() => {
          callback();
        })
        .catch(error => {
          console.log(error); 
          return;
        })
    
      } else {
        console.log(error); 
        return;
      }
    });
  }

  /**
   * Marks restaurant as favorite
   */
  static markAsFavorite() {

    let is_favorite = '/'+jsHelper.getParameterByName('id')+'/?is_favorite=false';
    if(document.getElementById('is_favorite').checked) {
      is_favorite = '/'+jsHelper.getParameterByName('id')+'/?is_favorite=true';
    }

    return fetch(DBHelper.DATABASE_URL.restaurants+is_favorite, {
      method: 'put',
    }).then(response => {

    }).catch(error => {      
    });
  }
}

