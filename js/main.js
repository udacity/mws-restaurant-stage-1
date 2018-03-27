let restaurants,
  neighborhoods,
  cuisines;
  var map;
var markers = [];
var observer;
let imgLoaded=[];//array to hold the images that allready loaded


/**
 * Initialize Google map, called from HTML.
 */
window.initMap = () => {
  //when google maps api is loaded display the map container
  document.getElementById('map').style.display='block';

  //regexp taken from https://www.opentechguides.com/how-to/article/javascript/98/detect-mobile-device.html
  const mobExp = new RegExp('Android|webOS|iPhone|iPad|' +
  'BlackBerry|Windows Phone|'  +
  'Opera Mini|IEMobile|Mobile' ,
 'i');

  if (!mobExp.test(navigator.userAgent)){
    //if not mobile start the map
    initiateMap();
  }else{
    //if mobile the map will load on user request to maximize performance
    document.getElementById('startmap').addEventListener('click',initiateMap);
  }
}

initiateMap = (e) => {
  if(e){
    if(!navigator.onLine){
      alert('You are currently offline.');
      return;
    }
  }
  let mm=document.getElementById('map');
  mm.style.height='400px';
  mm.innerHTML='';
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


/*
  Listeners for offline state
  */
window.addEventListener('offline', (e) => {
  toggleOffline(true);
});

window.addEventListener('online', (e) => {
  toggleOffline(false);
});

toggleOffline = (offline,checkSync=true) =>{
  if(offline){
    document.getElementById('offline').style.visibility='visible';
  }else{
    document.getElementById('offline').style.visibility='hidden';
    if(checkSync){
    DBHelper.syncOfflineData();//when back online send temp data to server and delete them locally
    }
  }
}


/**
 * Fetch neighborhoods and cuisines as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {
    toggleOffline(!navigator.onLine,false);//check initial offline state
  createObserver();
  /*
  we stopped calling these functions to reduce the number of fetches,
  we moved this functionality to updateRestaurants which is fetched to get the restaurants
  //fetchNeighborhoods();
  //fetchCuisines();
  */
  if(!navigator.onLine){
    //if offline don't check for pending sync
    updateRestaurants();//moved this here to work offline
  }else{
    //online first check if pending sync
    DBHelper.syncOfflineData().then(() =>{
      updateRestaurants();
    });
  }



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
 * Update page and map for current restaurants.
 */
updateRestaurants = () => {
  const cSelect = document.getElementById('cuisines-select');
  const nSelect = document.getElementById('neighborhoods-select');

  const cIndex = cSelect.selectedIndex;
  const nIndex = nSelect.selectedIndex;

  const cuisine = cSelect[cIndex].value;
  const neighborhood = nSelect[nIndex].value;

  DBHelper.fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, (error, data) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      //data returns restaurants,unique csisines and unique neighbothoods to reduce the number of fetch requests
      if(!self.cuisines){
      self.cuisines = data.cuisines;
      fillCuisinesHTML();
      }
      if(!self.neighborhoods){
      self.neighborhoods = data.neighborhoods;
      fillNeighborhoodsHTML();
      }
      resetRestaurants(data.restaurants);
      fillRestaurantsHTML();
      /*
      div id=filtered-results has aria-live=polite, to announce the number of filtered results
      */
      document.getElementById('filtered-results').innerHTML=`<p>${data.restaurants.length} Results</p>`;
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


  const fav = document.createElement('img');
  fav.className = 'favorite';
  fav.setAttribute('id',`fav-${restaurant.id}`);
  fav.src ='icons/notfavorite.png';
  fav.setAttribute('role',`button`);
  fav.alt="Click to mark as favorite!";
  fav.setAttribute('title',`Click to mark as favorite!`);
  fav.setAttribute('aria-label',`Press enter to mark as favorite!`);
  fav.setAttribute('tabindex', 0);
  fav.setAttribute('data-is-favorite',`false`);
  //first we check if the is_favorite property exists (a restaurant didn't have this value on the initial db)
  //then we parse the string value to boolean
  if(restaurant.is_favorite && DBHelper.parseBoolean(restaurant.is_favorite)){
    fav.src ='icons/favorite.png';
    fav.setAttribute('data-is-favorite',`true`);
    fav.setAttribute('title',`Click to mark as not favorite!`);
    fav.setAttribute('aria-label',`Press enter to mark as not favorite!`);
  }
  div.append(fav);
  //we add a click listener to toggle a restaurant as Favorite
  fav.addEventListener('click',(e) => {
    toggleFavorite(e.target);
  });
  //we add a keydown listener to toggle Favorite with keyboard enter (ARIA)
  fav.addEventListener('keydown',(e) => {
    if(e.keyCode==13){
    toggleFavorite(e.target);
    }
  });

  self.observer.observe(div);
  return div;
}

toggleFavorite = (elem) => {
  let restaurant_id=elem.getAttribute('id').split('-')[1];
  let is_favorite=DBHelper.parseBoolean(elem.getAttribute('data-is-favorite'));
  DBHelper.toggleFavorite(restaurant_id,!is_favorite);
  //change image
  if(!is_favorite==true){
    elem.src='icons/favorite.png';
    elem.setAttribute('data-is-favorite',`true`);
    elem.setAttribute('title',`Click to mark as not favorite!`);
    elem.setAttribute('aria-label',`Press enter to mark as not favorite!`);
    //announce it to scren readers
    document.getElementById('filtered-results').innerHTML=`<p>Υου marked as favorite</p>`;
  }else{
    elem.src='icons/notfavorite.png';
    elem.setAttribute('data-is-favorite',`false`);
    elem.setAttribute('title',`Click to mark as favorite!`);
    elem.setAttribute('aria-label',`Press enter to mark as favorite!`);
    //announce it to scren readers
    document.getElementById('filtered-results').innerHTML=`<p>Υου marked as not favorite</p>`;
  }




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
