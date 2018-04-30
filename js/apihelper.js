/**
 * Common database helper functions.
 */
class APIHelper {
    static getBaseUrl() {
        return 'https://api.vlogz.win';
    }

    /**
     * Fetch all restaurants.
     */
    static fetchRestaurants() {
        const url = `${APIHelper.getBaseUrl()}/restaurants`;
        return fetch(url);
    }

    static async fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood) {

        let restaurants = await APIHelper.getAllRestaurants();

        if (cuisine != 'all') { // filter by cuisine
            restaurants = restaurants.filter(r => r.cuisine_type == cuisine);
        }
        if (neighborhood != 'all') { // filter by neighborhood
            restaurants = restaurants.filter(r => r.neighborhood == neighborhood);
        }
        return restaurants;
    }

    static async fetchRestaurantById(id) {
        try {
            let restaurant = await localforage.getItem(String(id));
            if (!restaurant) {
                const url = `${APIHelper.getBaseUrl()}/restaurants/${id}`;
                const response = await fetch(url);
                restaurant = await response.json();
                localforage.setItem(String(restaurant.id), restaurant);
            }
            return restaurant;
        } catch (error) {
            console.error(error);
        }
    }

    static async getAllRestaurants() {
        const items = [];
        await localforage.iterate(function(value, key, iterationNumber) {
            items.push(value);
            console.log([key, value]);
        })
        return items;
    }

    static get(id) {
        const url = `${APIHelper.getBaseUrl()}/restaurants/${id}`
        return fetch(url);
    }
}