let restaurants,
  neighborhoods,
  cuisines
var map
var markers = []

/**
 * @description Fetch neighborhoods and cuisines as soon as the page is loaded.
 * @param {string} DOMContentLoaded
 * @param {string} Event
 */
document.addEventListener('DOMContentLoaded', (event) => {
  fetchNeighborhoods();
  fetchCuisines();
});

/**
 * @description Fetch all neighborhoods and set their HTML.
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
 * @description Set neighborhoods HTML. Set accessibility attributes to select and option tags
 * <select role='listbox' aria-label='Choose a neighborhood'><option role='option' aria-label='name of the neighborhood'>
 * @param {string} neighborhood - Neighborhood of the restaurants
 */
fillNeighborhoodsHTML = (neighborhoods = self.neighborhoods) => {

  const select = document.getElementById('neighborhoods-select');
  select.setAttribute('role', 'listbox');
  select.setAttribute('aria-label', 'Choose a neighborhood');

  neighborhoods.map(neighborhood => {
    const option = document.createElement('option');
    option.innerHTML = neighborhood;
    option.value = neighborhood;
    option.setAttribute('role', 'option');
    option.setAttribute("aria-label", neighborhood);
    select.append(option);
  });
}

/**
 * @description Fetch all cuisines and set their HTML.
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
 * description Set cuisines HTML.Set accessibility attributes to select and option tags
 * <select role='listbox' aria-label='Choose a cuisine'><option role='option' aria-label='name of the cuisine'>
 * @param {string} cuisine - Cuisine of the restaurants
 */
fillCuisinesHTML = (cuisines = self.cuisines) => {
  // Add a select tag
  const select = document.getElementById('cuisines-select');
  select.setAttribute('role', 'listbox');
  select.setAttribute('aria-label', 'Choose a cuisine');

  // Add the option tags
  cuisines.map(cuisine => {
    const option = document.createElement('option');
    option.innerHTML = cuisine;
    option.value = cuisine;
    option.setAttribute('role', 'option');
    option.setAttribute("aria-label", cuisine);
    select.append(option);
  });
}

/**
 * @description Initialize Google map, called from HTML.
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
 * @description Update page and map for current restaurants.
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
 * @description Clear current restaurants, their HTML and remove their map markers.
 * @param {string} restaurants
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
 * @description Create all restaurants HTML and add them to the webpage.
 * @param {string} restaurant
 */
fillRestaurantsHTML = (restaurants = self.restaurants) => {
  // Ad the ul tag and li tags
  const ul = document.getElementById('restaurants-list');
  restaurants.map(restaurant => {
    ul.append(createRestaurantHTML(restaurant));
  });
  addMarkersToMap();
}

/**
 * @description Create restaurant HTML. 
 * Choose a source with another im if the width device is less than 551px
 * <li>
 * <picture><source media='(min-width: 551px)' srcset='restaurant.photograph'><img src='restaurant.photoSmall'></picture>
 * <h3>The name of the restaurant</h3>
 * <p>The neighborhood of the restaurant</p>
 * <p>The address of the restaurant</p>
 * <a aria-label=''>View Details</a>
 * </li>
 * @param {string} restaurant
 */
createRestaurantHTML = (restaurant) => {
  // Create the li tag
  const li = document.createElement('li');

  // Create the picture, source and img tag
  const picture = document.createElement('picture');
  li.append(picture);
  const source = document.createElement('source');
  source.media = '(min-width: 551px)';
  source.srcset = DBHelper.imageUrlForRestaurant(restaurant);
  const image = document.createElement('img');
  image.className = 'restaurant-img';
  image.src = DBHelper.imageResponsiveForRestaurant(restaurant);
  image.alt = restaurant.name;
  picture.prepend(image);
  picture.prepend(source);

  // Create the h3 tag
  const name = document.createElement('h3');
  name.innerHTML = restaurant.name;
  li.append(name);

  // Create the p tag for the neighborhood
  const neighborhood = document.createElement('p');
  neighborhood.innerHTML = restaurant.neighborhood;
  li.append(neighborhood);
  
  // Create the p tag for the address
  const address = document.createElement('p');
  address.innerHTML = restaurant.address;
  li.append(address);

  // Create the a tag to the restaurant page with the accessibility attribute
  const more = document.createElement('a');
  more.innerHTML = 'View Details';
  more.href = DBHelper.urlForRestaurant(restaurant);
  more.setAttribute('aria-label', 'View details of the restaurant ' + restaurant.name);
  li.append(more);
  return li;
}

/**
 * @description Add markers for current restaurants to the map.
 * @param {string} restaurant
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
* @description Helper function to convert NodeLists to Arrays
* @param {string} nodes - Nodes
*/
  function slice(nodes) {
    return Array.prototype.slice.call(nodes);
  }

/**
* @description Add an accessibility attribute to option if it's selected
* @param {string} id - The neighborhood or the cuisines select tag
*/
  
  function SelectGroup(id) {
    this.el = document.querySelector(id);
    this.el.setAttribute('role', 'listbox');
    
    this.options = slice(this.el.querySelectorAll('option'));
    let firstOption = true;
    
    this.options.map(option => {
      if(firstOption) {
        option.setAttribute('aria-selected', 'true');
        firstOption = false;
      } else {
        option.setAttribute('role', 'option');
      }
      
      option.setAttribute('role', 'option');
    });
    
    const neighborhoodList = new SelectGroup('#neighborhoods-select');
    const cuisinesList = new SelectGroup('#cuisines-select');
  }

document.getElementById("map").setAttribute("role", "application");
document.getElementById("map").setAttribute("aria-label", "Google Map");

/**
* @description Create a div and a button in the header of the page to show the map of the restaurant
* <div id='show-map' role='button' tabindex=0 aria-pressed='false'>Text content<button></div>
* If the map doesn't appear on the page,  the text content of the button will be Map view. 
* Otherwise there's no button. 
*/

const showMapButton = document.createElement('div');
const header = document.querySelector('header');
header.append(showMapButton);

const mapToHide = document.getElementById("map-container");
mapToHide.style.display = "none";

if(mapToHide.style.display == "none") {
  showMapButton.textContent = 'Map view' || mapToHide.style.display == "flex";
}

showMapButton.setAttribute('aria-label', showMapButton.textContent);
showMapButton.setAttribute('id', 'show-map');
showMapButton.setAttribute('role', 'button');
showMapButton.setAttribute('tabindex','0');
showMapButton.setAttribute("aria-pressed", "false");

showMeMap = () =>{
showMapButton.focus();
showMapButton.setAttribute("aria-pressed", "true");

  if(mapToHide.style.display == "none") {
  mapToHide.style.display = "flex";
  showMapButton.style.display = "none";
  }
  else {
    mapToHide.style.display = "none";
    showMapButton.textContent === 'Show the Map';
  }
};


/**
* @description Add event listeners to the button to show the map
* @param {string} keydown - The keydown event
* @param {string} function
*/
  // Define values for keycodes
  const VK_ENTER      = 13;
  const VK_SPACE      = 32;


showMapButton.addEventListener('keydown', function(event) {
  switch (event.keyCode) {
  case VK_SPACE:
  case VK_ENTER: {

  showMeMap();
  event.stopPropagation();
  event.preventDefault();
  break;
}
  }
});

showMapButton.addEventListener('click', showMeMap);

/**
* @description Create an element to skip to the main content
* <div class='invisible'>
* <a href='#neighborhoods-select' class='skip-main' aria-label='Skip to the main content'>Skip to the main content</a>
* </div>
*/
const skipNav = document.createElement('div');
skipNav.className = 'invisible';
skipNav.setAttribute("role", "complementary");
const nav = document.querySelector('nav');
nav.prepend(skipNav);

const linkNeighborhoods = document.createElement('a');
linkNeighborhoods.href= '#neighborhoods-select';
linkNeighborhoods.textContent = 'Skip to the main content';
linkNeighborhoods.setAttribute('aria-label', linkNeighborhoods.textContent);
linkNeighborhoods.className = 'skip-main';

skipNav.prepend(linkNeighborhoods);
