let restaurant;
var map;

/**
 * Register service worker as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {
  DBHelper.registerServiceWorker();
});

/**
 * Enables lazy loading of images when content is loaded
 */
window.addEventListener('load', (event) => {
  DBHelper.lazyLoadImages();  
});

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

  if(DBHelper.imageUrlForRestaurant(restaurant)) {

    let picture = document.createElement('picture');
    picture.className = 'restaurant-img-available lazy-loading';
    figure.prepend(picture);
    
    const image_prefix = DBHelper.imageUrlForRestaurant(restaurant).replace('.jpg','');
    
    let source = document.createElement('source');
    source.srcset = '/icons/loading.gif';
    source.setAttribute('data-srcset', `${image_prefix}-800_large_1x.jpg 1x,${image_prefix}-800_large_2x.jpg 2x`);
    source.media = "(min-width: 1400px)";
    picture.appendChild(source);
    
    source = document.createElement('source');
    source.srcset = '/icons/loading.gif';
    source.setAttribute('data-srcset', `${image_prefix}-400_small_1x.jpg 1x,${image_prefix}-400_small_2x.jpg 2x`);
    source.media = "(max-width: 400px)";
    picture.appendChild(source);
    
    source = document.createElement('source');
    source.srcset = '/icons/loading.gif';
    source.setAttribute('data-srcset', `${image_prefix}-400_small_1x.jpg 1x,${image_prefix}-400_small_2x.jpg 2x`);
    source.media = "(min-width: 1000px) and (max-width: 1399px)";
    picture.appendChild(source);
    
    source = document.createElement('source');
    source.srcset = '/icons/loading.gif';
    source.setAttribute('data-srcset', `${image_prefix}-800_large_1x.jpg 1x,${image_prefix}-800_large_2x.jpg 2x`);
    source.media = "(min-width: 401px) and (max-width: 999px)";
    picture.appendChild(source);
   
    const image = document.createElement('img');
    image.alt = `${restaurant.name} Restaurant`;
    image.src = '/icons/loading.gif';
    image.setAttribute('data-src', `${image_prefix}-400_small_1x.jpg`);
    picture.appendChild(image);

  } else { 

    let picture = document.createElement('p');
    picture.className = 'restaurant-img-not-available';
    picture.innerHTML = 'Image not Available';
    figure.prepend(picture);
  }

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

/**
 * Common database helper functions.
 */
class DBHelper {

  /**
   * Database URL.
   * Change this to restaurants.json file location on your server.
   */
  static get DATABASE_URL() {
    const port = 1337 // Change this to your server port
    return `http://localhost:${port}/restaurants`;
  }

  /**
   * Fetch all restaurants.
   */
  static fetchRestaurants(callback) {
    return fetch(DBHelper.DATABASE_URL)
      .then(restaurants => {
        restaurants.json().then(json => {
          callback(null, json);
        })
      })
      .catch(error => {
        console.log(error);
      })
  }

  /**
   * Fetch a restaurant by its ID.
   */
  static fetchRestaurantById(id, callback) {
    // fetch all restaurants with proper error handling.
    return fetch(`${DBHelper.DATABASE_URL}/${id}`)
      .then(restaurant => {
        restaurant.json().then(json => {
          callback(null, json);
        })
      })
      .catch(error => {
        console.log(error);
      })
  }

  /**
   * Fetch restaurants by a cuisine type with proper error handling.
   */
  static fetchRestaurantByCuisine(cuisine, callback) {
    // Fetch all restaurants  with proper error handling
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given cuisine type
        const results = restaurants.filter(r => r.cuisine_type == cuisine);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a neighborhood with proper error handling.
   */
  static fetchRestaurantByNeighborhood(neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given neighborhood
        const results = restaurants.filter(r => r.neighborhood == neighborhood);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */
  static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        let results = restaurants
        if (cuisine != 'all') { // filter by cuisine
          results = results.filter(r => r.cuisine_type == cuisine);
        }
        if (neighborhood != 'all') { // filter by neighborhood
          results = results.filter(r => r.neighborhood == neighborhood);
        }
        callback(null, results);
      }
    });
  }

  /**
   * Fetch all neighborhoods with proper error handling.
   */
  static fetchNeighborhoods(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all neighborhoods from all restaurants
        const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood)
        // Remove duplicates from neighborhoods
        const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i)
        callback(null, uniqueNeighborhoods);
      }
    });
  }

  /**
   * Fetch all cuisines with proper error handling.
   */
  static fetchCuisines(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all cuisines from all restaurants
        const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type)
        // Remove duplicates from cuisines
        const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i)
        callback(null, uniqueCuisines);
      }
    });
  }

  /**
   * Restaurant page URL.
   */
  static urlForRestaurant(restaurant) {
    return (`./restaurant.html?id=${restaurant.id}`);
  }

  /**
   * Restaurant image URL.
   * !!Changed to get the responsive images path!!
   */
  static imageUrlForRestaurant(restaurant) {
    if(restaurant.photograph) {
      return (`/responsive_images/${restaurant.photograph}.jpg`);
    }
  }

  /**
   * Map marker for a restaurant.
   */
  static mapMarkerForRestaurant(restaurant, map) {
    const marker = new google.maps.Marker({
      position: restaurant.latlng,
      title: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant),
      map: map,
      animation: google.maps.Animation.DROP}
    );
    return marker;
  }

  /**
  * Register a service worker if browser has this option
  */
  static registerServiceWorker() {
    
    if (!navigator.serviceWorker) return;
    
    navigator.serviceWorker.register('/sw.js', { scope: '/' })
      .then(() => {console.log('Registration successfull');})
      .catch(() => {console.log('SW Registration failed');});
    
  }

  /**
   * Lazy loads pictures so app can be faster
   */
  static lazyLoadImages() {

    document.requestAnimationFrame();

      var pictures = Array.from(document.getElementsByTagName('picture'));

      pictures.forEach(picture => {

        var sources = Array.from(picture.getElementsByTagName('source'));

        sources.forEach(source => {
          source.setAttribute('srcset', source.getAttribute('data-srcset'));
          source.removeAttribute('data-srcset');
        });

        var images = Array.from(picture.getElementsByTagName('img'));

        images.forEach(img => {
          img.setAttribute('src', img.getAttribute('data-src'));
          img.removeAttribute('data-src');
        });

        picture.classList.remove("lazy-loading");

      });

    }, 200);
  }
}
