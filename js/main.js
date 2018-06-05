/* eslint-disable prefer-destructuring, no-console */
/* global DBHelper, google */

if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
        navigator.serviceWorker
            .register("/serviceWorker.js")
            .then(registration => console.info(`Service Worker Registered with scope: ${registration.scope}`))
            .catch(error => console.error("Error registering service worker", error));
    });
}

/**
 * Fetch neighborhoods and cuisines as soon as the page is loaded.
 */
document.addEventListener("DOMContentLoaded", () => {
    fetchNeighborhoods();
    fetchCuisines();
});

/**
 * Fetch all neighborhoods and set their HTML.
 */
const fetchNeighborhoods = () => {
    DBHelper.fetchNeighborhoods()
        .then(data => fillNeighborhoodsHTML(data))
        .catch(error => console.error(error));
};

/**
 * Set neighborhoods HTML.
 * @param {string[]} neighborhoods
 */
const fillNeighborhoodsHTML = (neighborhoods = self.neighborhoods) => {
    const select = document.getElementById("neighborhoods-select");
    neighborhoods.forEach(neighborhood => {
        const option = document.createElement("option");
        option.innerHTML = neighborhood;
        option.value = neighborhood;
        select.append(option);
    });
};

/**
 * Fetch all cuisines and set their HTML.
 */
const fetchCuisines = () => {
    DBHelper.fetchCuisines()
        .then(data => fillCuisinesHTML(data))
        .catch(error => console.error(error));
};

/**
 * Set cuisines HTML.
 * @param {string[]} cuisines
 */
const fillCuisinesHTML = (cuisines = self.cuisines) => {
    const select = document.getElementById("cuisines-select");

    cuisines.forEach(cuisine => {
        const option = document.createElement("option");
        option.innerHTML = cuisine;
        option.value = cuisine;
        select.append(option);
    });
};

/**
 * Initialize Google map, called from HTML.
 */
window.initMap = () => {
    const loc = {
        lat: 40.722216,
        lng: -73.987501,
    };
    self.map = new google.maps.Map(document.getElementById("map"), {
        zoom: 12,
        center: loc,
        scrollwheel: false,
    });
    updateRestaurants();
};

/**
 * Update page and map for current restaurants.
 */
const updateRestaurants = () => {
    const cSelect = document.getElementById("cuisines-select");
    const nSelect = document.getElementById("neighborhoods-select");

    const cIndex = cSelect.selectedIndex;
    const nIndex = nSelect.selectedIndex;

    const cuisine = cSelect[cIndex].value;
    const neighborhood = nSelect[nIndex].value;

    DBHelper.fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood)
        .then(results => {
            resetRestaurants(results);
            fillRestaurantsHTML(results);
            return true;
        })
        .catch(error => console.error(error));
};

/**
 * Clear current restaurants, their HTML and remove their map markers.
 * @param {Object[]} restaurants
 */
const resetRestaurants = restaurants => {
    // Remove all restaurants
    self.restaurants = [];
    const ul = document.getElementById("restaurants-list");
    ul.innerHTML = "";

    // Remove all map markers
    if (self.markers) {
        self.markers.forEach(m => m.setMap(null));
    }
    self.markers = [];
    self.restaurants = restaurants;
};

/**
 * Create all restaurants HTML and add them to the webpage.
 * @param {Object[]} restaurants
 */
const fillRestaurantsHTML = (restaurants = self.restaurants) => {
    const ul = document.getElementById("restaurants-list");
    restaurants.forEach(restaurant => {
        ul.append(createRestaurantHTML(restaurant));
    });
    addMarkersToMap(restaurants);
};

/**
 * Create restaurant HTML.
 * @param {Object} restaurant
 * @param {string} restaurant.name
 * @param {string} restaurant.neighborhood
 * @param {string} restaurant.address
 * @return {Element}
 */
const createRestaurantHTML = restaurant => { // eslint-disable-line max-statements
    const li = document.createElement("li");

    const image = document.createElement("img");
    image.className = "restaurant-img lazyload";
    image.dataset.sizes = "auto";
    image.dataset.src = DBHelper.imageUrlForRestaurant(restaurant);
    image.dataset.srcset = DBHelper.imageUrlForRestaurant(restaurant, "webp");
    image.alt = restaurant.name;
    image.src = DBHelper.imageUrlForRestaurant(restaurant);
    li.append(image);

    const name = document.createElement("h2");
    name.innerHTML = restaurant.name;
    li.append(name);

    const neighborhood = document.createElement("p");
    neighborhood.innerHTML = restaurant.neighborhood;
    li.append(neighborhood);

    const address = document.createElement("p");
    address.innerHTML = restaurant.address;
    li.append(address);

    const more = document.createElement("a");
    more.innerHTML = "View Details";
    more.href = DBHelper.urlForRestaurant(restaurant);
    li.append(more);

    return li;
};

/**
 * Add markers for current restaurants to the map.
 * @param {Object[]} restaurants
 */
const addMarkersToMap = (restaurants = self.restaurants) => {
    restaurants.forEach(restaurant => {
        const marker = DBHelper.mapMarkerForRestaurant(restaurant, self.map);
        google.maps.event.addListener(marker, "click", () => {
            window.location.href = marker.url;
        });
        self.markers = [...self.markers, marker];
    });
};
