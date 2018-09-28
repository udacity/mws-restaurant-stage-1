let restaurant;
var newMap;

/**
 * Initialize map as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {  
  registerServiceWorker();
  initMap();
});

/**  TODO : Register service worker  **/
registerServiceWorker = () => {
  if (navigator.serviceWorker) {
    navigator.serviceWorker.register('./sw.js')
    .then(() => {
        console.log('Service Worker registered')
    })
    .catch((error) => {
        console.log('Registration Failed', error);
    });
  }    
}

/**
 * Initialize leaflet map
 */
initMap = () => {
  fetchRestaurantFromURL((error, restaurant) => {
    if (error) { // Got an error!
      console.error(error);
    } else {      
      self.newMap = L.map('map', {
        center: [restaurant.latlng.lat, restaurant.latlng.lng],
        zoom: 16,
        scrollWheelZoom: false
      });
      L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.jpg70?access_token={mapboxToken}', {
        mapboxToken: 'pk.eyJ1Ijoib3dsa2luZyIsImEiOiJjamttbTBhcGMwYzF3M290ZGhyc2F4ZW1lIn0.Aasfyld5HSVNGPS-8QaDmg',
        maxZoom: 18,
        attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
          '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
          'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
        id: 'mapbox.streets'    
      }).addTo(newMap);
      fillBreadcrumb();
      DBHelper.mapMarkerForRestaurant(self.restaurant, self.newMap);
    }
  });
}  

/**
 * Get current restaurant from page URL.
 */
fetchRestaurantFromURL = (callback) => {
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
fillRestaurantHTML = (restaurant = self.restaurant) => {
  const name = document.getElementById('restaurant-name');
  name.setAttribute('aria-label', 'Restaurant name: ' + restaurant.name);
  name.innerHTML = restaurant.name;

  const address = document.getElementById('restaurant-address');
  address.setAttribute('aria-label', 'Address: ' + restaurant.address);
  address.innerHTML = restaurant.address;

  const myImage = DBHelper.imageUrlForRestaurant(restaurant);
  
  const source = document.getElementById('source');
  source.media = '(min-width: 367px)';
  source.srcset = myImage.normal + ' 1x,' + myImage.large + '2x';

  const image = document.getElementById('restaurant-img');
  image.className = 'restaurant-img';
  image.src = myImage.small;
  const altText = 'An image of ' + restaurant.name + ' Restaurant';
  image.alt = altText;

  const cuisine = document.getElementById('restaurant-cuisine');
  cuisine.setAttribute('aria-label', 'Cuisine: ' + restaurant.cuisine_type);
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
fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
  const hours = document.getElementById('restaurant-hours');

  for (let key in operatingHours) {
    const row = document.createElement('tr');
    row.setAttribute('tabindex', '0');        // Make table's rows tabbable 
    const day = document.createElement('td');
    //day.setAttribute('tabindex', '0');
    day.innerHTML = key;
    row.appendChild(day);

    const time = document.createElement('td');
    //time.setAttribute('tabindex', '0');
    time.innerHTML = operatingHours[key];
    row.appendChild(time);

    hours.appendChild(row);
  }
}

/**
 * Create all reviews HTML and add them to the webpage.
 */
fillReviewsHTML = (reviews = self.restaurant.reviews) => {
  const container = document.getElementById('reviews-container');
  const rev = document.createElement('div');
  rev.className = "reviews-header"
  
  const title = document.createElement('h2');
  title.innerHTML = 'Reviews';
  rev.appendChild(title);
  container.appendChild(rev);

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
createReviewHTML = (review) => {
  const li = document.createElement('li');
  li.setAttribute('tabindex', '0');
  //li.setAttribute('aria-label', 'Review by: ' + review.name);

  const div1 = document.createElement('div');
  div1.className = "reviews-head";

  const name = document.createElement('h3');
  name.classList.add('author');
  name.setAttribute('aria-label', 'Author: ' + review.name + ".");
  name.innerHTML = review.name;
  div1.appendChild(name);

  const date = document.createElement('p');
  date.classList.add('date');
  date.setAttribute('aria-label', 'Date reviewed: ' + review.date + ".");
  date.innerHTML = review.date;
  div1.appendChild(date);
  li.appendChild(div1);

  const rating = document.createElement('div');
  rating.classList.add('rating');
  rating.setAttribute('aria-label', 'Rating: ' + review.rating + ".");
  rating.innerHTML = `Rating: ${review.rating}`;
  li.appendChild(rating);

  const comments = document.createElement('div');
  comments.classList.add('comment');
  comments.innerHTML = review.comments;
  li.appendChild(comments);

  return li;
}

/**
 * Add restaurant name to the breadcrumb navigation menu
 */
fillBreadcrumb = (restaurant=self.restaurant) => {
  const breadcrumb = document.getElementById('breadcrumb');
  const li = document.createElement('li');
  li.setAttribute('aria-current', 'page');
  li.innerHTML = restaurant.name;
  breadcrumb.appendChild(li);
}

/**
 * Get a parameter by name from page URL.
 */
getParameterByName = (name, url) => {
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