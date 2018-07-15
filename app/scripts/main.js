let restaurants,
  neighborhoods,
  cuisines
var map
var markers = []

/**
 * Fetch neighborhoods and cuisines as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {
  initialize();
  loadSw();
});

const loadSw = () => {
    if (!navigator.serviceWorker) return;

    navigator.serviceWorker.register('sw.js', {scope: '/'}).then(function() {
      console.log('Registration worked!');
    }).catch(function() {
      console.log('Registration failed!');
    });
}

const initialize = () => {
  DBHelper.fetchRestaurants((error, results) => {
    if (error) {
      console.error(error);
    }
    else{
      fetchNeighborhoods(results);
      fetchCuisines(results);
    }
  });

}
/**
 * Handle neighborhoods
 */
const fetchNeighborhoods = (restaurants) => {
  const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood)
  const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i)
  self.neighborhoods = uniqueNeighborhoods;
  fillNeighborhoodsHTML();
}

/**
 * Set neighborhoods HTML.
 */
const fillNeighborhoodsHTML = (neighborhoods = self.neighborhoods) => {
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
const fetchCuisines = (restaurants) => {
  const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type)
  const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i)  
  self.cuisines = uniqueCuisines;
  fillCuisinesHTML();
}

/**
 * Set cuisines HTML.
 */
const fillCuisinesHTML = (cuisines = self.cuisines) => {
  const select = document.getElementById('cuisines-select');

  cuisines.forEach(cuisine => {
    const option = document.createElement('option');
    option.innerHTML = cuisine;
    option.value = cuisine;
    select.append(option);
  });
}

/**
 * Initialize Google map once when user first clicks on it. Helps improve performance.
 */
const genMap = () => {
  if(!document.querySelectorAll('#map')[0].hasChildNodes()){
    //first add map app from google
    const map = document.createElement('script');
    map.type = 'application/javascript';
    map.src = 'https://maps.googleapis.com/maps/api/js?key=AIzaSyBoE0ChrfjbjaqBZ9Vz-4SWZXgdt7oawOA&libraries=places&callback=initMap';
    document.getElementsByTagName('head')[0].appendChild(map);

    //initiate the map and then populate
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
  }
}



/**
 * Update page and map for current restaurants.
 */
const updateRestaurants = () => {
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
const resetRestaurants = (restaurants) => {
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
const fillRestaurantsHTML = (restaurants = self.restaurants) => {
  const ul = document.getElementById('restaurants-list');
  restaurants.forEach(restaurant => {
    ul.append(createRestaurantHTML(restaurant));
  });
  addMarkersToMap();
}

/**
 * Create restaurant HTML.
 */
const createRestaurantHTML = (restaurant) => {
  const li = document.createElement('li');

  const imgPrefix = DBHelper.imageUrlForRestaurant(restaurant);
  const imgExt = 'jpg';

  const sourceLarge = document.createElement('source');
  sourceLarge.media = '(min-width: 1000px)';
  sourceLarge.srcset = `${imgPrefix}_large_2x.${imgExt} 2x, ${imgPrefix}_large_1x.${imgExt} 1x`;

  const sourceMedium = document.createElement('source');
  sourceMedium.media = '(min-width: 500px)';
  sourceMedium.srcset = `${imgPrefix}_medium_2x.${imgExt} 2x, ${imgPrefix}_medium_1x.${imgExt} 1x`;

  const image = document.createElement('img');
  image.alt = `image of the restaurant ${restaurant.name}`;
  image.className = 'restaurant-img';
  image.src = `${imgPrefix}_small.${imgExt}`;

  const picture = document.createElement('picture');
  picture.appendChild(sourceLarge);
  picture.appendChild(sourceMedium);
  picture.appendChild(image);

  li.append(picture);

  const name = document.createElement('h1');
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
  more.setAttribute('role', 'button');
  more.setAttribute('aria-label', `View Restaurant Details of ${restaurant.name}`);
  more.href = DBHelper.urlForRestaurant(restaurant);
  li.append(more)

  return li
}

/**
 * Add markers for current restaurants to the map.
 */
const addMarkersToMap = (restaurants = self.restaurants) => {
  restaurants.forEach(restaurant => {
    // Add marker to the map
    const marker = DBHelper.mapMarkerForRestaurant(restaurant, self.map);
    google.maps.event.addListener(marker, 'click', () => {
      window.location.href = marker.url
    });
    self.markers.push(marker);
  });
}


