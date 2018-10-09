//<<-!->>import DBHelper from './dbhelper.mjs';

class MainPage {
  constructor() {
    this.neighborhoods = [];
    this.cuisines = [];
    this.markers = [];
  }

  /**********************
        Data Fetch
  **********************/

  /**
   * Fetch all neighborhoods and set their HTML.
   */
  fetchNeighborhoods() {
    DBHelper.fetchNeighborhoods((error, neighborhoods) => {
      if (error) { // Got an error
        console.error(error);
      } else {
        this.neighborhoods = neighborhoods;
        this.fillNeighborhoodsHTML();
      }
    });
  }

  /**
   * Fetch all cuisines and set their HTML.
   */
  fetchCuisines() {
    DBHelper.fetchCuisines((error, cuisines) => {
      if (error) { // Got an error!
        console.error(error);
      } else {
        this.cuisines = cuisines;
        this.fillCuisinesHTML();
      }
    });
  }

  /**********************
        Data in UI
  **********************/

  /**
   * Set neighborhoods HTML.
   */
  fillNeighborhoodsHTML() {
    const select = document.getElementById('neighborhoods-select');
    this.neighborhoods.forEach(neighborhood => {
      const option = document.createElement('option');
      option.innerHTML = neighborhood;
      option.value = neighborhood;
      select.append(option);
    });
  }

  /**
   * Set cuisines HTML.
   */
  fillCuisinesHTML() {
    const select = document.getElementById('cuisines-select');

    this.cuisines.forEach(cuisine => {
      const option = document.createElement('option');
      option.innerHTML = cuisine;
      option.value = cuisine;
      select.append(option);
    });
  }


  /**
   * Update page and map for current restaurants.
   */
  updateRestaurants() {
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
        this.resetRestaurants(restaurants);
        this.fillRestaurantsHTML();
      }
    });
  }


  /**
   * Clear current restaurants, their HTML and remove their map markers.
   */
  resetRestaurants(restaurants) {
    // Remove all restaurants
    this.restaurants = [];
    const ul = document.getElementById('restaurants-list');
    ul.innerHTML = '';

    // Remove all map markers
    if (this.markers) {
      this.markers.forEach(marker => marker.remove());
    }
    this.markers = [];
    this.restaurants = restaurants;
  }


  /**
  /**
   * Create all restaurants HTML and add them to the webpage.
   */
  fillRestaurantsHTML() {
    const ul = document.getElementById('restaurants-list');
    this.restaurants.forEach(restaurant => {
      ul.append(this.createRestaurantHTML(restaurant));
    });
    this.addMarkersToMap();
  }

  /**
   * Create restaurant HTML.
   */
  createRestaurantHTML(restaurant) {
    const li = document.createElement('li');
    li.className = 'restaurant-item';

    /* image sizes to use in srcset */
    const imgSizes = ['300', '400', '600', '800'];
    /* image size to use as fallback in src */
    const defaultSize = '400';
    const image = document.createElement('img');
    image.className = 'restaurant-img';
    image.src = DBHelper.imageUrlForRestaurant(
      restaurant.photograph,
      defaultSize
    );
    image.srcset = DBHelper.imageSrcsetForRestaurant(
      restaurant.photograph,
      imgSizes
    );
    image.sizes = `(min-width: 416px) and (max-width: 632px) 400px,
                  (min-width: 1248px) 400px,
                  300px`;
    image.alt = `This is an image of the ${restaurant.name} restaurant`;
    li.append(image);

    const info = document.createElement('div');
    info.className = 'restaurant-info';
    li.append(info);

    const name = document.createElement('h1');
    name.innerHTML = restaurant.name;
    info.append(name);

    const neighborhood = document.createElement('p');
    neighborhood.innerHTML = restaurant.neighborhood;
    info.append(neighborhood);

    const address = document.createElement('p');
    address.innerHTML = restaurant.address;
    info.append(address);

    const more = document.createElement('a');
    more.innerHTML = 'View Details';
    more.href = DBHelper.urlForRestaurant(restaurant);
    more.setAttribute('aria-label', restaurant.name);
    info.append(more);

    return li;
  }

  /**********************
          MAP
  **********************/
  /**
   * Initialize leaflet map, called from HTML.
   */
  initMap(mapboxToken) {
    this.newMap = L.map('map', {
      center: [40.722216, -73.987501],
      zoom: 12,
      scrollWheelZoom: false
    });
    L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.jpg70?access_token={mapboxToken}', {
      mapboxToken,
      maxZoom: 18,
      attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
        '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
        'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
      id: 'mapbox.streets'
    }).addTo(this.newMap);

    this.updateRestaurants();
  }


  /**
   * Add markers for current restaurants to the map.
   */
  addMarkersToMap() {
    this.restaurants.forEach(restaurant => {
      // Add marker to the map
      const marker = DBHelper.mapMarkerForRestaurant(restaurant, this.newMap);
      marker.on('click', onClick);
      function onClick() {
        window.location.href = marker.options.url;
      }
      this.markers.push(marker);
    });
  }


  /**********************
      Initialization
  **********************/


  init() {
    /**
     * Fetch neighborhoods and cuisines as soon as the page is loaded.
     */
    document.addEventListener('DOMContentLoaded', () => {
      DBHelper.fetchMAPBOXToken().then(mapboxToken => {
        this.initMap(mapboxToken); // added
      });
      this.fetchNeighborhoods();
      this.fetchCuisines();

      /* listen for select elements and update Restaurants */
      document.querySelector('.filter-options').addEventListener('change',(e) => {
        if(e.target.id.includes('-select')) {
          this.updateRestaurants();
          e.stopPropagation();
        }
      });

    });
  }
}

(() => {
  const main = new MainPage();
  main.init();
})();
