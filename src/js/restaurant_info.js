import DBHelper from './dbhelper';
import './register-sw';

let restaurant;
var newMap;

/**
 * Initialize map as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {
  initMap();
});

/**
 * Initialize leaflet map
 */
const initMap = () => {
  fetchRestaurantFromURL((error, restaurant) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      newMap = L.map('map', {
        center: [restaurant.latlng.lat, restaurant.latlng.lng],
        zoom: 16,
        scrollWheelZoom: false
      });
      L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.jpg70?access_token={mapboxToken}', {
        mapboxToken: 'pk.eyJ1Ijoicm9uMDEiLCJhIjoiY2ppamxrcm1lMWc3MzNrbzh5YThqbmVvOSJ9.03-h2rPNOJ3mlYO0KMTCaA',
        maxZoom: 18,
        attribution: 
          'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
          '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
          'Imagery  <a href="https://www.mapbox.com/">Mapbox</a>',
        id: 'mapbox.streets'
      }).addTo(newMap);
      fillBreadcrumb();
      DBHelper.mapMarkerForRestaurant(self.restaurant, newMap);
    }
  });
}

/**
 * Get current restaurant from page URL.
 */
const fetchRestaurantFromURL = (callback) => {
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
      callback(null, restaurant)
    });
  }
}

/**
 * Create restaurant HTML and add it to the webpage
 */
const fillRestaurantHTML = (restaurant = self.restaurant) => {
  const name = document.getElementById('restaurant-name');
  name.innerHTML = restaurant.name;
  name.tabIndex = '0';
  name.style.fontSize = "18pt";

  const address = document.getElementById('restaurant-address');
  address.innerHTML = restaurant.address;
  address.style.fontSize = "24pt";

  const image = document.getElementById('restaurant-img');
  image.className = 'restaurant-img';
  image.alt = restaurant.alt;
  image.src = DBHelper.imageUrlForRestaurant(restaurant);
  image.tabIndex = '0';

  const cuisine = document.getElementById('restaurant-cuisine');
  cuisine.innerHTML = restaurant.cuisine_type;

  // fill operating hours
  if (restaurant.operating_hours) {
    fillRestaurantHoursHTML();
  }
  // fill reviews
  fillReviewsHTML();
}

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
const fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
  const hours = document.getElementById('restaurant-hours');
  for (let key in operatingHours) {
    const row = document.createElement('tr');

    const day = document.createElement('td');
    day.innerHTML = key;
    day.style.fontSize = "20pt";
    row.appendChild(day);

    const time = document.createElement('td');
    time.innerHTML = operatingHours[key];
    time.style.fontSize = "20pt";
    row.appendChild(time);

    hours.appendChild(row);
  }
}

/**
 * Create all reviews HTML and add them to the webpage.
 */
const fillReviewsHTML = (reviews = self.restaurant.reviews) => {
  const container = document.getElementById('reviews-container');
  const title = document.createElement('h2');
  title.innerHTML = 'Reviews';
  /**container.appendChild(title);*/

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
}

/**
 * Create review HTML and add it to the webpage.
 */
const createReviewHTML = (review) => {
  const li = document.createElement('li');
  li.style.borderTopLeftRadius = "35px";
  li.style.borderBottomRightRadius = "35px";

  const name = document.createElement('p');
  name.innerHTML = review.name;
  name.style.fontSize = "20pt";
  li.appendChild(name);

  const date = document.createElement('p');
  date.innerHTML = review.date;
  date.style.fontSize = "20pt";
  date.style.textAlign = "right";
  li.appendChild(date);

  const rating = document.createElement('p');
  rating.innerHTML = `Rating: ${review.rating}`;
  rating.style.fontSize = "22pt";
  rating.style.fontFamily = "Arial";
  rating.style.color = "white";
  rating.style.padding = "10px";
  rating.style.borderTopLeftRadius = "5px";
  rating.style.borderTopRightRadius = "5px";
  rating.style.borderBottomLeftRadius = "5px";
  rating.style.borderBottomRightRadius = "5px";
  rating.style.backgroundColor = "orange";
  li.appendChild(rating);

  const comments = document.createElement('p');
  comments.innerHTML = review.comments;
  comments.style.fontSize = "18pt";
  li.appendChild(comments);

  return li;
}

/**
 * Add restaurant name to the breadcrumb navigation menu
 */
const fillBreadcrumb = (restaurant=self.restaurant) => {
  const breadcrumb = document.getElementById('breadcrumb');
  const li = document.createElement('li');
  li.innerHTML = restaurant.name;
  breadcrumb.appendChild(li);
}

/**
 * Get a parameter by name from page URL.
 */
const getParameterByName = (name, url) => {
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

// bypassing map in keyboard navigation
/*document.querySelector("#home").addEventListener("keydown",function(event){
  if (event.keyCode == 9 && !event.shiftKey) {
    event.preventDefault();
    document.querySelector("#restaurant-name").focus();
  }
})

document.querySelector("#restaurant-name").addEventListener("keydown",function(event){
  if (event.keyCode == 9 && event.shiftKey) {
    event.preventDefault();
    document.querySelector("#home").focus();
  }
})*/

