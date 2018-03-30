import Config from '../../config';
import DBHelper from './dbhelper';
import PictureHelper from './picturehelper';
import GoogleMapsLoader from './google-maps-loader';

let restaurants,
    neighborhoods,
    cuisines;

window.markers = [];

/**
 * Fetch neighborhoods and cuisines as soon as the page is loaded.
 */
export function initHome() {
    document.addEventListener('DOMContentLoaded', (event) => {
        fetchNeighborhoods();
        fetchCuisines();
    });

    /**
     * Initialize Google map, called from HTML.
     */
    const gml = new GoogleMapsLoader();
    gml.KEY = Config.GOOGLE_MAPS_API_KEY || "YOUR_GOOGLE_MAPS_API_KEY";
    gml.LIBRARIES = ['places'];
    gml.load(
        function (map) {
            window.map =map;
            updateRestaurants();
        },
        Config.GOOGLE_MAPS_OPTIONS
    );
}

/**
 * Fetch all neighborhoods and set their HTML.
 */
export const fetchNeighborhoods = () => {
    DBHelper.fetchNeighborhoods((error, neighborhoods) => {
        if (error) { // Got an error
            console.error(error);
        } else {
            self.neighborhoods = neighborhoods;
            fillNeighborhoodsHTML();
        }
    });
};

/**
 * Set neighborhoods HTML.
 */
export const fillNeighborhoodsHTML = (neighborhoods = self.neighborhoods) => {
    const select = document.getElementById('neighborhoods-select');
    neighborhoods.forEach(neighborhood => {
        const option = document.createElement('option');
        option.innerHTML = neighborhood;
        option.value = neighborhood;
        select.append(option);
    });
};

/**
 * Fetch all cuisines and set their HTML.
 */
export const fetchCuisines = () => {
    DBHelper.fetchCuisines((error, cuisines) => {
        if (error) { // Got an error!
            console.error(error);
        } else {
            self.cuisines = cuisines;
            fillCuisinesHTML();
        }
    });
};

/**
 * Set cuisines HTML.
 */
export const fillCuisinesHTML = (cuisines = self.cuisines) => {
    const select = document.getElementById('cuisines-select');

    cuisines.forEach(cuisine => {
        const option = document.createElement('option');
        option.innerHTML = cuisine;
        option.value = cuisine;
        select.append(option);
    });
};

/**
 * Update page and map for current restaurants.
 */
window.updateRestaurants = () => {
    const cSelect = document.getElementById('cuisines-select');
    const nSelect = document.getElementById('neighborhoods-select');

    const cIndex = cSelect.selectedIndex;
    const nIndex = nSelect.selectedIndex;

    const cuisine = cSelect[cIndex].value;
    const neighborhood = nSelect[nIndex].value;

    DBHelper.fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, (error, restaurants) => {
        if (error) { // Got an error!
            console.error(error);
        } else {
            resetRestaurants(restaurants);
            fillRestaurantsHTML();
        }
    })
};

/**
 * Clear current restaurants, their HTML and remove their map markers.
 */
window.resetRestaurants = (restaurants) => {
    // Remove all restaurants
    self.restaurants = [];
    const ul = document.getElementById('restaurants-list');
    ul.innerHTML = '';

    // Remove all map markers
    self.markers.forEach(m => m.setMap(null));
    self.markers = [];
    self.restaurants = restaurants;
};

/**
 * Create all restaurants HTML and add them to the webpage.
 */
export const fillRestaurantsHTML = (restaurants = self.restaurants) => {
    const container = document.getElementById('restaurants-container');
    const ul = document.getElementById('restaurants-list');
    ul.style.display = 'inline-flex';

    removeNoResult(container);
    if (restaurants.length < 1) {
        ul.style.display = 'none';
        addNoResult(container);
        return;
    }

    restaurants.forEach(restaurant => {
        ul.append(createRestaurantHTML(restaurant));
    });
    addMarkersToMap();
};

export const removeNoResult = (container) => {
    const noRestaurants = document.getElementById('restaurant-no-result');
    if(noRestaurants) {
        container.removeChild(noRestaurants);
    }
};

export const addNoResult = (container) => {
    const noRestaurants = document.createElement('p');
    noRestaurants.id = 'restaurant-no-result';
    noRestaurants.className = 'no-result';
    noRestaurants.innerHTML = 'No restaurants found!';
    container.appendChild(noRestaurants);
};

/**
 * Create restaurant HTML.
 */
export const createRestaurantHTML = (restaurant) => {
    const li = document.createElement('li');
    li.className = 'flex-list-item';

    li.append(PictureHelper.getPictureElement(restaurant));

    const container = document.createElement('div');
    li.append(container);

    const name = document.createElement('h1');
    name.innerHTML = restaurant.name;
    container.append(name);

    const neighborhood = document.createElement('p');
    neighborhood.innerHTML = restaurant.neighborhood;
    container.append(neighborhood);

    const address = document.createElement('p');
    address.innerHTML = restaurant.address;
    container.append(address);

    const more = document.createElement('a');
    more.innerHTML = 'View Details';
    more.href = DBHelper.urlForRestaurant(restaurant);
    container.append(more);

    return li;
};

/**
 * Add markers for current restaurants to the map.
 */
export const addMarkersToMap = (restaurants = self.restaurants) => {
    restaurants.forEach(restaurant => {
        // Add marker to the map
        const marker = DBHelper.mapMarkerForRestaurant(restaurant, window.map);
        window.google.maps.event.addListener(marker, 'click', () => {
            window.location.href = marker.url
        });
        self.markers.push(marker);
    });
};
