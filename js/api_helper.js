/* globals newMap, L */

const ApiHelper = {
    DATABASE_URL: `http://localhost:1337/restaurants`,

    fetchRestaurants() {
        return fetch(this.DATABASE_URL)
            .then(response => response.json());
    },

    fetchRestaurantById(id) {
        return fetch(`${this.DATABASE_URL}/${id}`)
            .then(response => response.json());
    },

    fetchRestaurantByCuisine(cuisine) {
        return this.fetchRestaurants()
            .then(restaurants => {
                return restaurants.filter(restaurant => restaurant.cuisine_type === cuisine);
            })
    },

    fetchRestaurantByNeighborhood(neighborhood) {
        return this.fetchRestaurants()
            .then(restaurants => {
                return restaurants.filter(restaurant => restaurant.neighborhood === neighborhood);
            })
    },

    fetchRestaurantByCuisineAndNeighborhood(cuisine = 'all', neighborhood = 'all') {
        return this.fetchRestaurants()
            .then(restaurants => {
                if (cuisine === 'all' && neighborhood === 'all') {
                    return restaurants;
                } else if (cuisine === 'all') {
                    return restaurants.filter(restaurant => restaurant.neighborhood === neighborhood);
                } else if (neighborhood === 'all') {
                    return restaurants.filter(restaurant => restaurant.cuisine_type === cuisine);
                }
                return restaurants.filter(restaurant => restaurant.cuisine_type === cuisine && restaurant.neighborhood === neighborhood);
            })
    },

    fetchNeighborhoods() {
        return this.fetchRestaurants()
            .then(restaurants => {
                const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood);
                return neighborhoods.filter((v, i) => neighborhoods.indexOf(v) === i);
            })
    },

    fetchCuisines() {
        return this.fetchRestaurants()
            .then(restaurants => {
                const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type);
                return cuisines.filter((v, i) => cuisines.indexOf(v) === i);
            })
    },

    urlForRestaurant(restaurant) {
        return (`./restaurant.html?id=${restaurant.id}`);
    },

    imageUrlForRestaurant(restaurant) {
        return (`/img/${restaurant.photograph}`);
    },

    mapMarkerForRestaurant(restaurant, map) {
        // https://leafletjs.com/reference-1.3.0.html#marker
        const marker = new L.marker([restaurant.latlng.lat, restaurant.latlng.lng], {
            title: restaurant.name,
            alt: restaurant.name,
            url: this.urlForRestaurant(restaurant)
        })
        marker.addTo(newMap);
        return marker;
    },
}
