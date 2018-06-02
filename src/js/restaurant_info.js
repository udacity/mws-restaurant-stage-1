import { mapMarkerForRestaurant, fetchRestaurantById } from "./dbhelper";
import { getImage } from "./imageLoader";
import { initMap } from "./mapsLoader";

import "../css/normalize.css";
import "../css/styles.css";

// Check for Service Worker Support
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("/sw.js").then(() => {
    console.log("Service Worker Registered");
  });
}

window.state = {
  markers: [],
  map: undefined,
  restaurant: undefined
};

document.addEventListener("DOMContentLoaded", event => {
  loadMap();
});

/**
 * Initialize Google map, called from HTML.
 */
function loadMap() {
  fetchRestaurantFromURL((err, restaurant) => {
    if (err) {
      console.error(err);
    } else {
      initMap(document.getElementById("map"), {
        zoom: 16,
        center: restaurant.latlng,
        scrollwheel: false
      }).then(() => {
        fillBreadcrumb();
        mapMarkerForRestaurant(restaurant, window.state.map);
      });
    }
  });
}

/**
 * Get current restaurant from page URL.
 */
const fetchRestaurantFromURL = cb => {
  const id = getParameterByName("id");
  if (self.restaurant) {
    console.log("restaurant already fetched!");
    // restaurant already fetched!
    cb(null, self.restaurant);
  } else if (!id) {
    // no id found in URL
    error = "No restaurant id in URL";
    cb(error);
  } else {
    fetchRestaurantById(id, (err, restaurant) => {
      if (err) {
        cb(err, null);
      } else {
        self.restaurant = restaurant;
        if (restaurant) {
          fillRestaurantHTML(restaurant); // writes restaurant to the DOM
          cb(null, restaurant);
        }
      }
    });
  }
};

/**
 * Create restaurant HTML and add it to the webpage
 */
const fillRestaurantHTML = (restaurant = self.restaurant) => {
  const name = document.getElementById("restaurant-name");
  name.innerHTML = restaurant.name;

  const address = document.getElementById("restaurant-address");
  address.innerHTML = restaurant.address;

  const imageFile = getImage(restaurant.photograph);
  const image = document.getElementById("restaurant-img");
  image.className = "restaurant-img";
  image.setAttribute("alt", `Image of ${restaurant.name}`);
  image.srcset = imageFile.srcSet;
  image.src = imageFile.src;

  const cuisine = document.getElementById("restaurant-cuisine");
  cuisine.innerHTML = restaurant.cuisine_type;

  // fill operating hours
  if (restaurant.operating_hours) {
    fillRestaurantHoursHTML();
  }
  // fill reviews
  fillReviewsHTML(restaurant.reviews);
};

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
const fillRestaurantHoursHTML = (
  operatingHours = self.restaurant.operating_hours
) => {
  const hours = document.getElementById("restaurant-hours");
  hours.innerHTML = "";
  for (let key in operatingHours) {
    const row = document.createElement("tr");

    const day = document.createElement("td");
    day.innerHTML = key;
    row.appendChild(day);

    const time = document.createElement("td");
    time.innerHTML = operatingHours[key];
    row.appendChild(time);

    hours.appendChild(row);
  }
};

/**
 * Create all reviews HTML and add them to the webpage.
 */
const fillReviewsHTML = (reviews = self.restaurant.reviews) => {
  const container = document.getElementById("reviews-container");
  container.innerHTML = "";
  const title = document.createElement("h2");
  title.innerHTML = "Reviews";
  container.appendChild(title);

  if (!reviews) {
    const noReviews = document.createElement("p");
    noReviews.innerHTML = "No reviews yet!";
    container.appendChild(noReviews);
    return;
  }
  const reviewList = document.createElement("ul");
  reviewList.id = "reviews-list";
  reviews.forEach(review => {
    reviewList.appendChild(createReviewHTML(review));
  });
  container.appendChild(reviewList);
};

/**
 * Create review HTML and add it to the webpage.
 */
const createReviewHTML = review => {
  const li = document.createElement("li");
  const name = document.createElement("p");
  name.innerHTML = review.name;
  li.appendChild(name);

  const date = document.createElement("p");
  date.innerHTML = review.date;
  li.appendChild(date);

  const rating = document.createElement("p");
  rating.innerHTML = `Rating: ${review.rating}`;
  li.appendChild(rating);

  const comments = document.createElement("p");
  comments.innerHTML = review.comments;
  li.appendChild(comments);

  return li;
};

/**
 * Add restaurant name to the breadcrumb navigation menu
 */
const fillBreadcrumb = (restaurant = self.restaurant) => {
  const breadcrumb = document.getElementById("breadcrumb");
  while (breadcrumb.children.length > 1) {
    breadcrumb.removeChild(breadcrumb.lastChild);
  }
  const anchor = document.createElement("a");
  anchor.setAttribute("href", `restaurant.html?id=${restaurant.id}`);
  anchor.setAttribute("aria-current", "page");
  anchor.innerText = restaurant.name;
  const li = document.createElement("li");
  li.appendChild(anchor);
  breadcrumb.appendChild(li);
};

/**
 * Get a parameter by name from page URL.
 */
const getParameterByName = (name, url) => {
  if (!url) url = window.location.href;
  name = name.replace(/[\[\]]/g, "\\$&");
  const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
    results = regex.exec(url);
  if (!results) return null;
  if (!results[2]) return "";
  return decodeURIComponent(results[2].replace(/\+/g, " "));
};
