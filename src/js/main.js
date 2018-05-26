import * as idb from "idb";
import {
  fetchNeighborhoods,
  fetchCuisines,
  fetchRestaurantByCuisineAndNeighborhood,
  mapMarkerForRestaurant,
  urlForRestaurant
} from "./dbhelper";

import "../css/normalize.css";
import "../css/styles.css";
import { getImage } from "./imageLoader";
import { initMap } from "./mapsLoader";

// Check for Service Worker Support
// if ("serviceWorker" in navigator) {
//   navigator.serviceWorker.register("/sw.js").then(() => {
//     console.log("Service Worker Registered");
//   });
// }

// Global State container used to keep track of the Google Map
window.state = {
  markers: [],
  map: {}
};

/**
 * Fetch neighborhoods and cuisines as soon as the page is loaded.
 */
document.addEventListener("DOMContentLoaded", event => {
  loadMap();
  fetchAndFillNeighborhoods();
  fetchAndFillCuisines();
});

/**
 * Fetch all neighborhoods and set their HTML.
 */
const fetchAndFillNeighborhoods = () => {
  fetchNeighborhoods((error, neighborhoods) => {
    if (error) {
      // Got an error
      console.error(error);
    } else {
      fillNeighborhoodsHTML(neighborhoods);
    }
  });
};

/**
 * Set neighborhoods HTML.
 */
const fillNeighborhoodsHTML = neighborhoods => {
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
const fetchAndFillCuisines = () => {
  fetchCuisines((error, cuisines) => {
    if (error) {
      // Got an error!
      console.error(error);
    } else {
      fillCuisinesHTML(cuisines);
    }
  });
};

/**
 * Set cuisines HTML.
 */
const fillCuisinesHTML = cuisines => {
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
function loadMap() {
  let loc = {
    lat: 40.722216,
    lng: -73.987501
  };
  initMap(document.getElementById("map"), {
    zoom: 12,
    center: loc,
    scrollwheel: false
  }).then(() => updateRestaurants());
}

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
  fetchRestaurantByCuisineAndNeighborhood(
    cuisine,
    neighborhood,
    (err, filteredRestaurants) => {
      if (err) throw err;
      resetRestaurants(filteredRestaurants);
      fillRestaurantsHTML(filteredRestaurants);
    }
  );
};

// Add to window object so that the HTML selectors can see this
window.updateRestaurants = updateRestaurants;

/**
 * Clear current restaurants, their HTML and remove their map markers.
 */
const resetRestaurants = restaurants => {
  const ul = document.getElementById("restaurants-list");
  ul.innerHTML = "";

  // Remove all map markers
  state.markers.forEach(m => m.setMap(null));
  state.markers = [];
};

/**
 * Create all restaurants HTML and add them to the webpage.
 */
const fillRestaurantsHTML = restaurants => {
  const ul = document.getElementById("restaurants-list");
  restaurants.forEach(restaurant => {
    ul.append(createRestaurantHTML(restaurant));
  });
  addMarkersToMap(restaurants);
};

/**
 * Create restaurant HTML.
 */
const createRestaurantHTML = restaurant => {
  const imageFile = getImage(restaurant.photograph);
  const li = document.createElement("li");
  const image = document.createElement("img");
  image.className = "restaurant-img";
  image.setAttribute("alt", `Image of ${restaurant.name}`);
  image.setAttribute("sizes", "(max-width: 450px) 90vw, 600px");
  image.srcset = imageFile.srcSet;
  image.src = imageFile.src;
  li.append(image);

  const name = document.createElement("h1");
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
  more.href = urlForRestaurant(restaurant);
  li.append(more);
  return li;
};

/**
 * Add markers for current restaurants to the map.
 */
const addMarkersToMap = (restaurants, map = window.state.map) => {
  restaurants.forEach(restaurant => {
    // Add marker to the map
    const marker = mapMarkerForRestaurant(restaurant, map);
    google.maps.event.addListener(marker, "click", () => {
      window.location.href = marker.url;
    });
    state.markers.push(marker);
  });
};
