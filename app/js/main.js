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
  lazyLoadImages();
});


const lazyLoadImages = () =>
{
  var lazyImages = [].slice.call(document.querySelectorAll("img.lazy"));;

  if ("IntersectionObserver" in window && "IntersectionObserverEntry" in window && "intersectionRatio" in window.IntersectionObserverEntry.prototype) {
    let lazyImageObserver = new IntersectionObserver(function (entries, observer) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          let lazyImage = entry.target;
          lazyImage.src = lazyImage.dataset.src;
          lazyImage.srcset = lazyImage.dataset.srcset;
          lazyImage.classList.remove("lazy");
          lazyImageObserver.unobserve(lazyImage);
        }
      });
    });

    lazyImages.forEach(function (lazyImage) {
      lazyImageObserver.observe(lazyImage);
    });
  }

}
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
    select.append(option);
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
    select.append(option);
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
    mapboxToken: 'pk.eyJ1Ijoia2h1c2J1Y2hhbmRyYSIsImEiOiJjamozMm9oeGUwdGlkM3BwNjBwcndoY3NsIn0.nBnmq4CLCWPlszD2pl5Yvg',
    maxZoom: 18,
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
      '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
      'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
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
    ul.append(createRestaurantHTML(restaurant));
  });
  addMarkersToMap();
}

/**
 * Create restaurant HTML.
 */
const createRestaurantHTML = (restaurant) => {
  const li = document.createElement('li');
  const imageURL = DBHelper.imageUrlForRestaurant(restaurant);
  const image = document.createElement('img');
  image.className = 'restaurant-img lazy';
  image.src = imageURL;
  image["data-src"] = imageURL;
  image["data-srcset"] = imageURL;
  image.setAttribute('alt', restaurant.name);
  li.append(image);

  const name = document.createElement('h1');
  name.innerHTML = restaurant.name;
  li.append(name);

  const favoriteDiv = document.createElement("div");
  const selectedFavouriteIcon = document.createElement("i");
  selectedFavouriteIcon.id = "favorite-selected-icon-" + restaurant.id;
  selectedFavouriteIcon.className ="fas fa-heart";
  selectedFavouriteIcon.style.display = restaurant["is_favorite"] ? "block" : "none";
  selectedFavouriteIcon.style.color = "red";
  const unselectedFavouriteIcon = document.createElement("i");
  unselectedFavouriteIcon.id = "favorite-unselected-icon-" + restaurant.id;
  unselectedFavouriteIcon.className ="far fa-heart";
  unselectedFavouriteIcon.style.display = restaurant["is_favorite"] ? "none" : "block";
  const favoriteBtn = document.createElement("button");
  favoriteBtn.className ="btn";
  // favoriteBtn.innerHTML = restaurant["is_favorite"] ? restaurant.name + " is a favorite" : restaurant.name + " is not a favorite";
  favoriteBtn.id = "favorite-icon-" + restaurant.id;
  favoriteBtn.onclick = event => handleFavoriteSelection(restaurant.id, !restaurant["is_favorite"]);
  favoriteBtn.append(selectedFavouriteIcon);
  favoriteBtn.append(unselectedFavouriteIcon);
  favoriteDiv.append(favoriteBtn);
  li.append(favoriteDiv);

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

const handleFavoriteSelection = (id, newState) => {
  const fav = document.getElementById("favorite-icon-" + id);
  fav.onclick = null;
   DBHelper.updateFavoriteSelection(id, newState, (error, response) => {
    if (error) {
      console.log("Error updating favorite");
      return;
    }
    // Update the button background for the specified favorite
    const favoriteSelected = document.getElementById("favorite-selected-icon-" + response.id);
    favoriteSelected.style.display = response.value ? "block" : "none";
	const favoriteUnSelected = document.getElementById("favorite-unselected-icon-" + response.id);
    favoriteUnSelected.style.display = response.value ? "none" : "block";
    // Update properties of the restaurant data object
    const restaurant = self.restaurants.filter(r => r.id === response.id)[0];
    if (!restaurant) return;
    restaurant["is_favorite"] = response.value;
    fav.onclick = event => handleFavoriteSelection(restaurant.id, !restaurant["is_favorite"]);
  });
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

