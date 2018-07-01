var restaurant;
var map;

const photographAlts = {
	1: "People chatting at a full up restaurant.",
	2: "Close-up of a pizza alla pietra.",
	3: "Empty restaurant tables with embedded food heaters.",
	4: "Outside of a restaurant in a corner with bright lights at night.",
	5: "Staff serving food at behind a bar at a restaurant.",
	6: "Crowded restaurant with wooden tables and a US flag painted on a background wall.",
	7: "Two men walking a dog in front of a burguer shop.",
	8: "Outside closeup of the Dutch restaurant logo.",
	9: "Black and white picture of people eating with chopsticks at an asian restaurant.",
	10: "Empty restaurant inside with white chairs, walls and ceilings."
};

/**
 * Initialize Google map, called from HTML.
 */
window.initMap = () => {
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
fetchRestaurantFromURL = callback => {
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
  name.innerHTML = restaurant.name;

  const isFavorite = restaurant.is_favorite ?
    JSON.parse(restaurant.is_favorite) :
    false

  const star = document.querySelector('#star-button');
  const starIcon = document.querySelector('#star-icon');

  starIcon.src = isFavorite ?
    './assets/star-filled.png' :
    './assets/star-empty.png'
  star.addEventListener('click', () => toggleFavorite(restaurant));

  const address = document.getElementById('restaurant-address');
  address.innerHTML = restaurant.address;

  const image = document.getElementById('restaurant-img');
  image.className = 'restaurant-img'
  image.src = DBHelper.imageUrlForRestaurant(restaurant);
  image.alt = photographAlts[restaurant.id];

  const cuisine = document.getElementById('restaurant-cuisine');
  cuisine.innerHTML = restaurant.cuisine_type;

  // fill operating hours
  if (restaurant.operating_hours) {
    fillRestaurantHoursHTML();
  }
  // fill reviews
  DBHelper.getReviewsForRestaurant(restaurant.id, fillReviewsHTML);
}

toggleFavorite = restaurant => {

  const isFavorite = restaurant.is_favorite ?
    JSON.parse(restaurant.is_favorite) :
    false

  isFavorite
    ? removeFromFavorites(restaurant.id)
    : addToFavorites(restaurant.id);
}

addToFavorites = restaurantId => {
  restaurant.is_favorite = true;
  DBHelper.addToFavorites(restaurantId);
  const starIcon = document.querySelector('#star-icon');
  starIcon.src = './assets/star-filled.png';
}

removeFromFavorites = restaurantId => {
  restaurant.is_favorite = false;
  DBHelper.removeFromFavorites(restaurantId);
  const starIcon = document.querySelector('#star-icon');
  starIcon.src = './assets/star-empty.png';
}

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
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
}

appendReview = review => {
  const ul = document.getElementById('reviews-list');
  ul.appendChild(createReviewHTML(review));
}

/**
 * Create all reviews HTML and add them to the webpage.
 */
fillReviewsHTML = (error, reviews) => {
  const container = document.getElementById('reviews-container');
  const title = document.createElement('h3');
  title.innerHTML = 'Reviews';
  title.tabIndex = '0';
  container.appendChild(title);

  if (error || reviews.length === 0) {
    const noReviews = document.createElement('p');
    noReviews.classList.add('no-reviews')
    noReviews.innerHTML = 'No reviews yet!';
    container.appendChild(noReviews);
    return;
  }
  const ul = document.getElementById('reviews-list');
  reviews.forEach(appendReview);
  container.appendChild(ul);
}

/**
 * Create review HTML and add it to the webpage.
 */
createReviewHTML = (review) => {
  const li = document.createElement('li');
  li.classList.add('review-card');
  li.tabIndex = '0';

  const name = document.createElement('p');
  name.innerHTML = review.name;
  name.classList.add('review-name');
  li.appendChild(name);

  const date = document.createElement('p');
  date.innerHTML = formatTime(review.updatedAt);
  date.classList.add('review-date');
  li.appendChild(date);

  const rating = document.createElement('p');
  rating.innerHTML = `Rating: ${review.rating}`;
  rating.classList.add('review-rating');
  li.appendChild(rating);

  const comments = document.createElement('p');
  comments.innerHTML = review.comments;
  comments.classList.add('review-comments');
  li.appendChild(comments);

  return li;
}

formatTime = time => {
  const date = new Date(time);
  const day = date.getDate();
  const month = date.getMonth() + 1;
  const year = date.getFullYear();

  return `${day}/${month}/${year}`;
}

/**
 * Add restaurant name to the breadcrumb navigation menu
 */
fillBreadcrumb = (restaurant = self.restaurant) => {
  const breadcrumb = document.getElementById('breadcrumb');
  const breadcrumbElements = breadcrumb.querySelectorAll('li');

  for (element of breadcrumbElements) {
    element.removeAttribute('aria-current');
  }

  const li = document.createElement('li');
  li.innerHTML = restaurant.name;
  li.setAttribute('aria-current', 'page');
  breadcrumb.appendChild(li);
}

/**
 * Get a parameter by name from page URL.
 */
getParameterByName = (name, url = window.location.href) => {
  name = name.replace(/[\[\]]/g, '\\$&');
  const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
    results = regex.exec(url);
  if (!results)
    return null;
  if (!results[2])
    return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
}

addReviewFormListener = () => {
  const form = document.querySelector('#review-form');
  form.addEventListener('submit', event => {
    event.preventDefault()
    const name = form.querySelector('#reviewer-name')
    const rating = form.querySelector('#review-rating')
    const comments = form.querySelector('#review-comments')

    const review = {
      restaurant_id: getParameterByName('id'),
      name: name.value,
      rating: parseInt(rating.value),
      comments: comments.value
    }

    appendReview({...review, updatedAt: new Date() });
    DBHelper.submitOrSyncReview(review);
    DBHelper.saveSingleReviewForRestaurant(review);

    name.value = ''
    rating.value = 1
    comments.value = ''
  })
}

addReviewFormListener();
