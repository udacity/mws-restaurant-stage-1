import * as idb from "idb";
import "../../node_modules/responsively-lazy/responsivelyLazy.js";
import "../../node_modules/responsively-lazy/responsivelyLazy.css";
import {
  fetchNeighborhoods,
  fetchCuisines,
  fetchRestaurantByCuisineAndNeighborhood,
  mapMarkerForRestaurant,
  updateRestaurant
} from "./dbhelper";

import "../css/normalize.css";
import "../css/styles.css";
import { initMap, setMarkers } from "./mapsLoader";
import RestaurantList from "./RestaurantList";
import { render } from "lit-html";
import { getSelectedCuisineAndNeighborhood } from "./Toolbar";

// Check for Service Worker Support
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("/sw.js").then(() => {
    console.log("Service Worker Registered");
  });
}

// Global State container used to keep track of the Google Map
window.state = {
  markers: [],
  map: {},
  restaurants: [],
  mapClosed: true
};

/**
 * Fetch neighborhoods and cuisines as soon as the page is loaded.
 */
document.addEventListener("DOMContentLoaded", event => {
  updateRestaurants();
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
export const updateRestaurants = () => {
  const { cuisine, neighborhood } = getSelectedCuisineAndNeighborhood();
  fetchRestaurantByCuisineAndNeighborhood(
    cuisine,
    neighborhood,
    (err, filteredRestaurants) => {
      if (err) throw err;
      clearMarkers(filteredRestaurants);
      renderRestaurantList(filteredRestaurants);
      setMarkers(filteredRestaurants);
    }
  );
};

// Add to window object so that the HTML selectors can see this
window.updateRestaurants = updateRestaurants;

/**
 * Remove all map markers.
 */
const clearMarkers = restaurants => {
  state.markers.forEach(m => m.setMap(null));
  state.markers = [];
};

/**
 * Create all restaurants HTML and add them to the webpage.
 */
const renderRestaurantList = restaurants => {
  const restaurantListMountPoint = document.getElementById("restaurants-list");
  render(RestaurantList(restaurants), restaurantListMountPoint);
};

const toggleMapBtn = document.querySelector("#maptoggle");
const mapContainer = document.querySelector("#map-container");

toggleMapBtn.addEventListener("click", () => {
  if (window.state.mapClosed) {
    mapContainer.style.height = "50vh";
    window.state.mapClosed = false;
    toggleMapBtn.setAttribute("aria-pressed", "true");
    loadMap();
  } else {
    mapContainer.style.height = "0vh";
    window.state.mapClosed = true;
    toggleMapBtn.setAttribute("aria-pressed", "false");
  }
});
