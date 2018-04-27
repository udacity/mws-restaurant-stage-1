let restaurants
var map
var markers = []

/**
 * Fetch neighborhoods and cuisines as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {
  DBHelper.initServiceWorker();
  init();
});

init = async () => {

    response = await APIHelper.fetchRestaurants();
    restaurants = await response.json();

    const restaurantsPromises = [];
    const neighborhoods = new Set();
    const cuisines = new Set();

    restaurants.forEach(restaurant => {
        neighborhoods.add(restaurant.neighborhood);
        cuisines.add(restaurant.cuisine_type);
        restaurantsPromises.push(DBHelper.add(restaurant));
    });
    fillNeighborhoodsHTML(neighborhoods);
    fillCuisinesHTML(cuisines);

    Promise.all(restaurantsPromises)
        .then(() => {
            updateRestaurants()
    })
    .catch(error => {
        console.log(error)
    });
}


/**
 * Fetch all neighborhoods and set their HTML.
 */
/*
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
*/

/**
 * Set neighborhoods HTML.
 */
fillNeighborhoodsHTML = (neighborhoods = self.neighborhoods) => {
  const select = document.getElementById('neighborhoods-select');
  neighborhoods.forEach(neighborhood => {
    const option = document.createElement('option');
    option.innerHTML = neighborhood;
    option.value = neighborhood;
    option.tabIndex = 0;
    select.append(option);
  });
}

/**
 * Fetch all cuisines and set their HTML.
 */
/*
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
*/

/**
 * Set cuisines HTML.
 */
fillCuisinesHTML = (cuisines = self.cuisines) => {
  const select = document.getElementById('cuisines-select');

  cuisines.forEach(cuisine => {
    const option = document.createElement('option');
    option.innerHTML = cuisine;
    option.value = cuisine;
    option.tabIndex = 0;
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

  APIHelper.fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood)
      .then(restaurants => {
        resetRestaurants(restaurants);
      fillRestaurantsHTML(restaurants);
  })
  .catch(error => console.error(error));

/*
  DBHelper.fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, (error, restaurants) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      resetRestaurants(restaurants);
      fillRestaurantsHTML();
    }
  })
*/

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
  /*
  const template = `
  <li>
    <picture>
      <source srcset="img/${restaurant.id}.jpg" type="image/png">
      <img class="restaurant-img" type="image/png" alt='Picture of the restaurant at ${restaurant.name}' src="img/${restaurant.id}.png" /> 
    </picture>
    <div class="restaurant-infos">
      <h2 tabIndex="0">${restaurant.name}</h2>
      <p tabIndex="0"> ${restaurant.neighborhood} </p>
      <p tabIndex="0"> ${restaurant.address} </p>
      <a href="./restaurant.html?id=${restaurant.id}">View Details</a>
    </div>
  </li>
  `;
  */

  const template = `
  <li>
  <picture>
    <source srcset="img/${restaurant.id}.webp" type="image/webp">
    <img class="restaurant-img" src="img/${restaurant.id}.png" type="image/png" alt="Picture of the restaurant ${restaurant.name}">
  </picture>
    <div class="restaurant-infos">
      <h1 tabindex="0">${restaurant.name}</h1>
      <p>${restaurant.neighborhood}</p>
      <p>${restaurant.address}</p>
      <a href="./restaurant.html?id=${restaurant.id}">View Details</a>
    </div>
  </li>
  `;

  const range = document.createRange();
  const fragment = range.createContextualFragment(template);

  return fragment;

}

/**
 * Add markers for current restaurants to the map.
 */
addMarkersToMap = (restaurants = self.restaurants) => {

  if(typeof google === "undefined") return self.markers;

  restaurants.forEach(restaurant => {
    // Add marker to the map
    const marker = DBHelper.mapMarkerForRestaurant(restaurant, self.map);
    google.maps.event.addListener(marker, 'click', () => {
      window.location.href = marker.url
    });
    self.markers.push(marker);
  });
}
