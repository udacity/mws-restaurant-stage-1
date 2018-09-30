let restaurants,
  neighborhoods,
  cuisines
var newMap
var markers = []

/**
 * Fetch neighborhoods and cuisines as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {
    saveRestaurants().then(() => {
      initMap(); // added 
      readNeighborhoods();
      readCuisine();
      DBHelper.sendWaitingReviews();
      DBHelper.sendWaitingFavorites();

  });
});

/**
 * Fetch all neighborhoods and set their HTML.
 */
readNeighborhoods = () => {
  DBHelper.readNeighborhoods((error, neighborhoods) => {
    if (error) { // Got an error
      // console.log('error in main-fetch nieghborhoods',error);
    } else {
      self.neighborhoods = neighborhoods;
      fillNeighborhoodsHTML();
    }
  });
}

/*
  retrieve data from server then Save restaurants to IDB
*/
saveRestaurants = () => {
  return DBHelper.SaveRestaurants();
}

/**
 * Set neighborhoods HTML.
 */
fillNeighborhoodsHTML = (neighborhoods = self.neighborhoods) => {
  const select = document.getElementById('neighborhoods-select');
  // console.log('filling neighborhoods');
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
readCuisine = () => {
  DBHelper.readCuisine((error, cuisines) => {
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
 * Initialize leaflet map, called from HTML.
 */
initMap = () => {
  self.newMap = L.map('map', {
        center: [40.722216, -73.987501],
        zoom: 12,
        scrollWheelZoom: false
      });
  L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.jpg70?access_token={mapboxToken}', {
    mapboxToken: 'pk.eyJ1IjoiYXRsYW50YWRhbmNlciIsImEiOiJjamp4Ymc4Y3AwOWg1M2tyd2w5aDZmeW44In0.q5P7OpWfkHQApPcTxv8ZcA',
    maxZoom: 18,
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
      '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
      'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
    id: 'mapbox.streets'
  }).addTo(newMap);

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

  DBHelper.readRestaurauntsByCuisineAndNeighborhood(cuisine, neighborhood, (error, restaurants) => {
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
  if (self.markers) {
    self.markers.forEach(marker => marker.remove());
  }
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
  // const favDiv = document.createElement('div');
  // favDiv.id='favoritetext';
  // const fav = document.createElement('checkbox');

  // fav.id='restaurantFavorite' + restaurant.id;
  // fav.checked=restaurant.isFavorite;
  // // fav.href = '#restaurantFavorite' + restaurant.id;
  // // const favimage = document.createElement('img');
  // favimage.className = 'favorite-img';
  

  // createFavoriteHTML(restaurant, fav, favimage);
  // fav.append(favimage);
  // favDiv.append(fav);
  // // favDiv.append(favimage);
  // li.append(favDiv);

  const image = document.createElement('img');
  image.className = 'restaurant-img';
  image.src = DBHelper.imageUrlForRestaurant(restaurant);
  image.srcset=DBHelper.imageUrlForRestaurantSrcset(restaurant);
  // add accessibility alt text identify restaurant shown 
  image.alt = restaurant.name;
  li.append(image);

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
  more.href = DBHelper.urlForRestaurant(restaurant);
  more.setAttribute("aria-label","For " + restaurant.name);
  li.append(more)

  return li
}

/**
 * Add markers for current restaurants to the map.
 */
addMarkersToMap = (restaurants = self.restaurants) => {
  restaurants.forEach(restaurant => {
    // Add marker to the map
    const marker = DBHelper.mapMarkerForRestaurant(restaurant, self.newMap);
    marker.on("click", onClick);
    function onClick() {
      window.location.href = marker.options.url;
    }
    self.markers.push(marker);
  });

} 

function updateFavorite(id,isFavorite){
    //update favorite status in indexedDB, update updated time, update link
}

function createFavoriteHTML(restaurant, fav, favimage, isFavorite) {
  if (isFavorite) {
    fav.innerHTML = 'Remove from Favorites';
    favimage.src = '/img/normal-heart.svg';
    fav.setAttribute("aria-label", "remove " + restaurant.name + "from favorites");
    fav.onclick = updateFavorite(restaurant.id, false);
  }
  else {
    fav.innerHTML = 'Add to Favorites';
    favimage.src = '/img/normal-heart.svg';
    fav.href = DBHelper.urlForRestaurant(restaurant);
    fav.setAttribute('aria-label', 'add ' + restaurant.name + 'to favorites');
    fav.onclick = updateFavorite(restaurant.id, true);
  }
}

