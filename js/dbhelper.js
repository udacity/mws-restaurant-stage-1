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
        try {
            let response = await fetch(DBHelper.RESTAURANTS_URL);
            callback(null, await response.clone().json());
            IDBHelper.addRestaurants(await response.json());
        }
        catch (error) {
            if (dbRestaurants.length <= 0) {
                callback(`Fetch error: ${error}`, null);
            }
        }
    }

    /**
     * Fetch a restaurant by its ID.
     */
    static async fetchRestaurantById(id, callback) {
        let localData = await IDBHelper.getRestaurant(id);
        try {
            let networkData = await fetch(DBHelper.RESTAURANTS_URL + `/${id}`);
            if (networkData) {
                IDBHelper.addRestaurant(await networkData.clone().json());
            }
            callback(null, localData || networkData.json());
        }
        catch (error) {
            if (localData) {
                callback(null, localData);
                return;
            }
            callback(error, null);
        }
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
        let localData = await IDBHelper.getReviews();
        if (localData && localData.length > 0) { // If there is something in the database, return it now
            callback(null, localData);
        }
        try {
            let networkData = await fetch(DBHelper.REVIEWS_URL);
            callback(null, await networkData.clone().json());
            IDBHelper.addReviews(await networkData.json());
        }
        catch (error) {
            if (localData.length <= 0) {
                callback(`Fetch error: ${error}`, null);
            }
        }
    }

    /**
     * Fetch a review by its ID.
     */
    static async fetchReviewById(id, callback) {
        let localData = await IDBHelper.getReview(id);
        try {
            let networkData = await fetch(DBHelper.REVIEWS_URL + `/${id}`);
            if (networkData) {
                IDBHelper.addReview(await networkData.clone().json());
            }
            callback(null, localData || networkData.json());
        }
        catch (error) {
            if (localData) {
                callback(null, localData);
                return;
            }
            callback(error, null);
        }
    }

    /**
     * Fetch a review by ID of a restaurant.
     */
    static async fetchReviewsByRestaurantId(id, callback) {
        let localData = await IDBHelper.getReviewsOfRestaurant(id);
        if (localData && localData.length > 0) { // If there is something in the database, return it now
            callback(null, localData);
        }
        try {
            let response = await fetch(DBHelper.REVIEWS_URL + `/?restaurant_id=${id}`);
            callback(null, await response.clone().json());
            IDBHelper.addReviews(await response.json());
        }
        catch (error) {
            if (localData.length <= 0) {
                callback(`Fetch error: ${error}`, null);
            }
        }
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