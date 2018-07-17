/**
 * Common database helper functions.
 */
class DBHelper {
    /**
     * Database URL.
     * Change this to restaurants.json file location on your server.
     */
    static get RESTAURANTS_URL() {
        const port = 1337 // Change this to your server port
        return `http://localhost:${port}/restaurants`;
    }

    static get REVIEWS_URL() {
        const port = 1337;
        return `http://localhost:${port}/reviews`;
    }

    /**
     * Fetch all restaurants.
     */
    static async fetchRestaurants(callback) {
        let dbRestaurants = await IDBHelper.getRestaurants();
        if (dbRestaurants && dbRestaurants.length > 0) { // If there is something in the database, return it now
            callback(null, dbRestaurants);
        }
        fetch(DBHelper.RESTAURANTS_URL) // but always go for data to the network and update database
            .then(async response => {
                if (dbRestaurants.length <= 0) {
                    callback(null, await response.clone().json());
                }
                IDBHelper.addRestaurants(await response.json());
            })
            .catch(error => {
                if (dbRestaurants.length <= 0) {
                    callback(`Fetch error: ${error}`, null);
                }
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
     * Fetch all reviews.
     */
    static async fetchReviews(callback) {
        let dbReviews = await IDBHelper.getReviews();
        if (dbReviews && dbReviews.length > 0) { // If there is something in the database, return it now
            callback(null, dbReviews);
        }
        fetch(DBHelper.REVIEWS_URL) // but always go for data to the network and update database
            .then(async response => {
                if (dbReviews.length <= 0) {
                    callback(null, await response.clone().json());
                }
                IDBHelper.addReviews(await response.json());
            })
            .catch(error => {
                if (dbReviews.length <= 0) {
                    callback(`Fetch error: ${error}`, null);
                }
            });
    }

    /**
     * Fetch a review by its ID.
     */
    static fetchReviewById(id, callback) {
        // fetch all reviews with proper error handling.
        DBHelper.fetchReviews((error, reviews) => {
            if (error) {
                callback(error, null);
            } else {
                const review = reviews.find(r => r.id == id);
                if (review) { // Got the review
                    callback(null, review);
                } else { // Review does not exist in the database
                    callback('Review does not exist', null);
                }
            }
        });
    }

    /**
     * Fetch a review by ID of a restaurant.
     */
    static fetchReviewsByRestaurantId(id, callback) {
        // fetch all reviews with proper error handling.
        DBHelper.fetchReviews((error, reviews) => {
            if (error) {
                callback(error, null);
            } else {
                const review = reviews.filter(r => r.restaurant_id == id);
                if (review) { // Got the reviews
                    callback(null, review);
                } else { // Reviews do not exist in the database
                    callback('Review does not exist', null);
                }
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

}