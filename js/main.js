let restaurants,
  neighborhoods,
  cuisines;
var map;
var markers = [];
var observer;
let imgLoaded=[];//array to hold the images that allready loaded

/**
 * Fetch neighborhoods and cuisines as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {
  createObserver();
  fetchNeighborhoods();
  fetchCuisines();
  updateRestaurants();//moved this here to work offline
});

createObserver= () => {
//we use an observer to lazy load images and improve performance
  let options = {
    root: null,
    rootMargin: "0px 0px 0px 0px"
  };
  self.observer = new IntersectionObserver(handleIntersect, options);
}

handleIntersect = (entries, observer) => {
  entries.forEach(function(entry) {
    if(entry.isIntersecting && !imgLoaded.includes(entry.target.getAttribute('data-id'))){
      //determine if we should lazy load the image and remove from observer
     lazy_load(entry.target);
      self.observer.unobserve(entry.target);
    }
  });
}

lazy_load = (entry) => {
  let dataID=parseInt(entry.getAttribute('data-id'));
  imgLoaded.push(dataID);
  let restaurant = self.restaurants.find(function (obj) { return obj.id === dataID; });
  let img=document.getElementById(`img-${dataID}`);
  img.setAttribute('src',DBHelper.imageUrlForRestaurant(restaurant,true));
  img.style.visibility='visible';

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
  //Since we moved updateRestaurants from the initMap to document ready, here we doublecheck if the markers were loaded and if not we load them
  if(self.restaurants && self.markers.length==0){
    addMarkersToMap();
    }

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
      /*
      div id=filtered-results has aria-live=polite, to announce the number of filtered results
      */
      document.getElementById('filtered-results').innerHTML=`<p>${restaurants.length} Results</p>`;
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
  //Since we moved updateRestaurants from the initMap to document ready, before we set the markers we check if the map is loaded
  if(self.map){
  addMarkersToMap();
  }
}

/**
 * Create restaurant HTML.
 */
createRestaurantHTML = (restaurant) => {
  const div = document.createElement('div');
  div.className = 'restaurant-item';
  div.setAttribute('data-id',restaurant.id);
  const image = document.createElement('img');
  image.className = 'restaurant-img';
  image.setAttribute('id',`img-${restaurant.id}`);
  image.style.visibility='hidden';
  //image.src = DBHelper.imageUrlForRestaurant(restaurant,true);
  image.alt=restaurant.name+` ${restaurant.cuisine_type} Restaurant`;
  div.append(image);

  const name = document.createElement('h2');
  name.innerHTML = restaurant.name;
  div.append(name);

  const neighborhood = document.createElement('p');
  neighborhood.innerHTML = restaurant.neighborhood;
  div.append(neighborhood);

  const address = document.createElement('p');
  address.innerHTML = restaurant.address;
  div.append(address);

  const more = document.createElement('a');
  more.innerHTML = 'View Details';
  more.setAttribute('aria-label', `View details about ${restaurant.name} Restaurant`);
  more.href = DBHelper.urlForRestaurant(restaurant);
  div.append(more);
  self.observer.observe(div);
  return div
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
