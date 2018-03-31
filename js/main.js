let restaurants,
  neighborhoods,
  cuisines;
var map;
var markers = [];

// Add an Intersection observer to load only images wich are inside the viewport and its surroundings
// https://w3c.github.io/IntersectionObserver/
var observer = new IntersectionObserver(changes => {
  for (const change of changes) {
    console.log(change.time);               // Timestamp when the change occurred
    console.log(change.rootBounds);         // Unclipped area of root
    console.log(change.boundingClientRect); // target.boundingClientRect()
    console.log(change.intersectionRect);   // boundingClientRect, clipped by its containing block ancestors, and intersected with rootBounds
    console.log(change.intersectionRatio);  // Ratio of intersectionRect area to boundingClientRect area
    console.log(change.target);             // the Element target
  }
}, {});

/**
 * Fetch neighborhoods and cuisines as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {
  fetchNeighborhoods();
  fetchCuisines();
  registerServiceWorker();
  observeImages();
});

/**
 * Observe images position from viewport
 */
observeImages = () => {
  const targets = document.querySelectorAll('.restaurant-img');
  console.log('targets = ', targets);

  // Watch for intersection events on a specific target Element.
  targets.forEach((target) => {
    observer.observe(target);
  });

  // // Stop watching for intersection events on a specific target Element.
  // targets.forEach((target) => {
  //   observer.unobserve(target);
  // });

  // // Stop observing threshold events on all target elements.
  // targets.forEach((target) => {
  //   observer.disconnect();
  // });
}

/**
 * Register ServiceWorker at page load
 */
registerServiceWorker = () => {
  if (!navigator.serviceWorker) return;

  navigator.serviceWorker.register('/service-worker.js')
    .then((reg) => {
      console.log('ServiceWorker successfully registered !');
      if (!navigator.serviceWorker.controller) return;

      if (reg.waiting) {
        console.log('Service worker WAITING..., [updateReady]');
      }

      if (reg.installing) {
        console.log('Service worker INSTALLING..., [trackInstalling]');
      }

      reg.addEventListener('updatefound', () => {
        console.log('Service worker Update Found, [trackInstalling]');
      });
    })
    .catch((e) => {
      console.error('Error registering the service worker', e);
    });
}

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
  self.map = new google.maps.Map(document.getElementById('map'), {
    zoom: 12,
    center: loc,
    scrollwheel: false
  });
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
      fillRestaurantsHTML();
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
fillRestaurantsHTML = (restaurants = self.restaurants) => {
  const ul = document.getElementById('restaurants-list');
  restaurants.forEach(restaurant => {
    ul.append(createRestaurantHTML(restaurant));
  });
  addMarkersToMap();
}

/**
 * Create restaurant HTML.
 */
createRestaurantHTML = (restaurant) => {
  const li = document.createElement('li');

  const image = document.createElement('img');
  image.className = 'restaurant-img';
  image.src = DBHelper.imageUrlForRestaurant(restaurant);
  image.srcset = DBHelper.imageSrcsetUrlsForRestaurant(restaurant);
  image.sizes = DBHelper.imageSizes();
  image.alt = DBHelper.imageAltForRestaurant(restaurant);
  li.append(image);

  const name = document.createElement('h2');
  name.innerHTML = restaurant.name;
  li.append(name);

  const neighborhood = document.createElement('p');
  neighborhood.innerHTML = restaurant.neighborhood;
  li.append(neighborhood);

  const address = document.createElement('p');
  address.innerHTML = restaurant.address;
  li.append(address);

  const more = document.createElement('a');
  more.innerHTML = 'View Details';
  more.href = DBHelper.urlForRestaurant(restaurant);
  li.append(more)

  return li
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
