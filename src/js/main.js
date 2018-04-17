/*global google*/
import DBHelper from './dbhelper';
import ImgUtils from './imgutils';
import LazyImgs from './lazyImgs';
import 'whatwg-fetch';
import 'intersection-observer';

class Main {
  constructor() {
    this.restaurants = [];
    this.neighborhoods = [];
    this.cuisines = [];
    this.markers = [];
    this.map = undefined;
    /**
     * Fetch neighborhoods and cuisines as soon as the page is loaded.
     */
    document.addEventListener('DOMContentLoaded', () => {
      this.initServiceWorker();
      this.fetchNeighborhoods();
      this.fetchCuisines();
    });
    this.initMap();
  }

  /**
   * Fetch all neighborhoods and set their HTML.
   */
  fetchNeighborhoods() {
    DBHelper.fetchNeighborhoods()
      .then((neighborhoods) => {
        this.neighborhoods = neighborhoods;
        this.fillNeighborhoodsHTML();
      })
      .catch((error) => {
        console.error(error);
      });
  }

  /**
   * Set neighborhoods HTML.
   */
  fillNeighborhoodsHTML(neighborhoods = this.neighborhoods) {
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
  fetchCuisines() {
    DBHelper.fetchCuisines()
      .then((cuisines) => {
        this.cuisines = cuisines;
        this.fillCuisinesHTML();
      })
      .catch((error) => {
        console.error(error);
      });
  }

  /**
   * Set cuisines HTML.
   */
  fillCuisinesHTML (cuisines = this.cuisines) {
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
  initMap() {
    window.initMap = () => {
      let loc = {
        lat: 40.722216,
        lng: -73.987501
      };
      this.map = new google.maps.Map(document.getElementById('map'), {
        zoom: 12,
        center: loc,
        scrollwheel: false
      });
      this.updateRestaurants();
    };
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

    DBHelper.fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood)
      .then((restaurants) => {
        this.resetRestaurants(restaurants);
        this.fillRestaurantsHTML();
        new LazyImgs('#restaurants-list img');
      })
      .catch((error) => {
        console.error(error);
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
    this.markers.forEach(m => m.setMap(null));
    this.markers = [];
    this.restaurants = restaurants;
  }

  /**
   * Create all restaurants HTML and add them to the webpage.
   */
  fillRestaurantsHTML(restaurants = this.restaurants) {
    const ul = document.getElementById('restaurants-list');
    restaurants.forEach(restaurant => {
      ul.append(this.createRestaurantHTML(restaurant));
    });
    this.addMarkersToMap();
  }

  /**
   * Create restaurant HTML.
   */
  createRestaurantHTML(restaurant) {
    const li = document.createElement('li');
    const div = document.createElement('div');
    div.className = 'restaurant-info';

    const image = document.createElement('img');
    image.className = 'restaurant-img';
    image.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
    image.dataset.src = DBHelper.imageUrlForRestaurant(restaurant);
    image.alt = ImgUtils.getAlternateById(restaurant.id - 1);
    li.append(image);

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
    more.setAttribute('role', 'button');
    more.setAttribute('aria-label', `View details of ${restaurant.name} restaurant`);
    more.className = 'more-button';
    more.innerHTML = 'View Details';
    more.href = DBHelper.urlForRestaurant(restaurant);
    div.append(more);
    li.append(div);
    return li;
  }

  /**
   * Add markers for current restaurants to the map.
   */
  addMarkersToMap(restaurants = this.restaurants){
    restaurants.forEach(restaurant => {
      // Add marker to the map
      const marker = DBHelper.mapMarkerForRestaurant(restaurant, this.map);
      google.maps.event.addListener(marker, 'click', () => {
        window.location.href = marker.url;
      });
      this.markers.push(marker);
    });
  }

  initServiceWorker() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('./sw.js').then(() => {
        console.log('Service Worker registered');
      })
        .catch((error) => {
          console.log('Registration failed with ' + error);
        });
    }
  }
}

window.main = new Main();
