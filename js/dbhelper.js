/* eslint-disable no-console, no-unused-vars */
/* global google */
/** @namespace google.maps */
/** @namespace google.maps.Marker */
/** @namespace google.maps.Animation */
/** @namespace google.maps.Animation.DROP */

/**
 * Common database helper functions.
 */
class DBHelper {
    /**
     * Database URL.
     * Change this to restaurants.json file location on your server.
     */
    static get DATABASE_URL() {
        return "http://localhost:1337";
    }

    /**
     * Fetch all restaurants.
     * @return {Promise<Object[]>|null}
     */
    static fetchRestaurants() {
        return fetch(`${DBHelper.DATABASE_URL}/restaurants`)
            .then(response => response.json())
            .then(json => json)
            .catch(error => console.error(error));
    }

    /**
     * Fetch a restaurant by its ID.
     * @param {string} id
     * @return {Object}
     */
    static fetchRestaurantById(id) {
        return fetch(`${DBHelper.DATABASE_URL}/restaurants/${id}`)
            .then(response => response.json())
            .then(json => json)
            .catch(error => console.error(error));
    }

    /**
     * Fetch restaurants by a cuisine type with proper error handling.
     * TODO refactor this
     * @param {string} cuisine
     * @return {Object[]}
     */
    static fetchRestaurantByCuisine(cuisine) {
        // TODO implement server side function

        return DBHelper.fetchRestaurants()
            .then(response => response.filter(restaurant => restaurant.cuisine_type === cuisine))
            .catch(error => console.error(error));
    }

    /**
     * Fetch restaurants by a neighborhood with proper error handling.
     * TODO refactor this
     * @param {string} neighborhood
     * @return {Object[]}
     */
    static fetchRestaurantByNeighborhood(neighborhood) {
        // TODO implement server side function
        return DBHelper.fetchRestaurants()
            .then(response => response.filter(restaurant => restaurant.neighborhood === neighborhood))
            .catch(error => console.error(error));
    }

    /**
     * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
     * @param {string} cuisine
     * @param {string} neighborhood
     * @return {Object[]}
     */
    static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood) {
        return DBHelper.fetchRestaurants()
            .then(response => {
                let results = response;
                if (cuisine !== "all") {
                    results = results.filter(restaurant => restaurant.cuisine_type === cuisine);
                }
                if (neighborhood !== "all") {
                    results = results.filter(restaurant => restaurant.neighborhood === neighborhood);
                }
                return results;
            })
            .catch(error => console.error(error));
    }

    /**
     * Fetch all neighborhoods with proper error handling.
     * @return {Promise<string[]>}
     */
    static fetchNeighborhoods() {
        return DBHelper.fetchRestaurants()
            .then(response => Promise.resolve([...new Set(response.map(item => item.neighborhood))].sort()))// eslint-disable-line fp/no-mutating-methods
            .catch(error => console.error(error));
    }

    /**
     * Fetch all cuisines with proper error handling.
     * @return {Promise<string[]>}
     */
    static fetchCuisines() {
        return DBHelper.fetchRestaurants()
            .then(response => [...new Set(response.map(item => item.cuisine_type))].sort()) // eslint-disable-line fp/no-mutating-methods
            .catch(error => console.error(error));
    }

    /**
     * Restaurant page URL.
     * @param {Object} restaurant
     * @param {number} restaurant.id
     * @param {string} [restaurant.neighborhood]
     * @param {string} [restaurant.photograph]
     * @return {string}
     */
    static urlForRestaurant(restaurant) {
        return (`./restaurant.html?id=${restaurant.id}`);
    }

    /**
     * Restaurant image URL.
     * @param {Object} restaurant
     * @param {string} restaurant.photograph
     * @param {string} [restaurant.neighborhood]
     * @param {string} [restaurant.name]
     * @return {string}
     */
    static imageUrlForRestaurant(restaurant) {
        return (`/img/${restaurant.photograph}.jpg`);
    }

    /**
     * Map marker for a restaurant.
     * @param {Object} restaurant
     * @param {number} restaurant.id
     * @param {Object} restaurant.latlng
     * @param {string} restaurant.name
     * @param {Object} map
     * @return {Object}
     */
    static mapMarkerForRestaurant(restaurant, map) {
        return new google.maps.Marker({
            position: restaurant.latlng,
            title: restaurant.name,
            url: DBHelper.urlForRestaurant(restaurant),
            map: map,
            animation: google.maps.Animation.DROP,
        });
    }
}
