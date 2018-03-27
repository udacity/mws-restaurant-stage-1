/* eslint-disable no-console, prefer-destructuring */
/* global DBHelper, google */
/** @namespace google.maps */
/** @namespace google.maps.Map */

let restaurant;
let map;

/* if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
        navigator.serviceWorker.register("/serviceWorker.js")
            .then(() => console.log("Service Worker Registered"))
            .catch(error => console.error("Error registering service worker", error));
    });
}*/

/**
 * Initialize Google map, called from HTML.
 */
window.initMap = () => {
    fetchRestaurantFromURL();
};

/**
 * Get current restaurant from page URL.
 */
const fetchRestaurantFromURL = () => {
    const id = getParameterByName("id");
    if (!id) { // no id found in URL
        console.error(`No restaurant id ${id} in URL`);
    } else {
        DBHelper.fetchRestaurantById(id)
            .then(response => {
                fillBreadcrumb(response);
                self.map = new google.maps.Map(document.getElementById("map"), {
                    zoom: 16,
                    center: response.latlng,
                    scrollwheel: false,
                });
                DBHelper.mapMarkerForRestaurant(response, self.map);
                return fillRestaurantHTML(response);
            })
            .catch(error => console.error(error));
    }
};

/**
 * Create restaurant HTML and add it to the webpage
 * @param {Object} restaurant
 * @param {string} restaurant.name
 * @param {string} restaurant.address
 * @param {string} restaurant.cuisine_type
 * @param {string} restaurant.photograph
 * @param {Object[]} restaurant.operating_hours
 * @param {Object[]} restaurant.reviews
 */
const fillRestaurantHTML = (restaurant = self.restaurant) => {
    const name = document.getElementById("restaurant-name");
    name.innerHTML = restaurant.name;

    const address = document.getElementById("restaurant-address");
    address.innerHTML = restaurant.address;

    const image = document.getElementById("restaurant-img");
    image.className = "restaurant-img";
    image.alt = restaurant.name;
    image.src = DBHelper.imageUrlForRestaurant(restaurant);

    const cuisine = document.getElementById("restaurant-cuisine");
    cuisine.innerHTML = restaurant.cuisine_type;

    // fill operating hours
    if (restaurant.operating_hours) {
        fillRestaurantHoursHTML(restaurant.operating_hours);
    }
    // fill reviews
    fillReviewsHTML(restaurant.reviews);
};

/**
 * Create restaurant operating hours HTML table and add it to the web page.
 * @param {Object[]} operatingHours
 */
const fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
    const hours = document.getElementById("restaurant-hours");
    for (const key in operatingHours) {
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
 * Create all reviews HTML and add them to the web page.
 * @param {Object[]} reviews
 */
const fillReviewsHTML = (reviews = self.restaurant.reviews) => {
    const container = document.getElementById("reviews-container");
    const title = document.createElement("h2");
    title.innerHTML = "Reviews";
    container.appendChild(title);

    if (!reviews) {
        const noReviews = document.createElement("p");
        noReviews.innerHTML = "No reviews yet!";
        container.appendChild(noReviews);
        return;
    }
    const ul = document.getElementById("reviews-list");
    reviews.forEach(review => {
        ul.appendChild(createReviewHTML(review));
    });
    container.appendChild(ul);
};

/**
 * Create review HTML and add it to the web page.
 * @param {Object} review
 * @param {string} review.name
 * @param {string} review.date
 * @param {string} review.rating
 * @param {string} review.comments
 * @return {Element}
 *
 */
const createReviewHTML = review => {
    const li = document.createElement("li");
    const name = document.createElement("p");
    name.innerHTML = review.name;
    name.className = "review-name";
    li.appendChild(name);

    const date = document.createElement("p");
    date.innerHTML = review.date;
    date.className = "review-date";
    li.appendChild(date);

    const rating = document.createElement("p");
    rating.innerHTML = `Rating: ${review.rating}`;
    rating.className = "review-rating";
    li.appendChild(rating);

    const comments = document.createElement("p");
    comments.innerHTML = review.comments;
    comments.className = "review-comments";
    li.appendChild(comments);

    return li;
};

/**
 * Add restaurant name to the breadcrumb navigation menu
 * @param {Object} restaurant
 * @param {string} restaurant.name
 */
const fillBreadcrumb = (restaurant = self.restaurant) => {
    const breadcrumb = document.getElementById("breadcrumb");
    const li = document.createElement("li");
    li.innerHTML = restaurant.name;
    breadcrumb.appendChild(li);
};

/**
 * Get a parameter by name from page URL.
 * @param {string} name
 * @param {string} url
 * @return {string|null}
 */
const getParameterByName = (name, url = window.location.href) => {
    if (!url) {
        url = window.location.href;
    }
    name = name.replace(/[\[\]]/g, "\\$&");
    const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`);
    const results = regex.exec(url);
    if (!results) {
        return null;
    }
    if (!results[2]) {
        return "";
    }
    return decodeURIComponent(results[2].replace(/\+/g, " "));
};
