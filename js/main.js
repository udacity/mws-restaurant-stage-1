/* globals DBHelper */

let restaurants;
let neighborhoods;
let cuisines;
var newMap; // ugh
let markers = [];

// Fetch neighborhoods and cuisines as soon as the page is loaded.
document.addEventListener('DOMContentLoaded', event => {
    initMap(); // added
    fetchNeighborhoods();
    fetchCuisines();
});

// Fetch all neighborhoods and set their HTML.
fetchNeighborhoods = () => {
    DBHelper.fetchNeighborhoods((error, neighborhoods) => {
        if (error) { // Got an error
            throw error;
        } else {
            self.neighborhoods = neighborhoods;
            fillNeighborhoodsHTML();
        }
    });
}

// Set neighborhoods HTML.
fillNeighborhoodsHTML = (neighborhoods = self.neighborhoods) => {
    const select = document.getElementById('neighborhoods-select');

    neighborhoods.forEach(neighborhood => {
        const option = document.createElement('option');
        option.innerHTML = neighborhood;
        option.value = neighborhood;
        select.append(option);
    });
}

// Fetch all cuisines and set their HTML.
fetchCuisines = () => {
    DBHelper.fetchCuisines((error, cuisines) => {
        if (error) { // Got an error!
            throw error;
        } else {
            self.cuisines = cuisines;
            fillCuisinesHTML();
        }
    });
}

// Set cuisines HTML.
fillCuisinesHTML = (cuisines = self.cuisines) => {
    const select = document.getElementById('cuisines-select');

    cuisines.forEach(cuisine => {
        const option = document.createElement('option');
        option.innerHTML = cuisine;
        option.value = cuisine;
        select.append(option);
    });
}

// Initialize leaflet map, called from HTML.
initMap = () => {
    self.newMap = L.map('map', {
        center: [40.722216, -73.987501],
        zoom: 12,
        scrollWheelZoom: false
    });
    L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.jpg70?access_token={mapboxToken}', {
        mapboxToken: 'pk.eyJ1Ijoiam9ubGluayIsImEiOiJjamwzM3c2enowM3cxM3ZyeHp5ejl4M3c5In0.QfxCqP7NfzFifui4vPyMuA',
        maxZoom: 18,
        attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
            '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
            'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
        id: 'mapbox.streets'
    }).addTo(newMap);

    updateRestaurants();
}

// Update page and map for current restaurants.
updateRestaurants = () => {
    const cSelect = document.getElementById('cuisines-select');
    const nSelect = document.getElementById('neighborhoods-select');

    const cIndex = cSelect.selectedIndex;
    const nIndex = nSelect.selectedIndex;

    const cuisine = cSelect[cIndex].value;
    const neighborhood = nSelect[nIndex].value;

    DBHelper.fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, (error, restaurants) => {
        if (error) { // Got an error!
            throw error;
        } else {
            resetRestaurants(restaurants);
            fillRestaurantsHTML();
        }
    })
}

// Clear current restaurants, their HTML and remove their map markers.
resetRestaurants = restaurants => {
    // Remove all restaurants
    self.restaurants = [];
    const ul = document.getElementById('restaurants-list');
    ul.innerHTML = '';

    // Remove all map markers
    if (self.markers) {
        self.markers.forEach(marker => marker.remove());
    }
    self.markers = [];
    self.restaurants = restaurants;
}

// Create all restaurants HTML and add them to the webpage.
fillRestaurantsHTML = (restaurants = self.restaurants) => {
    const ul = document.getElementById('restaurants-list');
    restaurants.forEach(restaurant => {
        ul.append(createRestaurantHTML(restaurant));
    });
    addMarkersToMap();
}

// Create restaurant HTML.
createRestaurantHTML = restaurant => {
    const img_url_fragment = DBHelper.imageUrlForRestaurant(restaurant);
    const html = `
    <div>
        <img class="restaurant-img" src="${img_url_fragment}-300.jpg" srcset="${img_url_fragment}-600.jpg 1000w, ${img_url_fragment}-1200.jpg 2000w">
        <h1>${restaurant.name}</h1>
        <p>${restaurant.neighborhood}</p>
        <p>${restaurant.address}</p>
        <a href="${DBHelper.urlForRestaurant(restaurant)}" aria-label="${restaurant.name}. View details">View Details</a>
    </div>`;
    return document.createRange().createContextualFragment(html);
}

// Add markers for current restaurants to the map.
addMarkersToMap = (restaurants = self.restaurants) => {
    restaurants.forEach(restaurant => {
        // Add marker to the map
        const marker = DBHelper.mapMarkerForRestaurant(restaurant, self.newMap);
        marker.on("click", onClick);
        marker.tabindex = -1;

        function onClick() {
            window.location.href = marker.options.url;
        }
        self.markers.push(marker);
    });
}

if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js');
}
