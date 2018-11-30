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
const fetchNeighborhoods = () => {
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
const fillNeighborhoodsHTML = (neighborhoods = self.neighborhoods) => {
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
const fetchCuisines = () => {
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
const fillCuisinesHTML = (cuisines = self.cuisines) => {
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
const initMap = () => {
  self.newMap = L.map('map', {
        center: [40.722216, -73.987501],
        zoom: 12,
        scrollWheelZoom: false
      });
  L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.jpg70?access_token={mapboxToken}', {
    mapboxToken: 'pk.eyJ1IjoiYWxleGlza29zcyIsImEiOiJjam52YmU4dGswM25kM3FubnNrYW5rOGkyIn0.aDZvRrwGTkTT0dacJqN5bw',
    maxZoom: 18,
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
      '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
      'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
    id: 'mapbox.streets'
  }).addTo(newMap);

  updateRestaurants();
}

/**
 * Update page and map for current restaurants.
 */
const updateRestaurants = () => {
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
const resetRestaurants = (restaurants) => {
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
const fillRestaurantsHTML = (restaurants = self.restaurants) => {
  const ul = document.getElementById('restaurants-list');
  restaurants.forEach(restaurant => {
    ul.append(createRestaurantHTML(restaurant));
  });
  addMarkersToMap();
}

/**
 * Create restaurant HTML.
 */
const createRestaurantHTML = (restaurant) => {
  const li = document.createElement('li');

  const image = document.createElement('img');
  image.className = 'restaurant-img';
  const imageURL = DBHelper.imageUrlForRestaurant(restaurant, 'tiles');
  const imageSplit = imageURL.split('.');
  const image1x = imageSplit[0] + '-300_1x.' + imageSplit[1];
  const image2x = imageSplit[0] + '-600_2x.' + imageSplit[1];
  image.src = image1x;
  image.alt = `${restaurant.name} promo image`
  image.srcset = `${image1x} 300w, ${image2x} 600w`;
  li.append(image);

  const text = document.createElement('div');
  text.className = 'restaurant-text';

  const name = document.createElement('h2');
  name.innerHTML = restaurant.name;
  name.tabIndex = '0';
  text.append(name);

  const neighborhood = document.createElement('p');
  neighborhood.innerHTML = restaurant.neighborhood;
  neighborhood.className = 'restaurant-neighborhood';
  text.append(neighborhood);

  const address = document.createElement('p');
  address.innerHTML = restaurant.address;
  address.className = 'restaurant-address';
  text.append(address);

  const button = document.createElement('button');
  button.innerHTML = 'View Details';
  button.onclick = function() {
    const restaurantURL = DBHelper.urlForRestaurant(restaurant);
    window.location = restaurantURL;
  }
  text.append(button);

  const favoriteDiv = document.createElement('div');
  const favoriteBtn = document.createElement('button');
  favoriteBtn.id = `favorite-${restaurant.id}`;
  const isFavorite = (restaurant.is_favorite && restaurant['is_favorite'].toString() === 'true') ? true : false;
  favoriteBtn.innerHTML = (isFavorite) ? '<i class="fas fa-star is-favorited"></i> favorite' : '<i class="fas fa-star is-not-favorited"></i> favorite';
  const attr = document.createAttribute('aria-label');
  attr.value = (isFavorite) ? `${restaurant.name} is favorited` : `${restaurant.name} is not favorited`;
  favoriteBtn.setAttributeNode(attr);
  
  favoriteBtn.onclick = (e) => handleFavorite(restaurant, isFavorite);
  favoriteDiv.className = 'favorite';
  favoriteDiv.append(favoriteBtn);
  text.append(favoriteDiv);

  li.append(text);
  return li
}

/**
 * Handle favorites for restaurant listings.
 */
const handleFavorite = (restaurant, isFavorite) => {
  const newFavoriteState = !isFavorite;
  const favoriteRestaurant = document.getElementById(`favorite-${restaurant.id}`);
  favoriteRestaurant.onclick = null; 
  
  //update the restaurant's favorite state
  restaurant.is_favorite = newFavoriteState;
  favoriteRestaurant.onclick = (e) => handleFavorite(restaurant, !isFavorite);

  DBHelper.handleFavorite(restaurant, newFavoriteState);
}

/**
 * Add markers for current restaurants to the map.
 */
const addMarkersToMap = (restaurants = self.restaurants) => {
  restaurants.forEach(restaurant => {
    // Add marker to the map
    const marker = DBHelper.mapMarkerForRestaurant(restaurant, self.newMap);
    marker.on('click', onClick);
    function onClick() {
      window.location.href = marker.options.url;
    }
    self.markers.push(marker);
  });

} 
/* addMarkersToMap = (restaurants = self.restaurants) => {
  restaurants.forEach(restaurant => {
    // Add marker to the map
    const marker = DBHelper.mapMarkerForRestaurant(restaurant, self.map);
    google.maps.event.addListener(marker, 'click', () => {
      window.location.href = marker.url
    });
    self.markers.push(marker);
  });
} */

