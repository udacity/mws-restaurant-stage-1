let restaurants,
  neighborhoods,
  cuisines
  firstload = true;
var map
var markers = []

window.addEventListener("scroll", () => {
  jsHelper.lazyLoadImages();
  jsHelper.lazyLoadMap();
});

window.addEventListener('load', function() {
    
  if (!navigator.serviceWorker) return;

  navigator.serviceWorker.register('/sw.js', { scope: '/' })
  .then(() =>{
    console.log('Registration successfull');
  })
  .catch(() => {console.log('SW Registration failed');});

});

/**
 * Fetch neighborhoods and cuisines as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {
  fetchNeighborhoods();
  fetchCuisines();
});

/**
 * Fetch all neighborhoods and set their HTML.
 */
fetchNeighborhoods = () => {
  DBHelper.fetchNeighborhoods((error, neighborhoods) => {
    if (error) { // Got an error
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
      fillRestaurantsHTML(self.restaurants);
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

  jsHelper.lazyLoadImages();
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
    source.setAttribute('data-srcset', `${image_prefix}-400_small_1x.jpg 1x,${image_prefix}-400_small_2x.jpg 2x`);
    source.media = "(max-width: 400px)";
    picture.appendChild(source);
    
    source = document.createElement('source');
    source.setAttribute('data-srcset', `${image_prefix}-400_small_1x.jpg 1x,${image_prefix}-400_small_2x.jpg 2x`);
    source.media = "(min-width: 601px)";
    picture.appendChild(source);
    
    source = document.createElement('source');
    source.setAttribute('data-srcset', `${image_prefix}-800_large_1x.jpg 1x,${image_prefix}-800_large_2x.jpg 2x`);
    source.media = "(max-width: 600px) and (min-width: 401px)";
    picture.appendChild(source);
   
    const image = document.createElement('img');
    image.alt = `${restaurant.name} Restaurant`;
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
