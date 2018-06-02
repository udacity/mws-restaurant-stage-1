import * as idb from "idb";
import "../../node_modules/responsively-lazy/responsivelyLazy.js";
import "../../node_modules/responsively-lazy/responsivelyLazy.css";
import {
  fetchNeighborhoods,
  fetchCuisines,
  fetchRestaurantByCuisineAndNeighborhood,
  mapMarkerForRestaurant,
  urlForRestaurant
} from "./dbhelper";
import heartTemplate from "./heart";

import "../css/normalize.css";
import "../css/styles.css";
import { getImage } from "./imageLoader";
import { initMap } from "./mapsLoader";
import { html, render } from "lit-html";

// Check for Service Worker Support
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("/sw.js").then(() => {
    console.log("Service Worker Registered");
  });
}

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

window.clickFavorite = target => {
  const restaurantID = target.dataset.restaurantid;
  console.log(`Clicked on ${restaurantID}`);
};

/**
 * Create restaurant HTML.
 */
const createRestaurantHTML = restaurant => {
  console.log(restaurant);
  const li = document.createElement("li");
  const restaurantTemplate = restaurant => html`
    <div class="responsively-lazy" style="padding-bottom: 75%;">
      <img 
        alt="Image of ${restaurant.name}" 
        class="restaurant-img"
        sizes="(max-width: 450px) 90vw, 600px" 
        data-srcset=${getImage(restaurant.photograph).srcSet}
        srcset="data:image/gif;base64,R0lGODlhAQABAIAAAP///////yH5BAEKAAEALAAAAAABAAEAAAICTAEAOw=="
        src=${getImage(restaurant.photograph).src}
      />
    </div>
    <h1>${restaurant.name}</h1>
    <p>${restaurant.neighborhood}</p>
    <p>${restaurant.address}</p>
    <div style="display: flex; flex-direction: row;">
      <a href=${urlForRestaurant(restaurant)}>View Details</a>
    <button type="button" style="padding-top: 10px;" class="favorite-button" data-restaurantid=${
      restaurant.id
    } onclick="clickFavorite(this)">
      ${heartTemplate(40, 40)}
    </button>
    </div>
  `;

  render(heartTemplate(50, 50), li);
  render(restaurantTemplate(restaurant), li);

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
