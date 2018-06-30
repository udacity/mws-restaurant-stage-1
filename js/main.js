let restaurants,
  neighborhoods,
  cuisines
  firstload = true;
var map
var markers = []

/**
 * Fetch neighborhoods and cuisines as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {
  fetchNeighborhoods();
  fetchCuisines();
  DBHelper.registerServiceWorker();
});

/**
 * Enables lazy loading of images when content is loaded
 */
window.addEventListener('load', (event) => {
  DBHelper.lazyLoadImages();
});

/**
 * Fetch all neighborhoods and set their HTML.
 */
fetchNeighborhoods = () => {
  DBHelper.fetchNeighborhoods((error, neighborhoods) => {
    if (error) { // Got an error
      console.error(error);
    } else {
      self.neighborhoods = neighborhoods;
      fillNeighborhoodsHTML();
    }
  });
}

/**
 * Set neighborhoods HTML.
 */
fillNeighborhoodsHTML = (neighborhoods = self.neighborhoods) => {
  const select = document.getElementById('neighborhoods-select');
  neighborhoods.forEach(neighborhood => {
    const option = document.createElement('option');
    option.innerHTML = neighborhood;
    option.value = neighborhood;
    select.append(option);
  });
}

/**
 * Fetch all cuisines and set their HTML.
 */
fetchCuisines = () => {
  DBHelper.fetchCuisines((error, cuisines) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.cuisines = cuisines;
      fillCuisinesHTML();
    }
  });
}

/**
 * Set cuisines HTML.
 */
fillCuisinesHTML = (cuisines = self.cuisines) => {
  const select = document.getElementById('cuisines-select');

  cuisines.forEach(cuisine => {
    const option = document.createElement('option');
    option.innerHTML = cuisine;
    option.value = cuisine;
    select.append(option);
  });
}

/**
 * Initialize Google map, called from HTML.
 */
window.initMap = () => {
  let loc = {
    lat: 40.722216,
    lng: -73.987501
  };
  try {
	  
	  self.map = new google.maps.Map(document.getElementById('map'), {
		zoom: 12,
		center: loc,
		scrollwheel: false
	  });

  } catch(error) {
	  console.log('Load google map failed');
  } 
    
  updateRestaurants();
}

/**
 * Update page and map for current restaurants.
 */
updateRestaurants = () => {
  const cSelect = document.getElementById('cuisines-select');
  const nSelect = document.getElementById('neighborhoods-select');

  const cIndex = cSelect.selectedIndex;
  const nIndex = nSelect.selectedIndex;

  const cuisine = cSelect[cIndex].value;
  const neighborhood = nSelect[nIndex].value;

  DBHelper.fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, (error, restaurants) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      resetRestaurants(restaurants);
      fillRestaurantsHTML(self.restaurants, () => {DBHelper.lazyLoadImages()});
    }
  })
}

/**
 * Clear current restaurants, their HTML and remove their map markers.
 */
resetRestaurants = (restaurants) => {
  // Remove all restaurants
  self.restaurants = [];
  const ul = document.getElementById('restaurants-list');
  ul.innerHTML = '';

  // Remove all map markers
  self.markers.forEach(m => m.setMap(null));
  self.markers = [];
  self.restaurants = restaurants;
}

/**
 * Create all restaurants HTML and add them to the webpage.
 */
fillRestaurantsHTML = (restaurants = self.restaurants, callback) => {
  const ul = document.getElementById('restaurants-list');
  restaurants.forEach(restaurant => {
    ul.append(createRestaurantHTML(restaurant));
  });
  addMarkersToMap();
  
  if(!firstload){
    callback();
  }

  firstload = false;
}

/**
 * Create restaurant HTML.
 */
createRestaurantHTML = (restaurant) => {

  const li = document.createElement('li');
  
  const figure = document.createElement('figure');
  li.appendChild(figure);

  // Create responsive image

  let picture = document.createElement('picture');
  picture.className = 'restaurant-img lazy-loading';

  if(DBHelper.imageUrlForRestaurant(restaurant)){

    const image_prefix = DBHelper.imageUrlForRestaurant(restaurant).replace('.jpg','');

    let source = document.createElement('source');
    source.srcset = '/icons/loading.gif';
    source.setAttribute('data-srcset', `${image_prefix}-400_small_1x.jpg 1x,${image_prefix}-400_small_2x.jpg 2x`);
    source.media = "(max-width: 400px)";
    picture.appendChild(source);
    
    source = document.createElement('source');
    source.srcset = '/icons/loading.gif';
    source.setAttribute('data-srcset', `${image_prefix}-400_small_1x.jpg 1x,${image_prefix}-400_small_2x.jpg 2x`);
    source.media = "(min-width: 601px)";
    picture.appendChild(source);
    
    source = document.createElement('source');
    source.srcset = '/icons/loading.gif';
    source.setAttribute('data-srcset', `${image_prefix}-800_large_1x.jpg 1x,${image_prefix}-800_large_2x.jpg 2x`);
    source.media = "(max-width: 600px) and (min-width: 401px)";
    picture.appendChild(source);
   
    const image = document.createElement('img');
    image.alt = `${restaurant.name} Restaurant`;
    image.src = '/icons/loading.gif';
    image.setAttribute('data-src', `${image_prefix}-400_small_1x.jpg`);
    picture.appendChild(image);
  
  } else {

     picture = document.createElement('p');
     picture.className = 'restaurant-img-not-available';
     picture.innerHTML = 'Image not Available';
  }
  
  figure.appendChild(picture);
 
  const summary = document.createElement('figcaption');
  summary.className = 'restaurant-summary';
  figure.append(summary);

  const name = document.createElement('h2');
  name.innerHTML = restaurant.name;
  summary.append(name);

  const neighborhood = document.createElement('p');
  neighborhood.innerHTML = restaurant.neighborhood;
  summary.append(neighborhood);

  const address = document.createElement('p');
  address.innerHTML = restaurant.address;
  summary.append(address);

  const more = document.createElement('a');
  more.innerHTML = 'View Details';
  more.setAttribute('aria-label',`View details for ${restaurant.name} restaurant`);
  more.href = DBHelper.urlForRestaurant(restaurant);
  summary.append(more)

  return li;
}

/**
 * Add markers for current restaurants to the map.
 */
addMarkersToMap = (restaurants = self.restaurants) => {
  restaurants.forEach(restaurant => {
    // Add marker to the map
    const marker = DBHelper.mapMarkerForRestaurant(restaurant, self.map);
    google.maps.event.addListener(marker, 'click', () => {
      window.location.href = marker.url
    });
    self.markers.push(marker);
  });
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
