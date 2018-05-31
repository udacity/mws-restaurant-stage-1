import DBHelper from './dbhelper.js';
import 'intersection-observer';

let restaurants;
let neighborhoods;
let cuisines;
let map;
self.markers = [];

let lazyImageObserver;

/**
 * Lazy load offscreen images
 */
if ("IntersectionObserver" in window) {
  lazyImageObserver = new IntersectionObserver(function (entries, observer) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        let lazyImage = entry.target;
        lazyImage.src = lazyImage.dataset.src;
        lazyImage.srcset = lazyImage.dataset.srcset;
        lazyImageObserver.unobserve(lazyImage);
      }
    });
  });
}

/**
 * Fetch neighborhoods and cuisines as soon as the page is loaded.
 */
fetchNeighborhoods();
fetchCuisines();

/**
 * Fetch all neighborhoods and set their HTML.
 */
function fetchNeighborhoods() {
  DBHelper.fetchNeighborhoods(function (error, neighborhoods) {
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
function fillNeighborhoodsHTML(neighborhoods = self.neighborhoods) {
  const select = document.getElementById('neighborhoods-select');

  select.innerHTML = '';

  const option = document.createElement('option');
  option.innerHTML = 'All Neighborhoods';
  option.value = 'all';
  select.appendChild(option);

  neighborhoods.forEach(neighborhood => {
    const option = document.createElement('option');
    option.innerHTML = neighborhood;
    option.value = neighborhood;
    select.appendChild(option);
  });
}

/**
 * Fetch all cuisines and set their HTML.
 */
function fetchCuisines() {
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
function fillCuisinesHTML(cuisines = self.cuisines) {
  const select = document.getElementById('cuisines-select');

  select.innerHTML = '';

  const option = document.createElement('option');
  option.innerHTML = 'All Cuisines';
  option.value = 'all';
  select.appendChild(option);

  cuisines.forEach(cuisine => {
    const option = document.createElement('option');
    option.innerHTML = cuisine;
    option.value = cuisine;
    select.appendChild(option);
  });
}

/**
 * Initialize Google map, called from HTML.
 */
window.initMap = function () {
  let loc = {
    lat: 40.722216,
    lng: -73.987501
  };
  self.map = new google.maps.Map(document.getElementById('map'), {
    zoom: 12,
    center: loc,
    scrollwheel: false,
    mapTypeControl: false,
    streetViewControl: false
  });
  updateRestaurants();
}

/**
 * Update page and map for current restaurants.
 */
function updateRestaurants() {
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

document.getElementById('cuisines-select').addEventListener('change', updateRestaurants);
document.getElementById('neighborhoods-select').addEventListener('change', updateRestaurants);

/**
 * Clear current restaurants, their HTML and remove their map markers.
 */
function resetRestaurants(restaurants) {
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
function fillRestaurantsHTML(restaurants = self.restaurants) {
  const ul = document.getElementById('restaurants-list');
  restaurants.forEach(restaurant => ul.appendChild(createRestaurantHTML(restaurant)));
  addMarkersToMap();
}

/**
 * Create restaurant HTML.
 */
function createRestaurantHTML(restaurant) {
  const li = document.createElement('li');
  li.classList.add('card');

  const image = document.createElement('img');
  image.classList.add('restaurant-img');
  image.classList.add('lazy');

  const imageUrl = DBHelper.imageUrlForRestaurant(restaurant);
  image.dataset.src = imageUrl;

  const imagePath = imageUrl.substring(0, imageUrl.lastIndexOf('.'));
  const imageType = imageUrl.substring(imageUrl.lastIndexOf('.'), imageUrl.length);

  image.src = `img/placeholder.svg`;

  image.dataset.srcset =
    `${imagePath}-300w${imageType} 300w,` +
    `${imagePath}-550w${imageType} 550w`;

  image.dataset.sizes =
    `(min-width: 1024px) 300px,` +
    `(min-width: 720px) 300px,` +
    `(min-width: 480px) 300px,` +
    `(max-width: 479px) 550px`;

  image.alt = `A view from the restaurant ${restaurant.name}`;

  if (lazyImageObserver)
    lazyImageObserver.observe(image);

  li.appendChild(image);

  const name = document.createElement('h3');
  name.innerHTML = restaurant.name;
  li.appendChild(name);

  const neighborhood = document.createElement('p');
  neighborhood.innerHTML = restaurant.neighborhood;
  li.appendChild(neighborhood);

  const address = document.createElement('p');
  address.innerHTML = restaurant.address;
  li.appendChild(address);

  const more = document.createElement('a');
  more.classList.add('button');
  more.innerHTML = 'View Details';
  more.href = DBHelper.urlForRestaurant(restaurant);
  more.setAttribute('aria-label', `view details about ${restaurant.name}`);
  li.appendChild(more)

  return li
}

/**
 * Add markers for current restaurants to the map.
 */
function addMarkersToMap(restaurants = self.restaurants) {
  restaurants.forEach(restaurant => {
    // Add marker to the map
    const marker = DBHelper.mapMarkerForRestaurant(restaurant, self.map);
    google.maps.event.addListener(marker, 'click', () => {
      window.location.href = marker.url
    });
    self.markers.push(marker);
  });
}