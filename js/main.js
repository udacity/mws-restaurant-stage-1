let restaurants,
  neighborhoods,
  cuisines
var newMap
var markers = []

/**
 * Fetch neighborhoods and cuisines as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {
  initMap(); // added 
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
    option.setAttribute("role","menuitem");
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
    option.setAttribute("role","menuitem");
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
    mapboxToken: 'pk.eyJ1IjoicGluZ2VsZWFub3IiLCJhIjoiY2psM3Mxamx0MjRwbTNxcWhndXRuaXRsMiJ9.Vux4Ho_5MvAU1OK2tQv9zg',
    maxZoom: 18,
    attribution: 'Map data &copy; <a role="link" href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
      '<a role="link" href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
      'Imagery © <a role="link" href="https://www.mapbox.com/">Mapbox</a>',
    id: 'mapbox.streets'
  }).addTo(newMap);

  updateRestaurants();
}
/* window.initMap = () => {
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
} */

/**
 * Update page and map for current restaurants.
 */
updateRestaurants = () => {
  
    
  
  const cSelect = document.getElementById('cuisines-select');
  const nSelect = document.getElementById('neighborhoods-select');

  const cIndex = cSelect.selectedIndex;
  const nIndex = nSelect.selectedIndex;
  
  let selectedItems = document.querySelectorAll("[aria-selected*='true']");
  selectedItems.forEach(a=>a.removeAttribute("aria-selected","true"));

  

  cSelect[cIndex].setAttribute("aria-selected","true");
  nSelect[nIndex].setAttribute("aria-selected","true");

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
  if(restaurants.length <= 0){
    const para = document.createElement("li");
    para.tabIndex = "0";
    para.innerText = "No matched results"
    ul.appendChild(para);
  }
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
  li.classList.add("col-5");
  li.tabIndex = 0;
  const picture = document.createElement('picture');
  const sourceSmall = document.createElement('source');
  sourceSmall.media="(max-width: 480px)";
  const source = document.createElement('source');
  
  const image = document.createElement("img");
  image.className = 'restaurant-img';
 
  image.alt = DBHelper.nameForRestaurant(restaurant);
   if(window.location.hostname === "localhost" || location.hostname === "127.0.0.1"){
    sourceSmall.srcset = DBHelper.smallImageUrlForRestaurant(restaurant);
    source.srcset = DBHelper.imageUrlForRestaurant(restaurant);
     image.src = DBHelper.imageUrlForRestaurant(restaurant);
  }else{
     sourceSmall.srcset = DBHelper.smallImageUrlForGitHub(restaurant);
    source.srcset = DBHelper.imageUrlForGitHub(restaurant);
     image.src = DBHelper.imageUrlForGitHub(restaurant);
  }
  picture.appendChild(sourceSmall);
  picture.appendChild(source);
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
  more.setAttribute("role","link");
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
    const marker = DBHelper.mapMarkerForRestaurant(restaurant, self.newMap);
    marker.on("click", onClick);
    function onClick() {
      window.location.href = marker.options.url;
    }
    self.markers.push(marker);
  });

} 
if(!navigator.serviceWorker){console.log('No serviceworker available');}
else{
    navigator.serviceWorker.register('../sw.js').then(function(){
        console.log('It works');

    }).catch(function(err){
        console.log(err+'It failed');
    })
}
/* addMarkersToMap = (restaurants = self.restaurants) => {
  restaurants.forEach(restaurant => {
    // Add marker to the map
    const marker = DBHelper.mapMarkerForRestaurant(restaurant, self.map);
    google.maps.event.addListener(marker, 'click', () => {
      window.location.href = marker.url
    });
    self.markers.push(marker);
  });
} */

