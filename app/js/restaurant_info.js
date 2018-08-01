let restaurant;
var map;

/**
 * Registering Service worker
 */
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js', { scope: '/' })
  .then((reg) => {
    console.log('ServiceWorker Registration successful. Scope is ' + reg.scope);
  }).catch((error) => {
    console.log('ServiceWorker Registration failed with ' + error);
  });
}
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
};

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
     const error = 'No restaurant id in URL'
    callback(error, null);
  } else {
    DBHelper.fetchRestaurantById(id, (error, restaurant) => {
      self.restaurant = restaurant;
      if (!restaurant) {
        console.error(error);
        return;
      }
    });
    DBHelper.fetchReviewsByRestId(id, (error, reviews) => {
      self.reviews = reviews;
      if (!reviews) {
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
const fillRestaurantHTML = (restaurant = self.restaurant) => {
  const name = document.getElementById('restaurant-name');
  name.innerHTML = restaurant.name;
  const address = document.getElementById('restaurant-address');
  address.innerHTML = restaurant.address;
  address.setAttribute('aria-label', `Address ${restaurant.address}`);

  const image = document.getElementById('restaurant-img');
  image.className = 'restaurant-img'
  image.src = DBHelper.imageUrlForRestaurant(restaurant);
  image.srcset = DBHelper.imageSrcsetForRestaurant(restaurant);
  image.sizes = '(max-width: 889px) 90vw, 45vw';
  image.alt = `${restaurant.name} ${restaurant.cuisine_type} Restaurant`;
  
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
const fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
  const hours = document.getElementById('restaurant-hours');
  for (let key in operatingHours) {
    const row = document.createElement('tr');

    const day = document.createElement('td');
    day.innerHTML = key;
    day.tabIndex = 0;
    row.appendChild(day);

    const time = document.createElement('td');
    time.innerHTML = operatingHours[key];
    const timeHtml = operatingHours[key];
    const labelString = timeHtml.replace(/-/g, 'to').replace(/,/g, ' and');
    time.tabIndex = 0;
    if (time.innerHTML == 'Closed') {
      time.setAttribute('aria-label', `${labelString}`);
    } else {
      time.setAttribute('aria-label', `From ${labelString}`);
    }
    row.appendChild(time);
    hours.appendChild(row);
  }
};

/**
 * Create all reviews HTML and add them to the webpage.
 */
const fillReviewsHTML = (reviews = self.reviews) => {
  const container = document.getElementById('reviews-container');

  if (!reviews) {
    const noReviews = document.createElement('p');
    noReviews.innerHTML = 'No reviews yet!';
    noReviews.tabIndex = 0 ;
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
const createReviewHTML = (review) => {
  const li = document.createElement('li');
  const name = document.createElement('p');
  const nameContainer = document.createElement('div');  /*created a div for head comtainer*/
  li.id = 'review-item';
  name.innerHTML = review.name;
  name.tabIndex = 0;
  name.setAttribute('aria-label', `reviewer name : ${review.name} `)
  li.appendChild(nameContainer);  /*div is child of review li*/ 
  nameContainer.appendChild(name); /* name now child of the div*/
  name.classList.add('review-name');  /* added class for reviewer  name  */

  const date = document.createElement('time'); /*added semantic meaning to date using time tag*/
  const createDate = new Date(review.createdAt);
  const dateToString = createDate.toDateString();
  date.innerHTML = dateToString;
  date.tabIndex = 0;
  nameContainer.appendChild(date); /* added date as child of div */
  
  const rating = document.createElement('p');
  rating.innerHTML = `Rating: ${review.rating}`;
  rating.tabIndex = 0;
  li.appendChild(rating);
  rating.classList.add('review-rating');  /* added class for reviewer rating */

  const comments = document.createElement('p');
  comments.innerHTML = review.comments;
  comments.tabIndex = 0 ;
  li.appendChild(comments);
  const offlineText = document.createElement('p');
  offlineText.id = 'offlineText';
  offlineText.innerHTML = 'Offline';
    if (!navigator.onLine) {
       li.classList.add('offline-style');
       li.appendChild(offlineText);
    } 
  return li;
};
window.addEventListener('online' , (event) => {
  const li = document.querySelectorAll('#review-item');
  const offlineLabel = document.getElementById('offlineText');
  [...li].forEach(el => {
  if (el.classList.contains('offline-style')) {
    el.classList.remove('offline-style');
    el.removeChild(offlineLabel);
  }
})
});

/**
 * Add restaurant name to the breadcrumb navigation menu
 */
const fillBreadcrumb = (restaurant=self.restaurant) => {
  const breadcrumb = document.getElementById('breadcrumb');
  const li = document.createElement('li');
  const a = document.createElement('a');
  a.innerHTML = restaurant.name;
  a.setAttribute('aria-current', 'page');
  a.href = DBHelper.urlForRestaurant(restaurant);
  li.appendChild(a);
  breadcrumb.appendChild(li);
};

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
};

const addReview = () => {
  event.preventDefault();
  let id = getParameterByName('id');
  let name = document.getElementById('username').value;
  let rating = document.querySelector('#rating-select option:checked').value;
  let comments = document.getElementById('comments').value;

  let nameValidate = /^[a-zA-Z]*$/;
  let nameResult = nameValidate.test(name);
  let commentValidate = /^[a-zA-Z0-9]*$/;
  let commentResult = commentValidate.test(comments);

  if (nameResult == false){
    let nameAlert = document.getElementById('alert-name');
    nameAlert.innerHTML = '✘ Please Enter a valid name !';
    nameAlert.classList.add('alert-style');
    return false;
  } else {
    let nameAlert = document.getElementById('alert-name');
    nameAlert.innerHTML = '';
    nameAlert.classList.remove('alert-style');
  }
  if (commentResult == false) {
    let commentAlert = document.getElementById('alert-comment');
    commentAlert.innerHTML = '✘ Please Enter a valid comment ! ';
    commentAlert.classList.add('alert-style');
    return false;
  } else {
    let commentAlert = document.getElementById('alert-comment');
    commentAlert.innerHTML = '';
    commentAlert.classList.remove('alert-style');
  }

  const reviewData = {
    restaurant_id: parseInt(id),
    name : name,
    rating: parseInt(rating),
    comments : comments,
    createdAt : new Date()
  };

  DBHelper.postReview(reviewData);
  const ul = document.getElementById('reviews-list');
  ul.insertBefore(createReviewHTML(reviewData), ul.childNodes[0]);
  document.getElementById('review-form').reset();
  return true;
}