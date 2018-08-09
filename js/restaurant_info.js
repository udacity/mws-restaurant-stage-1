let restaurant;
var map;

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
 * Fetch all resturant reviews form server . 
 */
featchRestuarantReviews = (id) => { 
  DBHelper.featchRestuarantReviews(id).then(reviews =>{ 
    console.log(reviews);
    fillReviewsHTML(reviews);
  });
}

/**
 * Create restaurant HTML and add it to the webpage
 */
fillRestaurantHTML = (restaurant = self.restaurant) => {
  const name = document.getElementById('restaurant-name');
  name.innerHTML = restaurant.name;

  const address = document.getElementById('restaurant-address');
  address.innerHTML = restaurant.address;

  const sourceSmall = document.getElementById('source-small');
  const sourceLarge = document.getElementById('source-larg');
  const image = document.getElementById('restaurant-img');
  sourceSmall.setAttribute('media', '(max-width:470px)');
  sourceLarge.setAttribute('media', '(min-width:471px)');
  image.setAttribute('alt', `image from ${restaurant.name} restaurant`);
  image.setAttribute('tabindex', '0');

  sourceSmall.setAttribute('srcset', DBHelper.imgSetUrlForRestaurantSmall(restaurant));
  sourceLarge.setAttribute('srcset', DBHelper.imgSetUrlForRestaurantLarg(restaurant));

  image.className = 'restaurant-img'
  image.src = DBHelper.imageUrlForRestaurant(restaurant);
  

  const cuisine = document.getElementById('restaurant-cuisine');
  cuisine.innerHTML = restaurant.cuisine_type;

  // fill operating hours
  if (restaurant.operating_hours) {
    fillRestaurantHoursHTML();
  }

  const restuarantId = getParameterByName('id');
  featchRestuarantReviews(restuarantId)
 
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

/**
 * Create all reviews HTML and add them to the webpage.
 */
fillReviewsHTML = (reviews = self.restaurant.reviews) => {
  const container = document.getElementById('reviews-container');
  if (!container.querySelector('h2')){
    const title = document.createElement('h2');
    title.innerHTML = 'Reviews';
    container.appendChild(title);
  }
 

  
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

  const name = document.createElement('p');
  
  name.innerHTML = review.name;
  li.appendChild(name);

  const date = document.createElement('p');
  date.innerHTML = new Date(review.createdAt).toDateString();
  li.appendChild(date);

  const rating = document.createElement('p');
  rating.innerHTML = `Rating: ${review.rating}`;
  li.appendChild(rating);

  const comments = document.createElement('p');
  comments.innerHTML = review.comments;
  li.appendChild(comments);
  if (!navigator.onLine) {
    li.classList.add("reviews-offline");
    let offlineLable = document.createElement('div')
    offlineLable.innerHTML = "Offline"
    offlineLable.id  = 'offline-lable'
    li.appendChild(offlineLable);

  }
  return li;
}

/**
 * Add restaurant name to the breadcrumb navigation menu
 */
fillBreadcrumb = (restaurant=self.restaurant) => {
  const breadcrumb = document.getElementById('breadcrumb');
  const li = document.createElement('li');
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

/**
 * Adding Review . 
 */

addReview = () => { 
  // event.preventDefault();
  
  const restaurantId = getParameterByName('id');
  const name = document.getElementById('review-author').value;
  const rating = document.querySelector('#review-rating option:checked').value;
  const comments = document.getElementById('review-commnets').value;
  
  const review = {
    "restaurant_id": restaurantId,
    "name": name,
    "rating": rating,
    "comments": comments,
    "createdAt" : new Date()
  }

  DBHelper.addReview(review).then(()=>{
    const ul = document.getElementById('reviews-list');
    ul.appendChild(createReviewHTML(review));
  }).catch((offlineReview)=>{ 
    console.log(offlineReview);
    const ul = document.getElementById('reviews-list');
    ul.appendChild(createReviewHTML(offlineReview.data));
  })
  document.getElementById('restaurant-review').reset();
}
