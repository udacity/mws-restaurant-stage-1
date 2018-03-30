import Config from "../../config";
import DBHelper from './dbhelper';
import GoogleMapsLoader from './google-maps-loader';
import PictureHelper from "./picturehelper";

let restaurant;

export function initDetails() {
    fetchRestaurantFromURL((error, restaurant) => {
        if (error) { // Got an error!
            console.error(error);
        }
        /**
         * Initialize Google map, called from HTML.
         */
        const gml = new GoogleMapsLoader();
        gml.KEY = Config.GOOGLE_MAPS_API_KEY || "YOUR_GOOGLE_MAPS_API_KEY";
        gml.LIBRARIES = ['places'];
        gml.load(
            function (map) {
                window.map =map;
                fillBreadcrumb();
                DBHelper.mapMarkerForRestaurant(self.restaurant, window.map);
            },
            Config.GOOGLE_MAPS_OPTIONS
        );
    });
}

/**
 * Get current restaurant from page URL.
 */
export const fetchRestaurantFromURL = (callback) => {
    if (self.restaurant) { // restaurant already fetched!
        callback(null, self.restaurant);
        return;
    }
    const id = getParameterByName('id');
    if (!id) { // no id found in URL
        error = 'No restaurant id in URL';
        callback(error, null);
    } else {
        DBHelper.fetchRestaurantById(id, (error, restaurant) => {
            self.restaurant = restaurant;
            if (!restaurant) {
                console.error(error);
                return;
            }
            fillRestaurantHTML();
            callback(null, restaurant)
        });
    }
};

/**
 * Create restaurant HTML and add it to the webpage
 */
export const fillRestaurantHTML = (restaurant = self.restaurant) => {
    const name = document.getElementById('restaurant-name');
    name.innerHTML = restaurant.name;

    const address = document.getElementById('restaurant-address');
    address.innerHTML = restaurant.address;

    const targetPicture = document.getElementById('restaurant-img');
    const newPicture = PictureHelper.getPictureElement(restaurant);
    targetPicture.replaceWith(newPicture);

    const cuisine = document.getElementById('restaurant-cuisine');
    cuisine.innerHTML = restaurant.cuisine_type;

    // fill operating hours
    if (restaurant.operating_hours) {
        fillRestaurantHoursHTML();
    }
    // fill reviews
    fillReviewsHTML();
};

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
export const fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
    const hours = document.getElementById('restaurant-hours');
    for (let key in operatingHours) {
        const row = document.createElement('tr');

        const day = document.createElement('td');
        day.innerHTML = key;
        row.appendChild(day);

        const time = document.createElement('td');
        time.innerHTML = operatingHours[key];
        row.appendChild(time);

        hours.appendChild(row);
    }
};

/**
 * Create all reviews HTML and add them to the webpage.
 */
export const fillReviewsHTML = (reviews = self.restaurant.reviews) => {
    const container = document.getElementById('reviews-container');
    const title = document.createElement('h2');
    title.innerHTML = 'Reviews';
    container.appendChild(title);

    if (!reviews) {
        const noReviews = document.createElement('p');
        noReviews.innerHTML = 'No reviews yet!';
        container.appendChild(noReviews);
        return;
    }
    const ul = document.getElementById('reviews-list');
    reviews.forEach(review => {
        ul.appendChild(createReviewHTML(review));
    });
    container.appendChild(ul);
};

/**
 * Create review HTML and add it to the webpage.
 */
export const createReviewHTML = (review) => {
    const li = document.createElement('li');

    const rating = document.createElement('span');
    rating.innerHTML = createRating(review.rating);
    li.appendChild(rating);

    const comments = document.createElement('p');
    comments.innerHTML = review.comments;
    li.appendChild(comments);

    const name = document.createElement('p');
    name.innerHTML = `<i>${review.date} (${review.name})</i>`;
    li.appendChild(name);

    return li;
};

export const createRating = rating => {
    let rateHtml = '<b>Rating: </b> ';
    for(let i = 0; i < 5; i++){
        if (i < rating){
            rateHtml += '<span class="fa fa-star checked"></span>';
        } else {
            rateHtml += '<span class="fa fa-star"></span>';
        }
    }

    return rateHtml;
};

/**
 * Add restaurant name to the breadcrumb navigation menu
 * todo: add aria current
 */
export const fillBreadcrumb = (restaurant = self.restaurant) => {
    const breadcrumb = document.getElementById('breadcrumb');
    const li = document.createElement('li');
    li.innerHTML = restaurant.name;
    breadcrumb.appendChild(li);
};

/**
 * Get a parameter by name from page URL.
 */
export const getParameterByName = (name, url) => {
    if (!url) {
        url = window.location.href;
    }
    name = name.replace(/[\[\]]/g, '\\$&');
    const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
        results = regex.exec(url);
    if (!results) {
        return null;
    }
    if (!results[2]) {
        return '';
    }
    return decodeURIComponent(results[2].replace(/\+/g, ' '));
};
