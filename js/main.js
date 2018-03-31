let restaurants,
  neighborhoods,
  cuisines
var map
var markers = []

// register service worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js');
}

/**
 * Fetch neighborhoods and cuisines as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {
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
 * Initialize Google map, called from HTML.
 */
window.initMap = () => {
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
}

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
  self.markers.forEach(m => m.setMap(null));
  self.markers = [];
  self.restaurants = restaurants;
}

/**
 * Create all restaurants HTML and add them to the webpage.
 */
fillRestaurantsHTML = (restaurants = self.restaurants) => {
  const ul = document.getElementById('restaurants-list');
  restaurants.forEach(restaurant => {
    ul.append(createRestaurantHTML(restaurant));
  });
  addMarkersToMap();
}

/**
 * Create restaurant HTML.
 */
createRestaurantHTML = (restaurant) => {
  const div = document.createElement('div');
  div.className = 'restaurant flexbox-item';

  const picture = document.createElement('picture');
  
  const imageFile = DBHelper.imageUrlForRestaurant(restaurant);
  const imageFileParts = imageFile.split(".");
  const imageFileName = imageFileParts[0];
  const imageFileExtension = imageFileParts[1];

  const source670 = document.createElement('source');
  source670.setAttribute('media', '(max-width: 700px)');
  source670.setAttribute("srcset", imageFileName+'-670px.'+imageFileExtension);
  picture.append(source670);

  const source451 = document.createElement('source');
  source451.setAttribute('media', '(max-width: 950px)');
  source451.setAttribute("srcset", imageFileName+'-451px.'+imageFileExtension);
  picture.append(source451);

  const source247 = document.createElement('source');
  source247.setAttribute('media', '(min-width: 951px)');
  source247.setAttribute("srcset", imageFileName+'-247px.'+imageFileExtension);
  picture.append(source247);

  const image = document.createElement('img');
  image.className = 'restaurant-img';
  image.alt = restaurant.name;
  /*image.src = DBHelper.imageUrlForRestaurant(restaurant);*/
  image.src = imageFileName+'-670px.'+imageFileExtension;
  picture.append(image);
  
/*
  const image = document.createElement('img');
  image.className = 'restaurant-img';
  image.alt = restaurant.name;
  image.src = DBHelper.imageUrlForRestaurant(restaurant);
  picture.append(image);
*/

  div.append(picture);

  const name = document.createElement('h1');
  name.innerHTML = restaurant.name;
  div.append(name);

  const neighborhood = document.createElement('p');
  neighborhood.innerHTML = restaurant.neighborhood;
  div.append(neighborhood);

  const address = document.createElement('p');
  address.innerHTML = restaurant.address;
  div.append(address);

  const moreBox = document.createElement('div');
  moreBox.className = 'buttonbox';

  const more = document.createElement('a');
  more.className = 'button';
  more.innerHTML = 'View Details';
  more.href = DBHelper.urlForRestaurant(restaurant);
  moreBox.append(more);
  div.append(moreBox);

  return div
}

/**
 * Add markers for current restaurants to the map.
 */
addMarkersToMap = (restaurants = self.restaurants) => {
  restaurants.forEach(restaurant => {
    // Add marker to the map
    const marker = DBHelper.mapMarkerForRestaurant(restaurant, self.map);
    google.maps.event.addListener(marker, 'click', () => {
      window.location.href = marker.url
    });
    self.markers.push(marker);
  });
}
