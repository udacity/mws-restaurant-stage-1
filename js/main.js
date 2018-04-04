let restaurants,
  neighborhoods,
  cuisines
var map
var markers = []

let updateDialog = document.querySelector('.update-dialog');
let updateInstallButton = document.querySelector('.update-dialog .install-udpate');

const serviceWorkerHelper = function ServiceWorkerHelper(workerLocation, updateUI, updateTriggerEl){
  if (!navigator.serviceWorker) throw new Error("service worker not supported")

  const updateTriggerElement = updateTriggerEl;

  // register the service worker
  navigator.serviceWorker.register(workerLocation).then((reg)=>{
      
      // check if service worker loaded the page - if it didn't return (as service worker is the latest)
      if (!navigator.serviceWorker.controller) return
      
      // if there is one waiting - there was a service worker installed on the last refresh and its waiting
      if(reg.waiting){
          displayHelper.revealPopup(updateUI)
          return;
      }

      // if there is a service worker installing
      if(reg.installing){
          trackInstalling(reg.installing)
          return;
      }

      // listen for future workers installing
      reg.addEventListener('updatefound', ()=>{
          trackInstalling(reg.installing)
      })


  }).catch((err)=>{
      throw new Error(`Service worker didn't register: ${err.message}`)
  })

  // listen for changeover of service worker - reload page if a new one took over
  navigator.serviceWorker.addEventListener('controllerchange', ()=>{
      window.location.reload()
  })


  // listen to installing service worker && show user when its waiting
  const trackInstalling = (worker)=>{

      worker.addEventListener('statechange', ()=>{
          if(worker.state == 'installed'){

              updateTriggerElement.addEventListener('click', ()=>{ // add click event to the UI
                  worker.postMessage({action: 'skipWaiting'})
              })

              displayHelper.revealPopup(updateUI)  // show the UI
          }
      })
  }

}('./js/sw.js', updateDialog, updateInstallButton)

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

  // decompose the url to allow selection of different images
  // in response to the image display size
  const baseURL = DBHelper.imageUrlForRestaurant(restaurant);
  let urlComponents = baseURL.split(".");

  image.src = `${urlComponents[0]}-400_1x.${urlComponents[1]}`; // src for fallback
  image.srcset = `${urlComponents[0]}-400_1x.${urlComponents[1]} 1x,
                  ${urlComponents[0]}-800_2x.${urlComponents[1]} 2x`;
  // set sizes attribute to indicate display size - relevant to media queries
  //image.sizes = `(min-width:450px) 400px, 100vw`;
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
