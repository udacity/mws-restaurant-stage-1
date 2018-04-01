let restaurant;
var map;

document.addEventListener('DOMContentLoaded', (event) => {
  fetchRestaurantFromURL();
  initServiceWorker();
});

let initServiceWorker = () => {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('/sw.js').then(function (registration) {
        // Registration was successful
        console.log('ServiceWorker registration successful with scope: ', registration.scope);
      }).catch(function (err) {
        // registration failed :(
        console.log('ServiceWorker registration failed: ', err);
      });
    });
  }
}

/**
 * Initialize Google map, called from HTML.
 */
let initMap = () => {
  fetchRestaurantFromURL((error, restaurant) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.map = new google.maps.Map(document.getElementById('map'), {
        zoom: 16,
        center: restaurant.latlng,
        scrollwheel: false
      });
      fillBreadcrumb();
      DBHelper.mapMarkerForRestaurant(self.restaurant, self.map);
    }
  });
}

/**
 * Get current restaurant from page URL.
 */
let fetchRestaurantFromURL = (callback) => {
      if (self.restaurant) { // restaurant already fetched!
        callback(null, self.restaurant)
        return;
      }
      const id = getParameterByName('id');
      if (!id) { // no id found in URL
        error = 'No restaurant id in URL'
        callback(error, null);
      } else {
        DBHelper.fetchRestaurantById(id, (error, restaurant) => {
          self.restaurant = restaurant;
          if (!restaurant) {
            console.error(error);
            return;
          }
          fillRestaurantHTML();

          if (!callback) {
            return;
          }

          callback(null, restaurant)
        });
      }
    }

/**
 * Create restaurant HTML and add it to the webpage
 */
let fillRestaurantHTML = (restaurant = self.restaurant) => {
      const name = document.getElementById('restaurant-name');
      name.innerHTML = restaurant.name;

      const address = document.getElementById('restaurant-address');
      address.innerHTML = restaurant.address;

      fillRestaurantPicture(restaurant);

      const cuisine = document.getElementById('restaurant-cuisine');
      cuisine.innerHTML = restaurant.cuisine_type;

      // fill operating hours
      if (restaurant.operating_hours) {
        fillRestaurantHoursHTML();
      }
      // fill reviews
      fillReviewsHTML();
    }

let fillRestaurantPicture = (restaurant) => {
      const picture = document.getElementById('restaurant-img');
      picture.className = 'restaurant-img'

      const image_large = document.createElement('source');
      image_large.setAttribute('media', '(min-width: 1000px)');
      image_large.setAttribute('srcset', DBHelper.imageUrlForRestaurant(restaurant, 'large'));
      image_large.setAttribute('alt', restaurant.name);

      const image_medium = document.createElement('source');
      image_medium.setAttribute('media', '(min-width: 650px)');
      image_medium.setAttribute('srcset', DBHelper.imageUrlForRestaurant(restaurant, 'medium'));
      image_medium.setAttribute('alt', restaurant.name);

      const image = document.createElement('img');
      image.setAttribute('srcset', DBHelper.imageUrlForRestaurant(restaurant, 'small'));
      image.setAttribute('src', DBHelper.imageUrlForRestaurant(restaurant, 'small'));
      image.setAttribute('alt', restaurant.name);

      picture.appendChild(image_large);
      picture.appendChild(image_medium);
      picture.appendChild(image);
    }

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
let fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
      const hours = document.getElementById('restaurant-hours');
      for (let key in operatingHours) {
        const row = document.createElement('tr');

        const day = document.createElement('td');
        day.innerHTML = key;
        day.className = 'restaurant-day';
        row.appendChild(day);

        const time = document.createElement('td');
        time.innerHTML = operatingHours[key];
        time.className = 'restaurant-time';
        row.appendChild(time);

        hours.appendChild(row);
      }
    }

/**
 * Create all reviews HTML and add them to the webpage.
 */
let fillReviewsHTML = (reviews = self.restaurant.reviews) => {
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

      reviews.forEach(review => {
        container.appendChild(createReviewHTML(review));
      });
      //container.appendChild(ul);
    }

/**
 * Create review HTML and add it to the webpage.
 */
let createReviewHTML = (review) => {
      const reviewArticle = document.createElement('article');
      reviewArticle.className = 'review';

      const reviewHeader = document.createElement('div');
      reviewHeader.className = 'review-header';
      reviewArticle.appendChild(reviewHeader);

      const name = document.createElement('h2');
      name.innerHTML = review.name;
      reviewHeader.appendChild(name);

      const date = document.createElement('h3');
      date.innerHTML = review.date;
      reviewHeader.appendChild(date);

      const rating = document.createElement('p');
      rating.innerHTML = `Rating: ${review.rating}`;
      rating.className = 'review-rating';
      reviewArticle.appendChild(rating);

      const comments = document.createElement('p');
      comments.innerHTML = review.comments;
      reviewArticle.appendChild(comments);

      return reviewArticle;
    }

/**
 * Add restaurant name to the breadcrumb navigation menu
 */
let fillBreadcrumb = (restaurant = self.restaurant) => {
      const breadcrumb = document.getElementById('breadcrumb');
      const li = document.createElement('li');
      li.innerHTML = restaurant.name;
      breadcrumb.appendChild(li);
    }

/**
 * Get a parameter by name from page URL.
 */
let getParameterByName = (name, url) => {
      if (!url)
        url = window.location.href;
      name = name.replace(/[\[\]]/g, '\\$&');
      const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
        results = regex.exec(url);
      if (!results)
        return null;
      if (!results[2])
        return '';
      return decodeURIComponent(results[2].replace(/\+/g, ' '));
    }
