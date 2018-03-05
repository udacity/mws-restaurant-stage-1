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
      google.maps.event.addListenerOnce(self.map, 'tilesloaded', MapReady);
      fillBreadcrumb();
      DBHelper.mapMarkerForRestaurant(self.restaurant, self.map);

    }
  });
}
function MapReady(){
  /*
  When map is loaded, focus on the restaurant name element for screen reader
  */
  document.getElementById('restaurant-name').focus();
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
  name.innerHTML = restaurant.name;
  name.setAttribute('aria-label',`${restaurant.name}, ${restaurant.cuisine_type} cuisine`)

  const image = document.getElementById('restaurant-img');
  image.className = 'restaurant-img'
  image.alt=`${restaurant.name} ${restaurant.cuisine_type} Cuisine`;
  image.src = DBHelper.imageUrlForRestaurant(restaurant);


  const address = document.getElementById('restaurant-address');
  address.innerHTML = restaurant.address;
  address.setAttribute('aria-label',`address ${restaurant.address}`);

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
fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
  const hours = document.getElementById('restaurant-hours');
  let aa=1;
  for (let key in operatingHours) {
    const row = document.createElement('tr');

    const day = document.createElement('td');
    day.innerHTML = key;
    day.setAttribute('tabindex',0);
    day.setAttribute('aria-label',`${key} : ${operatingHours[key]}`);
    aa++;
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
  const title = document.createElement('h3');
  title.innerHTML = 'Reviews';
  title.setAttribute('aria-label',`${reviews.length} reviews`);
  title.setAttribute('tabindex',0);
  container.appendChild(title);

  if (!reviews) {
    const noReviews = document.createElement('p');
    noReviews.innerHTML = 'No reviews yet!';
    container.appendChild(noReviews);
    return;
  }
  const ul = document.getElementById('reviews-list');
  let aa=1;
  reviews.forEach(review => {
    ul.appendChild(createReviewHTML(review,aa));
    aa++;
  });
  container.appendChild(ul);

}

/**
 * Create review HTML and add it to the webpage.
 */
createReviewHTML = (review,aa) => {
  const li = document.createElement('li');
  li.setAttribute('tabindex',0);
  li.setAttribute('aria-label', `Review ${aa}`);
  const div = document.createElement('div');
  div.className='review-inner';

  const name = document.createElement('h4');
  name.className='review-reviewer';
  name.setAttribute('tabindex',0);
  name.setAttribute('aria-label',`reviewer name ${review.name} date ${review.date}`);
  name.innerHTML = review.name;


  const date = document.createElement('p');
  date.className='review-date';
  date.innerHTML = review.date;

  const tbl = document.createElement("table");
  tbl.setAttribute('width','100%');
  const tblBody = document.createElement("tbody");
  const row = document.createElement("tr");
  const cell1 = document.createElement("td");
  const cell2 = document.createElement("td");
  cell1.setAttribute('align','left');
  cell1.appendChild(name);
  cell2.setAttribute('align','right');
  cell2.appendChild(date);
  row.appendChild(cell1);
  row.appendChild(cell2);

  tblBody.appendChild(row);
  tbl.appendChild(tblBody);
  li.appendChild(tbl);


  const rating = document.createElement('p');
  rating.className='review-rating';
  rating.setAttribute('aria-label',`review rating ${review.rating}`);
  rating.innerHTML = `Rating: ${review.rating}`;
  rating.setAttribute('tabindex',0);
  div.appendChild(rating);

  const comments = document.createElement('p');
  comments.setAttribute('aria-label',`review, ${review.comments}`);
  comments.innerHTML = review.comments;
  comments.setAttribute('tabindex',0);
  div.appendChild(comments);
li.appendChild(div);
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
