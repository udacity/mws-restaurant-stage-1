let restaurants,
    neighborhoods,
    cuisines
var newMap
var markers = []

/**
 * Fetch neighborhoods and cuisines as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {
    initMap(); // added 
    fetchNeighborhoods();
    fetchCuisines();
});

/**
 * Fetch all neighborhoods and set their HTML.
 */
fetchNeighborhoods = () => {
    DBHelper.fetchNeighborhoods((error, neighborhoods) => {
        if (error) { // Got an error
            console.error(error);
        } else {
            self.neighborhoods = neighborhoods;
            fillNeighborhoodsHTML();
        }
    });
}

/**
 * Set neighborhoods HTML.
 */
fillNeighborhoodsHTML = (neighborhoods = self.neighborhoods) => {
    const select = document.getElementById('neighborhoods-select');
    neighborhoods.forEach(neighborhood => {
        const option = document.createElement('option');
        option.innerHTML = neighborhood;
        option.value = neighborhood;
        select.append(option);
    });
}

/**
 * Fetch all cuisines and set their HTML.
 */
fetchCuisines = () => {
    DBHelper.fetchCuisines((error, cuisines) => {
        if (error) { // Got an error!
            console.error(error);
        } else {
            self.cuisines = cuisines;
            fillCuisinesHTML();
        }
    });
}

/**
 * Set cuisines HTML.
 */
fillCuisinesHTML = (cuisines = self.cuisines) => {
    const select = document.getElementById('cuisines-select');

    cuisines.forEach(cuisine => {
        const option = document.createElement('option');
        option.innerHTML = cuisine;
        option.value = cuisine;
        select.append(option);
    });
}

/**
 * Initialize leaflet map, called from HTML.
 */
initMap = () => {
    if (typeof L !== 'undefined' && L) {
        self.newMap = L.map('map', {
            center: [40.722216, -73.987501],
            zoom: 12,
            scrollWheelZoom: false
        });
        L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.jpg70?access_token={mapboxToken}', {
            mapboxToken: MAPBOX_KEY,
            maxZoom: 18,
            attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
                '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
                'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
            id: 'mapbox.streets'
        }).addTo(newMap);
    }

    updateRestaurants();
}
/* window.initMap = () => {
  let loc = {
    lat: 40.722216,
    lng: -73.987501
  };
  self.map = new google.maps.Map(document.getElementById('map'), {
    zoom: 12,
    center: loc,
    scrollwheel: false
  });
  updateRestaurants();
} */

/**
 * Update page and map for current restaurants.
 */
updateRestaurants = () => {
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
}

/**
 * Clear current restaurants, their HTML and remove their map markers.
 */
resetRestaurants = (restaurants) => {
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

/**
 * Create all restaurants HTML and add them to the webpage.
 */
fillRestaurantsHTML = (restaurants = self.restaurants) => {
    const div = document.getElementById('restaurants-list');
    restaurants.forEach(restaurant => {
        div.append(createRestaurantHTML(restaurant));
    });
    addMarkersToMap();
}

/**
 * Create restaurant HTML.
 */
createRestaurantHTML = (restaurant) => {
    const div = document.createElement('div');

    const image = document.createElement('img');
    image.className = 'restaurant-img lazyload';
    const imgUrlBase = DBHelper.imageUrlForRestaurant(restaurant);
    const imgParts = imgUrlBase.split('.');
    const imgUrl1x = imgParts[0] + '_1x.' + (imgParts[1] || 'jpg');
    const imgUrl2x = imgParts[0] + '_2x.' + (imgParts[1] || 'jpg');
    // Special attributes to allow lazy-loading of the images
    image.setAttribute('data-srcset', `${imgUrl1x} 400w, ${imgUrl2x} 800w`);
    image.setAttribute('data-sizes', `(max-width: 800px) 80vw, 800px`);
    image.setAttribute('data-src', imgUrl1x);
    image.alt = restaurant.name + ' restaurant picture';
    div.append(image);

    const name = document.createElement('h1');
    name.innerHTML = restaurant.name;
    div.append(name);

    const neighborhood = document.createElement('p');
    neighborhood.innerHTML = restaurant.neighborhood;
    div.append(neighborhood);

    const address = document.createElement('p');
    address.innerHTML = restaurant.address;
    div.append(address);

    const more = document.createElement('button');
    more.innerHTML = 'View Details';
    more.onclick = () => window.location = DBHelper.urlForRestaurant(restaurant);
    div.append(more)

    const favorite = document.createElement('button');
    let isFavorite = (restaurant.is_favorite == 'true' || restaurant.is_favorite == true) ? true : false;
    favorite.innerHTML = (isFavorite ? 'un' : '') + 'set favorite';
    favorite.classList.add('favorite');
    favorite.setAttribute('role', 'switch');
    favorite.setAttribute('aria-checked', isFavorite);
    favorite.onclick = () => {
        toggleFavorite(restaurant, favorite);
        DBHelper.updateObject(restaurant, 'restaurant', (error, response) => {
            if (error) {
                console.error("Could not update neither local nor network database: ", error);
                toggleFavorite(restaurant, favorite);
            }
        });
    };
    div.append(favorite);

    return div;
}

/**
 * Add markers for current restaurants to the map.
 */
addMarkersToMap = (restaurants = self.restaurants) => {
    restaurants.forEach(restaurant => {
        // Add marker to the map
        const marker = DBHelper.mapMarkerForRestaurant(restaurant, self.newMap);
        marker.on("click", onClick);
        function onClick() {
            window.location.href = marker.options.url;
        }
        self.markers.push(marker);
    });
}

/**
 * Change favorite status of the restaurant
 */
toggleFavorite = (restaurant, button) => {
    restaurant.is_favorite = (restaurant.is_favorite == 'true' || restaurant.is_favorite == true) ? false : true;
    button.setAttribute('aria-checked', restaurant.is_favorite);
    button.innerHTML = (restaurant.is_favorite ? 'un' : '') + 'set favorite';
}

