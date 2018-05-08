let restaurants,
  neighborhoods,
  cuisines
var map
var markers = []
let dbHelper = new DBHelper();

/**
 * Fetch neighborhoods and cuisines as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {
  
  dbHelper.populateOfflineDatabase()
  .then(()=>{ // fill with network fresh data
    return Promise.all([
      dbHelper.getCuisines().then(fillCuisinesHTML),
      dbHelper.getNeighborhoods().then(fillNeighborhoodsHTML)
    ]).then(updateRestaurants)
  })  // fill with the locally stored
  .catch((err)=>{
    console.log(`Couldn't populate the database || ${err}`)
    return Promise.all([
      dbHelper.getCuisines().then(fillCuisinesHTML),
      dbHelper.getNeighborhoods().then(fillNeighborhoodsHTML)
    ]).then(updateRestaurants)
  })

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
}

/**
 * Update page and map for current restaurants.
 */
updateRestaurants = () => {
  const cSelect = document.getElementById('cuisines-select');
  const nSelect = document.getElementById('neighborhoods-select');

  const cIndex = cSelect.selectedIndex;
  const nIndex = nSelect.selectedIndex;

  const cuisine = (cSelect[cIndex].value == "all") ? undefined : cSelect[cIndex].value;
  const neighborhood = (nSelect[nIndex].value == "all") ? undefined : nSelect[nIndex].value;

  
  dbHelper.getRestaurantsByCuisineAndNeighborhood(cuisine, neighborhood)
    .then(resetRestaurants)
    .then(fillRestaurantsHTML)
    .catch( err => console.err(err) )
  
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
  const li = document.createElement('li');

  const image = document.createElement('img');
  image.className = 'restaurant-img';

  // decompose the url to allow selection of different images
  // in response to the image display size
  const baseURL = DBHelper.imageUrlForRestaurant(restaurant);
  let urlComponents = baseURL.split(".");

  image.src = `${urlComponents[0]}-400_1x.${urlComponents[1] || 'jpg' }`; // src for fallback
  image.srcset = `${urlComponents[0]}-400_1x.${ urlComponents[1] || 'jpg' } 1x,
                  ${urlComponents[0]}-800_2x.${ urlComponents[1] || 'jpg' } 2x`;

  image.alt = DBHelper.imageAltTextForRestaurant(restaurant);

  li.append(image);

  const name = document.createElement('h1');
  name.innerHTML = restaurant.name;
  li.append(name);

  const neighborhood = document.createElement('p');
  neighborhood.innerHTML = restaurant.neighborhood;
  li.append(neighborhood);

  const address = document.createElement('p');
  address.innerHTML = restaurant.address;
  li.append(address);

  const more = document.createElement('a');
  more.innerHTML = 'View Details';
  more.href = DBHelper.urlForRestaurant(restaurant);
  more.id = restaurant.name;

  more.setAttribute('aria-label', `${restaurant.name}: ${restaurant.cuisine_type} cuisine in ${restaurant.neighborhood} , View Details`);

  li.append(more);

  return li
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
