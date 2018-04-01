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
		try {
			
		  self.map = new google.maps.Map(document.getElementById('map'), {
			zoom: 16,
			center: restaurant.latlng,
			scrollwheel: false
		  });
		  
		} catch (error) {
			console.log('Load of google map failed');
		}
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
 * Create restaurant HTML and add it to the webpage
 */
fillRestaurantHTML = (restaurant = self.restaurant) => {
  const name = document.getElementById('restaurant-name');
  name.innerHTML = restaurant.name;

  const address = document.getElementById('restaurant-address');
  address.innerHTML = restaurant.address;
  
  const figure = document.getElementById('restaurant-img');
  
  // Create responsive image
  const picture = document.createElement('picture');
  figure.prepend(picture);
  
  const image_prefix = DBHelper.imageUrlForRestaurant(restaurant).replace('.jpg','');
  
  let source = document.createElement('source');
  source.srcset = `${image_prefix}-800_large_1x.jpg 1x,${image_prefix}-800_large_2x.jpg 2x`;
  source.media = "(min-width: 1400px)";
  picture.appendChild(source);
  
  source = document.createElement('source');
  source.srcset = `${image_prefix}-400_small_1x.jpg 1x,${image_prefix}-400_small_2x.jpg 2x`;
  source.media = "(max-width: 400px)";
  picture.appendChild(source);
  
  source = document.createElement('source');
  source.srcset = `${image_prefix}-400_small_1x.jpg 1x,${image_prefix}-400_small_2x.jpg 2x`;
  source.media = "(min-width: 1000px) and (max-width: 1399px)";
  picture.appendChild(source);
  
  source = document.createElement('source');
  source.srcset = `${image_prefix}-800_large_1x.jpg 1x,${image_prefix}-800_large_2x.jpg 2x`;
  source.media = "(min-width: 401px) and (max-width: 999px)";
  picture.appendChild(source);
 
  const image = document.createElement('img');
  image.alt = `${restaurant.name} Restaurant Image`;
  image.src = `${image_prefix}-400_small_1x.jpg`;
  picture.appendChild(image);

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
}

/**
 * Create review HTML and add it to the webpage.
 */
createReviewHTML = (review) => {
  const li = document.createElement('li');
  
  const article = document.createElement('article');
  li.appendChild(article);
  
  const title = document.createElement('header');
  title.className = 'review-title';
  
  article.appendChild(title);
  
  const name = document.createElement('p');
  name.innerHTML = review.name;
  title.appendChild(name);

  const date = document.createElement('p');
  date.innerHTML = review.date;
  title.appendChild(date);
  
  const clear = document.createElement('div');
  title.appendChild(clear);
  
  const review_div = document.createElement('div');
  review_div.className = 'review-content';
  article.appendChild(review_div);

  const rating = document.createElement('p');
  rating.innerHTML = `Rating: ${review.rating}`;
  rating.className = 'review-rating';
  review_div.appendChild(rating);

  const comments = document.createElement('p');
  comments.innerHTML = review.comments;
  review_div.appendChild(comments);

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
