import {
  mapMarkerForRestaurant,
  fetchRestaurantById,
  fetchReviewsForRestaurant,
  postReview
} from "./dbhelper";
import { getImage } from "./imageLoader";
import { initMap } from "./mapsLoader";
import CreateReviewModal from "./CreateReviewModal";

import "../css/normalize.css";
import "../css/styles.css";
import { html, render } from "lit-html";

// Check for Service Worker Support
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("/sw.js").then(() => {
    console.log("Service Worker Registered");
  });
}

window.state = {
  markers: [],
  map: undefined,
  restaurant: undefined,
  mapClosed: true
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
    const error = "No restaurant id in URL";
    cb(error);
  } else {
    fetchRestaurantById(id, (err, restaurant) => {
      if (err) {
        cb(err, null);
      } else {
        self.restaurant = restaurant;
        if (restaurant) {
          fetchReviewsForRestaurant(restaurant.id, (err, reviews) => {
            if (err) {
              cb(err, null);
            } else {
              fillRestaurantHTML(restaurant, reviews); // writes restaurant to the DOM
              cb(null, restaurant, reviews);
            }
          });
        }
      }
    });
  }
};
/**
 * Get current restaurant from page URL.
 */
const fetchReviewsFromURL = () => {
  console.log("Fetching Reviews");
  const id = getParameterByName("id");
  fetchReviewsForRestaurant(id, (err, reviews) => {
    if (err) {
      console.log(err);
    } else {
      fillRestaurantHTML(restaurant, reviews); // writes restaurant to the DOM
    }
  });
};

/**
 * Create restaurant HTML and add it to the webpage
 */
const fillRestaurantHTML = (
  restaurant = self.restaurant,
  reviews = self.reviews
) => {
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
  fillReviewsHTML(reviews);
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

const NoReviews = () => html`
  <p>No Reviews yet!</p>
  `;

const ReviewList = reviews => html`
  ${reviews.map(review => Review(review))}
`;

/**
 * Create review HTML and add it to the webpage.
 */
const Review = review => html`
  <li>
    <p>${review.name}</p>
    <p>Created At: ${new Date(review.createdAt).toLocaleDateString() +
      " " +
      new Date(review.createdAt).toLocaleTimeString()}
    </p>
    <p>Updated At: ${new Date(review.createdAt).toLocaleDateString() +
      " " +
      new Date(review.createdAt).toLocaleTimeString()}
    </p>
    <p>Rating: ${review.rating}</p>
    <p>${review.comments}</p>
  </li>
  `;

/**
 * Create all reviews HTML and add them to the webpage.
 */
const fillReviewsHTML = (reviews = self.restaurant.reviews) => {
  const reviewsList = document.getElementById("reviews-list");
  render(
    reviews && reviews.length ? ReviewList(reviews) : NoReviews(),
    reviewsList
  );
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

const CRM = new CreateReviewModal({
  restaurantID: getParameterByName("id"),
  onSubmit: postBody =>
    postReview(postBody).then(() => {
      // If we don't support background syncing, refresh after 500ms
      if (!"SyncManager" in window) {
        window.setTimeout(() => {
          fetchReviewsFromURL();
        }, 500);
      }
    })
});

const addReviewButton = document.querySelector("#add-review-btn");
addReviewButton.addEventListener("click", () => CRM.open());

if ("serviceWorker" in navigator) {
  // Handler for messages coming from the service worker
  navigator.serviceWorker.addEventListener("message", event => {
    console.log("[App] Received Message from SW: " + event.data);
    // This is not really used, but this shows how to send an immediate response using the second channel
    event.ports[0].postMessage("ACK");
    switch (event.data) {
      // Allows the service worker to tell the client to refresh the reviews if new posts are available
      case "refresh":
        console.log("[App] Instructed to Refresh Cards: " + event.data);
        fetchReviewsFromURL();
        break;
    }
  });
}

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
