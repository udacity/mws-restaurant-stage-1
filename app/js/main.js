let restaurants,
  neighborhoods,
  cuisines;
var newMap;
var markers = [];

/**
 * Fetch neighborhoods and cuisines as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {
  //registerServiceWorker();
  initMap(); // added 
  fetchNeighborhoods();
  fetchCuisines();
  DBHelper.postOfflineData();
  //updateRestaurants();
});

/*
window.addEventListener('offline', (e) => { 
  console.log('offline');
  postMessage('offline');
});
*/

/** Resend offline posts when connection is established **/
window.addEventListener('online', (e) => { 
  console.log('online');
  //postMessage('online');
  DBHelper.postOfflineData();
});

//if (navigator.onLine) {
  //postMessage('online');
  //console.log('online');
//} //else {
  //postMessage('offline');
  //console.log('offline');
//}

/*window.addEventListener('load', () => {
  initMap();
  //addMarkersToMap();
});*/

/**  TODO : Register service worker  **/
/*const registerServiceWorker = () => {
  if (navigator.serviceWorker) {
    navigator.serviceWorker.register('./sw.js')
    .then(() => {
        console.log('Service Worker registered')
    })
    .catch((error) => {
        console.log('Registration Failed', error);
    });
  }    
}*/

/**
 * Fetch all neighborhoods and set their HTML.
 */
const fetchNeighborhoods = () => {
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
const fillNeighborhoodsHTML = (neighborhoods = self.neighborhoods) => {
  const select = document.getElementById('neighborhoods-select');
  neighborhoods.forEach(neighborhood => {
    const option = document.createElement('option');
    option.innerHTML = neighborhood;
    option.value = neighborhood;
    select.appendChild(option);
  });
}

/**
 * Fetch all cuisines and set their HTML.
 */
const fetchCuisines = () => {
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
const fillCuisinesHTML = (cuisines = self.cuisines) => {
  const select = document.getElementById('cuisines-select');
  cuisines.forEach(cuisine => {
    const option = document.createElement('option');
    option.innerHTML = cuisine;
    option.value = cuisine;
    select.appendChild(option);
  });
}

/**
 * Initialize leaflet map, called from HTML.
 */
const initMap = () => {
  self.newMap = L.map('map', {
        center: [40.722216, -73.987501],
        zoom: 12,
        scrollWheelZoom: false
      });
  L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.jpg70?access_token={mapboxToken}', {
    mapboxToken: 'pk.eyJ1Ijoib3dsa2luZyIsImEiOiJjamttbTBhcGMwYzF3M290ZGhyc2F4ZW1lIn0.Aasfyld5HSVNGPS-8QaDmg',
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
  if (self.markers) {
    self.markers.forEach(marker => marker.remove());
  }
  self.markers = [];
  self.restaurants = restaurants;
}

/**
 * Create all restaurants HTML and add them to the webpage.
 */
const fillRestaurantsHTML = (restaurants = self.restaurants) => {
  const ul = document.getElementById('restaurants-list');
  restaurants.forEach(restaurant => {
    ul.appendChild(createRestaurantHTML(restaurant));
  });
  addMarkersToMap();
}

/**
 * Create restaurant HTML.
 */
const createRestaurantHTML = (restaurant) => {
  const li = document.createElement('li');

  // create picture element
  const imgDiv = document.createElement('div');
  imgDiv.className = 'img-container';
  li.appendChild(imgDiv);
  
  const picture = document.createElement('picture');
  imgDiv.appendChild(picture);

  const myImage = DBHelper.imageUrlForRestaurant(restaurant);
  const source = document.createElement('source');
  source.media = '(min-width: 467px)';
  source.srcset = myImage.normal + ' 1x,' + myImage.large + '2x';
  picture.appendChild(source);

  const image = document.createElement('img');
  image.className = 'restaurant-img';
  image.src = myImage.small;
  const altText = 'An image of ' + restaurant.name + ' Restaurant';
  image.alt = altText;
  picture.appendChild(image);

  /** TODO: Add favorite toggle  **/
  const fav = document.createElement('button');
  fav.classList = 'fav-button';
  fav.setAttribute('aria-label', 'favorite');
  fav.innerHTML = '❤';
  // if ((/true/i).test(restaurant.is_favorite)) {
  if (restaurant.is_favorite === true) {
    fav.classList.add('active');
    fav.setAttribute('aria-pressed', 'true');
    fav.setAttribute('aria-label', `Unmark ${restaurant.name} as favorite`);
    fav.title = `Unmark as favorite`;
  } else {
    fav.setAttribute('aria-pressed', 'false');
    fav.setAttribute('aria-label', `Mark ${restaurant.name} as favorite`);
    fav.title = `Mark as favorite`;
  }
  fav.addEventListener('click', (event) => {
    event.preventDefault();
    if (fav.classList.contains('active')) {
      fav.setAttribute('aria-pressed', 'false');
      fav.setAttribute('aria-label', `Mark ${restaurant.name} as favorite`);
      fav.title = `Mark as favorite`;
      DBHelper.setFavorite(restaurant, false);
      //postMessage(`${restaurant.name} is not a favorite`);
    } else {
      fav.setAttribute('aria-pressed', 'true');
      fav.setAttribute('aria-label', `Unmark ${restaurant.name} as favorite`);
      fav.title = `Unmark ${restaurant.name} as favorite`;
      DBHelper.setFavorite(restaurant, true);
      //postMessage(`${restaurant.name} is a favorite`);
    }
    fav.classList.toggle('active');
  });
  imgDiv.appendChild(fav);

  const div2 = document.createElement('div');
  div2.className = 'restaurant-info';

  const name = document.createElement('h3');
  name.innerHTML = restaurant.name;
  div2.appendChild(name);

  const neighborhood = document.createElement('p');
  neighborhood.innerHTML = restaurant.neighborhood;
  div2.appendChild(neighborhood);

  const address = document.createElement('p');
  address.innerHTML = restaurant.address;
  div2.appendChild(address);
  
  li.appendChild(div2);

  const more = document.createElement('button');
  more.innerHTML = 'View Details';
  more.className = 'view-button';
  more.setAttribute('aria-label', 'click to view details of ' + restaurant.name + ' Restaurant');
  //more.href = DBHelper.urlForRestaurant(restaurant);
  more.addEventListener('click', () => { window.location.href = DBHelper.urlForRestaurant(restaurant); });
  li.appendChild(more)

  return li
}

/**
 * Add markers for current restaurants to the map.
 */
const addMarkersToMap = (restaurants = self.restaurants) => {
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

/** Method for showing notification onscreen **/
const postMessage = (text) => {
  const messageBox = document.getElementById('message-box'); 
  messageBox.innerHTML = `<p>${text}<p>`;
	messageBox.style.display = 'block';

  setTimeout(() => {
		messageBox.style.display = "none";
		messageBox.innerHTML = "";
  }, 5000);
}
/** Register Service Worker **/
if (navigator.serviceWorker) {
  navigator.serviceWorker.register('./sw.js')
  .then(() => {
      console.log('Service Worker registered')
  })
  .catch((error) => {
      console.log('Registration Failed', error);
  });
}