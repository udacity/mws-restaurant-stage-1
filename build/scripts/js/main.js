"use strict";

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

/*eslint no-unused-vars: ["error", { "varsIgnorePattern": "DBHelper" }]*/

/*
 Change this to your base url in local env
 that would be 'http://localhost:port'
*/
var BASE_URL = function () {
  if (location.origin.includes('http://localhost:')) {
    return location.origin;
  }

  return "".concat(location.origin, "/mws-restaurant-stage-1");
}();
/**
 * Common database helper functions.
 */


var DBHelper =
/*#__PURE__*/
function () {
  function DBHelper() {
    _classCallCheck(this, DBHelper);
  }

  _createClass(DBHelper, null, [{
    key: "fetchMAPBOXToken",

    /**
     * Fetch MAPBOX Token from DB instead of including
     * it in the script
     */
    value: function fetchMAPBOXToken() {
      return fetch(DBHelper.DATABASE_URL).then(function (res) {
        return res.json();
      }).then(function (data) {
        return data.MAPBOX_TOKEN;
      }).catch(function (err) {
        console.log(err);
      });
    }
    /**
     * Database URL.
     * Change this to restaurants.json file location on your server.
     */

  }, {
    key: "fetchRestaurants",

    /**
     * Fetch all restaurants.
     */
    value: function fetchRestaurants(callback) {
      var xhr = new XMLHttpRequest();
      xhr.open('GET', DBHelper.DATABASE_URL);

      xhr.onload = function () {
        if (xhr.status === 200) {
          // Got a success response from server!
          var json = JSON.parse(xhr.responseText);
          var restaurants = json.restaurants;
          callback(null, restaurants);
        } else {
          // Oops!. Got an error from server.
          var error = "Request failed. Returned status of ".concat(xhr.status);
          callback(error, null);
        }
      };

      xhr.send();
    }
    /**
     * Fetch a restaurant by its ID.
     */

  }, {
    key: "fetchRestaurantById",
    value: function fetchRestaurantById(id, callback) {
      // fetch all restaurants with proper error handling.
      DBHelper.fetchRestaurants(function (error, restaurants) {
        if (error) {
          callback(error, null);
        } else {
          var restaurant = restaurants.find(function (r) {
            return r.id == id;
          });

          if (restaurant) {
            // Got the restaurant
            callback(null, restaurant);
          } else {
            // Restaurant does not exist in the database
            callback('Restaurant does not exist', null);
          }
        }
      });
    }
    /**
     * Fetch restaurants by a cuisine type with proper error handling.
     */

  }, {
    key: "fetchRestaurantByCuisine",
    value: function fetchRestaurantByCuisine(cuisine, callback) {
      // Fetch all restaurants  with proper error handling
      DBHelper.fetchRestaurants(function (error, restaurants) {
        if (error) {
          callback(error, null);
        } else {
          // Filter restaurants to have only given cuisine type
          var results = restaurants.filter(function (r) {
            return r.cuisine_type == cuisine;
          });
          callback(null, results);
        }
      });
    }
    /**
     * Fetch restaurants by a neighborhood with proper error handling.
     */

  }, {
    key: "fetchRestaurantByNeighborhood",
    value: function fetchRestaurantByNeighborhood(neighborhood, callback) {
      // Fetch all restaurants
      DBHelper.fetchRestaurants(function (error, restaurants) {
        if (error) {
          callback(error, null);
        } else {
          // Filter restaurants to have only given neighborhood
          var results = restaurants.filter(function (r) {
            return r.neighborhood == neighborhood;
          });
          callback(null, results);
        }
      });
    }
    /**
     * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
     */

  }, {
    key: "fetchRestaurantByCuisineAndNeighborhood",
    value: function fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, callback) {
      // Fetch all restaurants
      DBHelper.fetchRestaurants(function (error, restaurants) {
        if (error) {
          callback(error, null);
        } else {
          var results = restaurants;

          if (cuisine != 'all') {
            // filter by cuisine
            results = results.filter(function (r) {
              return r.cuisine_type == cuisine;
            });
          }

          if (neighborhood != 'all') {
            // filter by neighborhood
            results = results.filter(function (r) {
              return r.neighborhood == neighborhood;
            });
          }

          callback(null, results);
        }
      });
    }
    /**
     * Fetch all neighborhoods with proper error handling.
     */

  }, {
    key: "fetchNeighborhoods",
    value: function fetchNeighborhoods(callback) {
      // Fetch all restaurants
      DBHelper.fetchRestaurants(function (error, restaurants) {
        if (error) {
          callback(error, null);
        } else {
          // Get all neighborhoods from all restaurants
          var neighborhoods = restaurants.map(function (v, i) {
            return restaurants[i].neighborhood;
          }); // Remove duplicates from neighborhoods

          var uniqueNeighborhoods = neighborhoods.filter(function (v, i) {
            return neighborhoods.indexOf(v) == i;
          });
          callback(null, uniqueNeighborhoods);
        }
      });
    }
    /**
     * Fetch all cuisines with proper error handling.
     */

  }, {
    key: "fetchCuisines",
    value: function fetchCuisines(callback) {
      // Fetch all restaurants
      DBHelper.fetchRestaurants(function (error, restaurants) {
        if (error) {
          callback(error, null);
        } else {
          // Get all cuisines from all restaurants
          var cuisines = restaurants.map(function (v, i) {
            return restaurants[i].cuisine_type;
          }); // Remove duplicates from cuisines

          var uniqueCuisines = cuisines.filter(function (v, i) {
            return cuisines.indexOf(v) == i;
          });
          callback(null, uniqueCuisines);
        }
      });
    }
    /**
     * Restaurant page URL.
     */

  }, {
    key: "urlForRestaurant",
    value: function urlForRestaurant(restaurant) {
      return "".concat(BASE_URL, "/restaurant.html?id=").concat(restaurant.id);
    }
    /**
     * Restaurant image URL.
     */

  }, {
    key: "imageUrlForRestaurant",
    value: function imageUrlForRestaurant(photograph, size) {
      return "".concat(BASE_URL, "/build/img/").concat(photograph, "-").concat(size, "w.jpg");
    }
  }, {
    key: "imageSrcsetForRestaurant",
    value: function imageSrcsetForRestaurant(photograph) {
      var sizes = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];
      var imgPaths = [];
      sizes.forEach(function (size) {
        imgPaths.push("".concat(BASE_URL, "/build/img/").concat(photograph, "-").concat(size, "w.jpg ").concat(size, "w"));
      });
      return imgPaths.join(', ');
    }
    /**
     * Map marker for a restaurant.
     */

  }, {
    key: "mapMarkerForRestaurant",
    value: function mapMarkerForRestaurant(restaurant, map) {
      // https://leafletjs.com/reference-1.3.0.html#marker
      var marker = new L.marker([restaurant.latlng.lat, restaurant.latlng.lng], {
        title: restaurant.name,
        alt: restaurant.name,
        url: DBHelper.urlForRestaurant(restaurant)
      });
      marker.addTo(map);
      return marker;
    }
    /*  ============== Service Worker Registration ============== */

  }, {
    key: "registerServiceWorker",
    value: function registerServiceWorker() {
      /* making sure browser supports service worker */
      if ('serviceWorker' in navigator) {
        window.addEventListener('load', function () {
          navigator.serviceWorker.register('./sw.js').then(function () {
            console.log('Registering service worker');
          }).catch(function () {
            console.log('Service Worker registration failed');
          });
        });
      }
    }
  }, {
    key: "DATABASE_URL",
    get: function get() {
      return "".concat(BASE_URL, "/build/data/restaurants.json");
    }
  }]);

  return DBHelper;
}();
"use strict";

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var MainPage =
/*#__PURE__*/
function () {
  function MainPage() {
    _classCallCheck(this, MainPage);

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


  _createClass(MainPage, [{
    key: "fetchNeighborhoods",
    value: function fetchNeighborhoods() {
      var _this = this;

      DBHelper.fetchNeighborhoods(function (error, neighborhoods) {
        if (error) {
          // Got an error
          console.error(error);
        } else {
          _this.neighborhoods = neighborhoods;

          _this.fillNeighborhoodsHTML();
        }
      });
    }
    /**
     * Fetch all cuisines and set their HTML.
     */

  }, {
    key: "fetchCuisines",
    value: function fetchCuisines() {
      var _this2 = this;

      DBHelper.fetchCuisines(function (error, cuisines) {
        if (error) {
          // Got an error!
          console.error(error);
        } else {
          _this2.cuisines = cuisines;

          _this2.fillCuisinesHTML();
        }
      });
    }
    /**********************
          Data in UI
    **********************/

    /**
     * Set neighborhoods HTML.
     */

  }, {
    key: "fillNeighborhoodsHTML",
    value: function fillNeighborhoodsHTML() {
      var select = document.getElementById('neighborhoods-select');
      this.neighborhoods.forEach(function (neighborhood) {
        var option = document.createElement('option');
        option.innerHTML = neighborhood;
        option.value = neighborhood;
        select.append(option);
      });
    }
    /**
     * Set cuisines HTML.
     */

  }, {
    key: "fillCuisinesHTML",
    value: function fillCuisinesHTML() {
      var select = document.getElementById('cuisines-select');
      this.cuisines.forEach(function (cuisine) {
        var option = document.createElement('option');
        option.innerHTML = cuisine;
        option.value = cuisine;
        select.append(option);
      });
    }
    /**
     * Update page and map for current restaurants.
     */

  }, {
    key: "updateRestaurants",
    value: function updateRestaurants() {
      var _this3 = this;

      var cSelect = document.getElementById('cuisines-select');
      var nSelect = document.getElementById('neighborhoods-select');
      var cIndex = cSelect.selectedIndex;
      var nIndex = nSelect.selectedIndex;
      var cuisine = cSelect[cIndex].value;
      var neighborhood = nSelect[nIndex].value;
      DBHelper.fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, function (error, restaurants) {
        if (error) {
          // Got an error!
          console.error(error);
        } else {
          _this3.resetRestaurants(restaurants);

          _this3.fillRestaurantsHTML();
        }
      });
    }
    /**
     * Clear current restaurants, their HTML and remove their map markers.
     */

  }, {
    key: "resetRestaurants",
    value: function resetRestaurants(restaurants) {
      // Remove all restaurants
      this.restaurants = [];
      var ul = document.getElementById('restaurants-list');
      ul.innerHTML = ''; // Remove all map markers

      if (this.markers) {
        this.markers.forEach(function (marker) {
          return marker.remove();
        });
      }

      this.markers = [];
      this.restaurants = restaurants;
    }
    /**
    /**
     * Create all restaurants HTML and add them to the webpage.
     */

  }, {
    key: "fillRestaurantsHTML",
    value: function fillRestaurantsHTML() {
      var _this4 = this;

      var ul = document.getElementById('restaurants-list');
      this.restaurants.forEach(function (restaurant) {
        ul.append(_this4.createRestaurantHTML(restaurant));
      });
      this.addMarkersToMap();
    }
    /**
     * Create restaurant HTML.
     */

  }, {
    key: "createRestaurantHTML",
    value: function createRestaurantHTML(restaurant) {
      var li = document.createElement('li');
      li.className = 'restaurant-item';
      /* image sizes to use in srcset */

      var imgSizes = ['300', '400', '600', '800'];
      /* image size to use as fallback in src */

      var defaultSize = '400';
      var image = document.createElement('img');
      image.className = 'restaurant-img';
      image.src = DBHelper.imageUrlForRestaurant(restaurant.photograph, defaultSize);
      image.srcset = DBHelper.imageSrcsetForRestaurant(restaurant.photograph, imgSizes);
      image.sizes = "(min-width: 416px) and (max-width: 632px) 400px,\n                  (min-width: 1248px) 400px,\n                  300px";
      image.alt = "This is an image of the ".concat(restaurant.name, " restaurant");
      li.append(image);
      var info = document.createElement('div');
      info.className = 'restaurant-info';
      li.append(info);
      var name = document.createElement('h1');
      name.innerHTML = restaurant.name;
      info.append(name);
      var neighborhood = document.createElement('p');
      neighborhood.innerHTML = restaurant.neighborhood;
      info.append(neighborhood);
      var address = document.createElement('p');
      address.innerHTML = restaurant.address;
      info.append(address);
      var more = document.createElement('a');
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

  }, {
    key: "initMap",
    value: function initMap(mapboxToken) {
      this.newMap = L.map('map', {
        center: [40.722216, -73.987501],
        zoom: 12,
        scrollWheelZoom: false
      });
      L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.jpg70?access_token={mapboxToken}', {
        mapboxToken: mapboxToken,
        maxZoom: 18,
        attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' + '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' + 'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
        id: 'mapbox.streets'
      }).addTo(this.newMap);
      this.updateRestaurants();
    }
    /**
     * Add markers for current restaurants to the map.
     */

  }, {
    key: "addMarkersToMap",
    value: function addMarkersToMap() {
      var _this5 = this;

      this.restaurants.forEach(function (restaurant) {
        // Add marker to the map
        var marker = DBHelper.mapMarkerForRestaurant(restaurant, _this5.newMap);
        marker.on('click', onClick);

        function onClick() {
          window.location.href = marker.options.url;
        }

        _this5.markers.push(marker);
      });
    }
    /**********************
        Initialization
    **********************/

  }, {
    key: "init",
    value: function init() {
      var _this6 = this;

      /**
       * Fetch neighborhoods and cuisines as soon as the page is loaded.
       */
      document.addEventListener('DOMContentLoaded', function () {
        DBHelper.fetchMAPBOXToken().then(function (mapboxToken) {
          _this6.initMap(mapboxToken); // added

        });

        _this6.fetchNeighborhoods();

        _this6.fetchCuisines();
        /* listen for select elements and update Restaurants */


        document.querySelector('.filter-options').addEventListener('change', function (e) {
          if (e.target.id.includes('-select')) {
            _this6.updateRestaurants();

            e.stopPropagation();
          }
        });
      });
    }
  }]);

  return MainPage;
}();

(function () {
  var main = new MainPage();
  main.init();
})();
/*==================Focus==================*/
// function handleRestoFocus(viewDetailsButton){
//   viewDetailsButton.addEventListener('focus', function(e){
//     console.log(e.target);
//   });
// }
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImRiaGVscGVyLmpzIiwibWFpbi5qcyJdLCJuYW1lcyI6WyJCQVNFX1VSTCIsImxvY2F0aW9uIiwib3JpZ2luIiwiaW5jbHVkZXMiLCJEQkhlbHBlciIsImZldGNoIiwiREFUQUJBU0VfVVJMIiwidGhlbiIsInJlcyIsImpzb24iLCJkYXRhIiwiTUFQQk9YX1RPS0VOIiwiY2F0Y2giLCJlcnIiLCJjb25zb2xlIiwibG9nIiwiY2FsbGJhY2siLCJ4aHIiLCJYTUxIdHRwUmVxdWVzdCIsIm9wZW4iLCJvbmxvYWQiLCJzdGF0dXMiLCJKU09OIiwicGFyc2UiLCJyZXNwb25zZVRleHQiLCJyZXN0YXVyYW50cyIsImVycm9yIiwic2VuZCIsImlkIiwiZmV0Y2hSZXN0YXVyYW50cyIsInJlc3RhdXJhbnQiLCJmaW5kIiwiciIsImN1aXNpbmUiLCJyZXN1bHRzIiwiZmlsdGVyIiwiY3Vpc2luZV90eXBlIiwibmVpZ2hib3Job29kIiwibmVpZ2hib3Job29kcyIsIm1hcCIsInYiLCJpIiwidW5pcXVlTmVpZ2hib3Job29kcyIsImluZGV4T2YiLCJjdWlzaW5lcyIsInVuaXF1ZUN1aXNpbmVzIiwicGhvdG9ncmFwaCIsInNpemUiLCJzaXplcyIsImltZ1BhdGhzIiwiZm9yRWFjaCIsInB1c2giLCJqb2luIiwibWFya2VyIiwiTCIsImxhdGxuZyIsImxhdCIsImxuZyIsInRpdGxlIiwibmFtZSIsImFsdCIsInVybCIsInVybEZvclJlc3RhdXJhbnQiLCJhZGRUbyIsIm5hdmlnYXRvciIsIndpbmRvdyIsImFkZEV2ZW50TGlzdGVuZXIiLCJzZXJ2aWNlV29ya2VyIiwicmVnaXN0ZXIiLCJNYWluUGFnZSIsIm1hcmtlcnMiLCJmZXRjaE5laWdoYm9yaG9vZHMiLCJmaWxsTmVpZ2hib3Job29kc0hUTUwiLCJmZXRjaEN1aXNpbmVzIiwiZmlsbEN1aXNpbmVzSFRNTCIsInNlbGVjdCIsImRvY3VtZW50IiwiZ2V0RWxlbWVudEJ5SWQiLCJvcHRpb24iLCJjcmVhdGVFbGVtZW50IiwiaW5uZXJIVE1MIiwidmFsdWUiLCJhcHBlbmQiLCJjU2VsZWN0IiwiblNlbGVjdCIsImNJbmRleCIsInNlbGVjdGVkSW5kZXgiLCJuSW5kZXgiLCJmZXRjaFJlc3RhdXJhbnRCeUN1aXNpbmVBbmROZWlnaGJvcmhvb2QiLCJyZXNldFJlc3RhdXJhbnRzIiwiZmlsbFJlc3RhdXJhbnRzSFRNTCIsInVsIiwicmVtb3ZlIiwiY3JlYXRlUmVzdGF1cmFudEhUTUwiLCJhZGRNYXJrZXJzVG9NYXAiLCJsaSIsImNsYXNzTmFtZSIsImltZ1NpemVzIiwiZGVmYXVsdFNpemUiLCJpbWFnZSIsInNyYyIsImltYWdlVXJsRm9yUmVzdGF1cmFudCIsInNyY3NldCIsImltYWdlU3Jjc2V0Rm9yUmVzdGF1cmFudCIsImluZm8iLCJhZGRyZXNzIiwibW9yZSIsImhyZWYiLCJzZXRBdHRyaWJ1dGUiLCJtYXBib3hUb2tlbiIsIm5ld01hcCIsImNlbnRlciIsInpvb20iLCJzY3JvbGxXaGVlbFpvb20iLCJ0aWxlTGF5ZXIiLCJtYXhab29tIiwiYXR0cmlidXRpb24iLCJ1cGRhdGVSZXN0YXVyYW50cyIsIm1hcE1hcmtlckZvclJlc3RhdXJhbnQiLCJvbiIsIm9uQ2xpY2siLCJvcHRpb25zIiwiZmV0Y2hNQVBCT1hUb2tlbiIsImluaXRNYXAiLCJxdWVyeVNlbGVjdG9yIiwiZSIsInRhcmdldCIsInN0b3BQcm9wYWdhdGlvbiIsIm1haW4iLCJpbml0Il0sIm1hcHBpbmdzIjoiOzs7Ozs7OztBQUFBOztBQUVBOzs7O0FBSUEsSUFBTUEsUUFBUSxHQUFJLFlBQU07QUFDdEIsTUFBR0MsUUFBUSxDQUFDQyxNQUFULENBQWdCQyxRQUFoQixDQUF5QixtQkFBekIsQ0FBSCxFQUFrRDtBQUNoRCxXQUFPRixRQUFRLENBQUNDLE1BQWhCO0FBQ0Q7O0FBQ0QsbUJBQVVELFFBQVEsQ0FBQ0MsTUFBbkI7QUFDRCxDQUxnQixFQUFqQjtBQU9BOzs7OztJQUdNRSxROzs7Ozs7Ozs7O0FBRUo7Ozs7dUNBSTBCO0FBQ3hCLGFBQU9DLEtB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OztBQUdBLFFBQUEsTUFBSSxDQUFDdEMsa0JBQUw7O0FBQ0EsUUFBQSxNQUFJLENBQUNFLGFBQUw7QUFFQTs7O0FBQ0FHLFFBQUFBLFFBQVEsQ0FBQ2dELGFBQVQsQ0FBdUIsaUJBQXZCLEVBQTBDMUQsZ0JBQTFDLENBQTJELFFBQTNELEVBQW9FLFVBQUMyRCxDQUFELEVBQU87QUFDekUsY0FBR0EsQ0FBQyxDQUFDQyxNQUFGLENBQVNsRyxFQUFULENBQVl6QixRQUFaLENBQXFCLFNBQXJCLENBQUgsRUFBb0M7QUFDbEMsWUFBQSxNQUFJLENBQUNrSCxpQkFBTDs7QUFDQVEsWUFBQUEsQ0FBQyxDQUFDRSxlQUFGO0FBQ0Q7QUFDRixTQUxEO0FBT0QsT0FmRDtBQWdCRDs7Ozs7O0FBR0gsQ0FBQyxZQUFNO0FBQ0wsTUFBTUMsSUFBSSxHQUFHLElBQUkzRCxRQUFKLEVBQWI7QUFDQTJELEVBQUFBLElBQUksQ0FBQ0MsSUFBTDtBQUNELENBSEQ7QUFLQTtBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qZXNsaW50IG5vLXVudXNlZC12YXJzOiBbXCJlcnJvclwiLCB7IFwidmFyc0lnbm9yZVBhdHRlcm5cIjogXCJEQkhlbHBlclwiIH1dKi9cclxuXHJcbi8qXHJcbiBDaGFuZ2UgdGhpcyB0byB5b3VyIGJhc2UgdXJsIGluIGxvY2FsIGVudlxyXG4gdGhhdCB3b3VsZCBiZSAnaHR0cDovL2xvY2FsaG9zdDpwb3J0J1xyXG4qL1xyXG5jb25zdCBCQVNFX1VSTCA9ICgoKSA9PiB7XHJcbiAgaWYobG9jYXRpb24ub3JpZ2luLmluY2x1ZGVzKCdodHRwOi8vbG9jYWxob3N0OicpKSB7XHJcbiAgICByZXR1cm4gbG9jYXRpb24ub3JpZ2luO1xyXG4gIH1cclxuICByZXR1cm4gYCR7bG9jYXRpb24ub3JpZ2lufS9td3MtcmVzdGF1cmFudC1zdGFnZS0xYDtcclxufSkoKTtcclxuXHJcbi8qKlxyXG4gKiBDb21tb24gZGF0YWJhc2UgaGVscGVyIGZ1bmN0aW9ucy5cclxuICovXHJcbmNsYXNzIERCSGVscGVyIHtcclxuXHJcbiAgLyoqXHJcbiAgICogRmV0Y2ggTUFQQk9YIFRva2VuIGZyb20gREIgaW5zdGVhZCBvZiBpbmNsdWRpbmdcclxuICAgKiBpdCBpbiB0aGUgc2NyaXB0XHJcbiAgICovXHJcbiAgc3RhdGljIGZldGNoTUFQQk9YVG9rZW4oKSB7XHJcbiAgICByZXR1cm4gZmV0Y2goREJIZWxwZXIuREFUQUJBU0VfVVJMKVxyXG4gICAgICAudGhlbihyZXMgPT4gcmVzLmpzb24oKSlcclxuICAgICAgLnRoZW4oZGF0YSA9PiBkYXRhLk1BUEJPWF9UT0tFTilcclxuICAgICAgLmNhdGNoKGVyciA9PiB7XHJcbiAgICAgICAgY29uc29sZS5sb2coZXJyKTtcclxuICAgICAgfSk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBEYXRhYmFzZSBVUkwuXHJcbiAgICogQ2hhbmdlIHRoaXMgdG8gcmVzdGF1cmFudHMuanNvbiBmaWxlIGxvY2F0aW9uIG9uIHlvdXIgc2VydmVyLlxyXG4gICAqL1xyXG4gIHN0YXRpYyBnZXQgREFUQUJBU0VfVVJMKCkge1xyXG4gICAgcmV0dXJuIGAke0JBU0VfVVJMfS9idWlsZC9kYXRhL3Jlc3RhdXJhbnRzLmpzb25gO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogRmV0Y2ggYWxsIHJlc3RhdXJhbnRzLlxyXG4gICAqL1xyXG4gIHN0YXRpYyBmZXRjaFJlc3RhdXJhbnRzKGNhbGxiYWNrKSB7XHJcbiAgICBsZXQgeGhyID0gbmV3IFhNTEh0dHBSZXF1ZXN0KCk7XHJcbiAgICB4aHIub3BlbignR0VUJywgREJIZWxwZXIuREFUQUJBU0VfVVJMKTtcclxuICAgIHhoci5vbmxvYWQgPSAoKSA9PiB7XHJcbiAgICAgIGlmICh4aHIuc3RhdHVzID09PSAyMDApIHsgLy8gR290IGEgc3VjY2VzcyByZXNwb25zZSBmcm9tIHNlcnZlciFcclxuICAgICAgICBjb25zdCBqc29uID0gSlNPTi5wYXJzZSh4aHIucmVzcG9uc2VUZXh0KTtcclxuICAgICAgICBjb25zdCByZXN0YXVyYW50cyA9IGpzb24ucmVzdGF1cmFudHM7XHJcbiAgICAgICAgY2FsbGJhY2sobnVsbCwgcmVzdGF1cmFudHMpO1xyXG4gICAgICB9IGVsc2UgeyAvLyBPb3BzIS4gR290IGFuIGVycm9yIGZyb20gc2VydmVyLlxyXG4gICAgICAgIGNvbnN0IGVycm9yID0gKGBSZXF1ZXN0IGZhaWxlZC4gUmV0dXJuZWQgc3RhdHVzIG9mICR7eGhyLnN0YXR1c31gKTtcclxuICAgICAgICBjYWxsYmFjayhlcnJvciwgbnVsbCk7XHJcbiAgICAgIH1cclxuICAgIH07XHJcbiAgICB4aHIuc2VuZCgpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogRmV0Y2ggYSByZXN0YXVyYW50IGJ5IGl0cyBJRC5cclxuICAgKi9cclxuICBzdGF0aWMgZmV0Y2hSZXN0YXVyYW50QnlJZChpZCwgY2FsbGJhY2spIHtcclxuICAgIC8vIGZldGNoIGFsbCByZXN0YXVyYW50cyB3aXRoIHByb3BlciBlcnJvciBoYW5kbGluZy5cclxuICAgIERCSGVscGVyLmZldGNoUmVzdGF1cmFudHMoKGVycm9yLCByZXN0YXVyYW50cykgPT4ge1xyXG4gICAgICBpZiAoZXJyb3IpIHtcclxuICAgICAgICBjYWxsYmFjayhlcnJvciwgbnVsbCk7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgY29uc3QgcmVzdGF1cmFudCA9IHJlc3RhdXJhbnRzLmZpbmQociA9PiByLmlkID09IGlkKTtcclxuICAgICAgICBpZiAocmVzdGF1cmFudCkgeyAvLyBHb3QgdGhlIHJlc3RhdXJhbnRcclxuICAgICAgICAgIGNhbGxiYWNrKG51bGwsIHJlc3RhdXJhbnQpO1xyXG4gICAgICAgIH0gZWxzZSB7IC8vIFJlc3RhdXJhbnQgZG9lcyBub3QgZXhpc3QgaW4gdGhlIGRhdGFiYXNlXHJcbiAgICAgICAgICBjYWxsYmFjaygnUmVzdGF1cmFudCBkb2VzIG5vdCBleGlzdCcsIG51bGwpO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfSk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBGZXRjaCByZXN0YXVyYW50cyBieSBhIGN1aXNpbmUgdHlwZSB3aXRoIHByb3BlciBlcnJvciBoYW5kbGluZy5cclxuICAgKi9cclxuICBzdGF0aWMgZmV0Y2hSZXN0YXVyYW50QnlDdWlzaW5lKGN1aXNpbmUsIGNhbGxiYWNrKSB7XHJcbiAgICAvLyBGZXRjaCBhbGwgcmVzdGF1cmFudHMgIHdpdGggcHJvcGVyIGVycm9yIGhhbmRsaW5nXHJcbiAgICBEQkhlbHBlci5mZXRjaFJlc3RhdXJhbnRzKChlcnJvciwgcmVzdGF1cmFudHMpID0+IHtcclxuICAgICAgaWYgKGVycm9yKSB7XHJcbiAgICAgICAgY2FsbGJhY2soZXJyb3IsIG51bGwpO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIC8vIEZpbHRlciByZXN0YXVyYW50cyB0byBoYXZlIG9ubHkgZ2l2ZW4gY3Vpc2luZSB0eXBlXHJcbiAgICAgICAgY29uc3QgcmVzdWx0cyA9IHJlc3RhdXJhbnRzLmZpbHRlcihyID0+IHIuY3Vpc2luZV90eXBlID09IGN1aXNpbmUpO1xyXG4gICAgICAgIGNhbGxiYWNrKG51bGwsIHJlc3VsdHMpO1xyXG4gICAgICB9XHJcbiAgICB9KTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEZldGNoIHJlc3RhdXJhbnRzIGJ5IGEgbmVpZ2hib3Job29kIHdpdGggcHJvcGVyIGVycm9yIGhhbmRsaW5nLlxyXG4gICAqL1xyXG4gIHN0YXRpYyBmZXRjaFJlc3RhdXJhbnRCeU5laWdoYm9yaG9vZChuZWlnaGJvcmhvb2QsIGNhbGxiYWNrKSB7XHJcbiAgICAvLyBGZXRjaCBhbGwgcmVzdGF1cmFudHNcclxuICAgIERCSGVscGVyLmZldGNoUmVzdGF1cmFudHMoKGVycm9yLCByZXN0YXVyYW50cykgPT4ge1xyXG4gICAgICBpZiAoZXJyb3IpIHtcclxuICAgICAgICBjYWxsYmFjayhlcnJvciwgbnVsbCk7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgLy8gRmlsdGVyIHJlc3RhdXJhbnRzIHRvIGhhdmUgb25seSBnaXZlbiBuZWlnaGJvcmhvb2RcclxuICAgICAgICBjb25zdCByZXN1bHRzID0gcmVzdGF1cmFudHMuZmlsdGVyKHIgPT4gci5uZWlnaGJvcmhvb2QgPT0gbmVpZ2hib3Job29kKTtcclxuICAgICAgICBjYWxsYmFjayhudWxsLCByZXN1bHRzKTtcclxuICAgICAgfVxyXG4gICAgfSk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBGZXRjaCByZXN0YXVyYW50cyBieSBhIGN1aXNpbmUgYW5kIGEgbmVpZ2hib3Job29kIHdpdGggcHJvcGVyIGVycm9yIGhhbmRsaW5nLlxyXG4gICAqL1xyXG4gIHN0YXRpYyBmZXRjaFJlc3RhdXJhbnRCeUN1aXNpbmVBbmROZWlnaGJvcmhvb2QoY3Vpc2luZSwgbmVpZ2hib3Job29kLCBjYWxsYmFjaykge1xyXG4gICAgLy8gRmV0Y2ggYWxsIHJlc3RhdXJhbnRzXHJcbiAgICBEQkhlbHBlci5mZXRjaFJlc3RhdXJhbnRzKChlcnJvciwgcmVzdGF1cmFudHMpID0+IHtcclxuICAgICAgaWYgKGVycm9yKSB7XHJcbiAgICAgICAgY2FsbGJhY2soZXJyb3IsIG51bGwpO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIGxldCByZXN1bHRzID0gcmVzdGF1cmFudHM7XHJcbiAgICAgICAgaWYgKGN1aXNpbmUgIT0gJ2FsbCcpIHsgLy8gZmlsdGVyIGJ5IGN1aXNpbmVcclxuICAgICAgICAgIHJlc3VsdHMgPSByZXN1bHRzLmZpbHRlcihyID0+IHIuY3Vpc2luZV90eXBlID09IGN1aXNpbmUpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAobmVpZ2hib3Job29kICE9ICdhbGwnKSB7IC8vIGZpbHRlciBieSBuZWlnaGJvcmhvb2RcclxuICAgICAgICAgIHJlc3VsdHMgPSByZXN1bHRzLmZpbHRlcihyID0+IHIubmVpZ2hib3Job29kID09IG5laWdoYm9yaG9vZCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNhbGxiYWNrKG51bGwsIHJlc3VsdHMpO1xyXG4gICAgICB9XHJcbiAgICB9KTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEZldGNoIGFsbCBuZWlnaGJvcmhvb2RzIHdpdGggcHJvcGVyIGVycm9yIGhhbmRsaW5nLlxyXG4gICAqL1xyXG4gIHN0YXRpYyBmZXRjaE5laWdoYm9yaG9vZHMoY2FsbGJhY2spIHtcclxuICAgIC8vIEZldGNoIGFsbCByZXN0YXVyYW50c1xyXG4gICAgREJIZWxwZXIuZmV0Y2hSZXN0YXVyYW50cygoZXJyb3IsIHJlc3RhdXJhbnRzKSA9PiB7XHJcbiAgICAgIGlmIChlcnJvcikge1xyXG4gICAgICAgIGNhbGxiYWNrKGVycm9yLCBudWxsKTtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICAvLyBHZXQgYWxsIG5laWdoYm9yaG9vZHMgZnJvbSBhbGwgcmVzdGF1cmFudHNcclxuICAgICAgICBjb25zdCBuZWlnaGJvcmhvb2RzID0gcmVzdGF1cmFudHMubWFwKCh2LCBpKSA9PiByZXN0YXVyYW50c1tpXS5uZWlnaGJvcmhvb2QpO1xyXG4gICAgICAgIC8vIFJlbW92ZSBkdXBsaWNhdGVzIGZyb20gbmVpZ2hib3Job29kc1xyXG4gICAgICAgIGNvbnN0IHVuaXF1ZU5laWdoYm9yaG9vZHMgPSBuZWlnaGJvcmhvb2RzLmZpbHRlcigodiwgaSkgPT4gbmVpZ2hib3Job29kcy5pbmRleE9mKHYpID09IGkpO1xyXG4gICAgICAgIGNhbGxiYWNrKG51bGwsIHVuaXF1ZU5laWdoYm9yaG9vZHMpO1xyXG4gICAgICB9XHJcbiAgICB9KTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEZldGNoIGFsbCBjdWlzaW5lcyB3aXRoIHByb3BlciBlcnJvciBoYW5kbGluZy5cclxuICAgKi9cclxuICBzdGF0aWMgZmV0Y2hDdWlzaW5lcyhjYWxsYmFjaykge1xyXG4gICAgLy8gRmV0Y2ggYWxsIHJlc3RhdXJhbnRzXHJcbiAgICBEQkhlbHBlci5mZXRjaFJlc3RhdXJhbnRzKChlcnJvciwgcmVzdGF1cmFudHMpID0+IHtcclxuICAgICAgaWYgKGVycm9yKSB7XHJcbiAgICAgICAgY2FsbGJhY2soZXJyb3IsIG51bGwpO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIC8vIEdldCBhbGwgY3Vpc2luZXMgZnJvbSBhbGwgcmVzdGF1cmFudHNcclxuICAgICAgICBjb25zdCBjdWlzaW5lcyA9IHJlc3RhdXJhbnRzLm1hcCgodiwgaSkgPT4gcmVzdGF1cmFudHNbaV0uY3Vpc2luZV90eXBlKTtcclxuICAgICAgICAvLyBSZW1vdmUgZHVwbGljYXRlcyBmcm9tIGN1aXNpbmVzXHJcbiAgICAgICAgY29uc3QgdW5pcXVlQ3Vpc2luZXMgPSBjdWlzaW5lcy5maWx0ZXIoKHYsIGkpID0+IGN1aXNpbmVzLmluZGV4T2YodikgPT0gaSk7XHJcbiAgICAgICAgY2FsbGJhY2sobnVsbCwgdW5pcXVlQ3Vpc2luZXMpO1xyXG4gICAgICB9XHJcbiAgICB9KTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJlc3RhdXJhbnQgcGFnZSBVUkwuXHJcbiAgICovXHJcbiAgc3RhdGljIHVybEZvclJlc3RhdXJhbnQocmVzdGF1cmFudCkge1xyXG4gICAgcmV0dXJuIChgJHtCQVNFX1VSTH0vcmVzdGF1cmFudC5odG1sP2lkPSR7cmVzdGF1cmFudC5pZH1gKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJlc3RhdXJhbnQgaW1hZ2UgVVJMLlxyXG4gICAqL1xyXG4gIHN0YXRpYyBpbWFnZVVybEZvclJlc3RhdXJhbnQocGhvdG9ncmFwaCwgc2l6ZSkge1xyXG4gICAgcmV0dXJuIChcclxuICAgICAgYCR7QkFTRV9VUkx9L2J1aWxkL2ltZy8ke3Bob3RvZ3JhcGh9LSR7c2l6ZX13LmpwZ2BcclxuICAgICk7XHJcbiAgfVxyXG5cclxuICBzdGF0aWMgaW1hZ2VTcmNzZXRGb3JSZXN0YXVyYW50KHBob3RvZ3JhcGgsIHNpemVzPVtdKXtcclxuICAgIGNvbnN0IGltZ1BhdGhzID0gW107XHJcbiAgICBzaXplcy5mb3JFYWNoKHNpemUgPT4ge1xyXG4gICAgICBpbWdQYXRocy5wdXNoKFxyXG4gICAgICAgIGAke0JBU0VfVVJMfS9idWlsZC9pbWcvJHtwaG90b2dyYXBofS0ke3NpemV9dy5qcGcgJHtzaXplfXdgXHJcbiAgICAgICk7XHJcbiAgICB9KTtcclxuICAgIHJldHVybiBpbWdQYXRocy5qb2luKCcsICcpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogTWFwIG1hcmtlciBmb3IgYSByZXN0YXVyYW50LlxyXG4gICAqL1xyXG4gIHN0YXRpYyBtYXBNYXJrZXJGb3JSZXN0YXVyYW50KHJlc3RhdXJhbnQsIG1hcCkge1xyXG4gICAgLy8gaHR0cHM6Ly9sZWFmbGV0anMuY29tL3JlZmVyZW5jZS0xLjMuMC5odG1sI21hcmtlclxyXG4gICAgY29uc3QgbWFya2VyID0gbmV3IEwubWFya2VyKFtyZXN0YXVyYW50LmxhdGxuZy5sYXQsIHJlc3RhdXJhbnQubGF0bG5nLmxuZ10sXHJcbiAgICAgIHtcclxuICAgICAgICB0aXRsZTogcmVzdGF1cmFudC5uYW1lLFxyXG4gICAgICAgIGFsdDogcmVzdGF1cmFudC5uYW1lLFxyXG4gICAgICAgIHVybDogREJIZWxwZXIudXJsRm9yUmVzdGF1cmFudChyZXN0YXVyYW50KVxyXG4gICAgICB9KTtcclxuICAgIG1hcmtlci5hZGRUbyhtYXApO1xyXG4gICAgcmV0dXJuIG1hcmtlcjtcclxuICB9XHJcblxyXG4gIC8qICA9PT09PT09PT09PT09PSBTZXJ2aWNlIFdvcmtlciBSZWdpc3RyYXRpb24gPT09PT09PT09PT09PT0gKi9cclxuICBzdGF0aWMgcmVnaXN0ZXJTZXJ2aWNlV29ya2VyKCkge1xyXG5cclxuICAgIC8qIG1ha2luZyBzdXJlIGJyb3dzZXIgc3VwcG9ydHMgc2VydmljZSB3b3JrZXIgKi9cclxuICAgIGlmICgnc2VydmljZVdvcmtlcicgaW4gbmF2aWdhdG9yKSB7XHJcblxyXG4gICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignbG9hZCcsICgpID0+IHtcclxuICAgICAgICBuYXZpZ2F0b3Iuc2VydmljZVdvcmtlci5yZWdpc3RlcignLi9zdy5qcycpXHJcbiAgICAgICAgICAudGhlbigoKSA9PiB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdSZWdpc3RlcmluZyBzZXJ2aWNlIHdvcmtlcicpO1xyXG4gICAgICAgICAgfSlcclxuICAgICAgICAgIC5jYXRjaCgoKSA9PiB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdTZXJ2aWNlIFdvcmtlciByZWdpc3RyYXRpb24gZmFpbGVkJyk7XHJcbiAgICAgICAgICB9KTtcclxuICAgICAgfSk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxufSIsIlxyXG5jbGFzcyBNYWluUGFnZSB7XHJcbiAgY29uc3RydWN0b3IoKSB7XHJcbiAgICB0aGlzLm5laWdoYm9yaG9vZHMgPSBbXTtcclxuICAgIHRoaXMuY3Vpc2luZXMgPSBbXTtcclxuICAgIHRoaXMubWFya2VycyA9IFtdO1xyXG4gIH1cclxuXHJcbiAgLyoqKioqKioqKioqKioqKioqKioqKipcclxuICAgICAgICBEYXRhIEZldGNoXHJcbiAgKioqKioqKioqKioqKioqKioqKioqKi9cclxuXHJcbiAgLyoqXHJcbiAgICogRmV0Y2ggYWxsIG5laWdoYm9yaG9vZHMgYW5kIHNldCB0aGVpciBIVE1MLlxyXG4gICAqL1xyXG4gIGZldGNoTmVpZ2hib3Job29kcygpIHtcclxuICAgIERCSGVscGVyLmZldGNoTmVpZ2hib3Job29kcygoZXJyb3IsIG5laWdoYm9yaG9vZHMpID0+IHtcclxuICAgICAgaWYgKGVycm9yKSB7IC8vIEdvdCBhbiBlcnJvclxyXG4gICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyb3IpO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIHRoaXMubmVpZ2hib3Job29kcyA9IG5laWdoYm9yaG9vZHM7XHJcbiAgICAgICAgdGhpcy5maWxsTmVpZ2hib3Job29kc0hUTUwoKTtcclxuICAgICAgfVxyXG4gICAgfSk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBGZXRjaCBhbGwgY3Vpc2luZXMgYW5kIHNldCB0aGVpciBIVE1MLlxyXG4gICAqL1xyXG4gIGZldGNoQ3Vpc2luZXMoKSB7XHJcbiAgICBEQkhlbHBlci5mZXRjaEN1aXNpbmVzKChlcnJvciwgY3Vpc2luZXMpID0+IHtcclxuICAgICAgaWYgKGVycm9yKSB7IC8vIEdvdCBhbiBlcnJvciFcclxuICAgICAgICBjb25zb2xlLmVycm9yKGVycm9yKTtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICB0aGlzLmN1aXNpbmVzID0gY3Vpc2luZXM7XHJcbiAgICAgICAgdGhpcy5maWxsQ3Vpc2luZXNIVE1MKCk7XHJcbiAgICAgIH1cclxuICAgIH0pO1xyXG4gIH1cclxuXHJcbiAgLyoqKioqKioqKioqKioqKioqKioqKipcclxuICAgICAgICBEYXRhIGluIFVJXHJcbiAgKioqKioqKioqKioqKioqKioqKioqKi9cclxuXHJcbiAgLyoqXHJcbiAgICogU2V0IG5laWdoYm9yaG9vZHMgSFRNTC5cclxuICAgKi9cclxuICBmaWxsTmVpZ2hib3Job29kc0hUTUwoKSB7XHJcbiAgICBjb25zdCBzZWxlY3QgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbmVpZ2hib3Job29kcy1zZWxlY3QnKTtcclxuICAgIHRoaXMubmVpZ2hib3Job29kcy5mb3JFYWNoKG5laWdoYm9yaG9vZCA9PiB7XHJcbiAgICAgIGNvbnN0IG9wdGlvbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ29wdGlvbicpO1xyXG4gICAgICBvcHRpb24uaW5uZXJIVE1MID0gbmVpZ2hib3Job29kO1xyXG4gICAgICBvcHRpb24udmFsdWUgPSBuZWlnaGJvcmhvb2Q7XHJcbiAgICAgIHNlbGVjdC5hcHBlbmQob3B0aW9uKTtcclxuICAgIH0pO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2V0IGN1aXNpbmVzIEhUTUwuXHJcbiAgICovXHJcbiAgZmlsbEN1aXNpbmVzSFRNTCgpIHtcclxuICAgIGNvbnN0IHNlbGVjdCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdjdWlzaW5lcy1zZWxlY3QnKTtcclxuXHJcbiAgICB0aGlzLmN1aXNpbmVzLmZvckVhY2goY3Vpc2luZSA9PiB7XHJcbiAgICAgIGNvbnN0IG9wdGlvbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ29wdGlvbicpO1xyXG4gICAgICBvcHRpb24uaW5uZXJIVE1MID0gY3Vpc2luZTtcclxuICAgICAgb3B0aW9uLnZhbHVlID0gY3Vpc2luZTtcclxuICAgICAgc2VsZWN0LmFwcGVuZChvcHRpb24pO1xyXG4gICAgfSk7XHJcbiAgfVxyXG5cclxuXHJcbiAgLyoqXHJcbiAgICogVXBkYXRlIHBhZ2UgYW5kIG1hcCBmb3IgY3VycmVudCByZXN0YXVyYW50cy5cclxuICAgKi9cclxuICB1cGRhdGVSZXN0YXVyYW50cygpIHtcclxuICAgIGNvbnN0IGNTZWxlY3QgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnY3Vpc2luZXMtc2VsZWN0Jyk7XHJcbiAgICBjb25zdCBuU2VsZWN0ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ25laWdoYm9yaG9vZHMtc2VsZWN0Jyk7XHJcblxyXG4gICAgY29uc3QgY0luZGV4ID0gY1NlbGVjdC5zZWxlY3RlZEluZGV4O1xyXG4gICAgY29uc3QgbkluZGV4ID0gblNlbGVjdC5zZWxlY3RlZEluZGV4O1xyXG5cclxuICAgIGNvbnN0IGN1aXNpbmUgPSBjU2VsZWN0W2NJbmRleF0udmFsdWU7XHJcbiAgICBjb25zdCBuZWlnaGJvcmhvb2QgPSBuU2VsZWN0W25JbmRleF0udmFsdWU7XHJcblxyXG4gICAgREJIZWxwZXIuZmV0Y2hSZXN0YXVyYW50QnlDdWlzaW5lQW5kTmVpZ2hib3Job29kKGN1aXNpbmUsIG5laWdoYm9yaG9vZCwgKGVycm9yLCByZXN0YXVyYW50cykgPT4ge1xyXG4gICAgICBpZiAoZXJyb3IpIHsgLy8gR290IGFuIGVycm9yIVxyXG4gICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyb3IpO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIHRoaXMucmVzZXRSZXN0YXVyYW50cyhyZXN0YXVyYW50cyk7XHJcbiAgICAgICAgdGhpcy5maWxsUmVzdGF1cmFudHNIVE1MKCk7XHJcbiAgICAgIH1cclxuICAgIH0pO1xyXG4gIH1cclxuXHJcblxyXG4gIC8qKlxyXG4gICAqIENsZWFyIGN1cnJlbnQgcmVzdGF1cmFudHMsIHRoZWlyIEhUTUwgYW5kIHJlbW92ZSB0aGVpciBtYXAgbWFya2Vycy5cclxuICAgKi9cclxuICByZXNldFJlc3RhdXJhbnRzKHJlc3RhdXJhbnRzKSB7XHJcbiAgICAvLyBSZW1vdmUgYWxsIHJlc3RhdXJhbnRzXHJcbiAgICB0aGlzLnJlc3RhdXJhbnRzID0gW107XHJcbiAgICBjb25zdCB1bCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyZXN0YXVyYW50cy1saXN0Jyk7XHJcbiAgICB1bC5pbm5lckhUTUwgPSAnJztcclxuXHJcbiAgICAvLyBSZW1vdmUgYWxsIG1hcCBtYXJrZXJzXHJcbiAgICBpZiAodGhpcy5tYXJrZXJzKSB7XHJcbiAgICAgIHRoaXMubWFya2Vycy5mb3JFYWNoKG1hcmtlciA9PiBtYXJrZXIucmVtb3ZlKCkpO1xyXG4gICAgfVxyXG4gICAgdGhpcy5tYXJrZXJzID0gW107XHJcbiAgICB0aGlzLnJlc3RhdXJhbnRzID0gcmVzdGF1cmFudHM7XHJcbiAgfVxyXG5cclxuXHJcbiAgLyoqXHJcbiAgLyoqXHJcbiAgICogQ3JlYXRlIGFsbCByZXN0YXVyYW50cyBIVE1MIGFuZCBhZGQgdGhlbSB0byB0aGUgd2VicGFnZS5cclxuICAgKi9cclxuICBmaWxsUmVzdGF1cmFudHNIVE1MKCkge1xyXG4gICAgY29uc3QgdWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncmVzdGF1cmFudHMtbGlzdCcpO1xyXG4gICAgdGhpcy5yZXN0YXVyYW50cy5mb3JFYWNoKHJlc3RhdXJhbnQgPT4ge1xyXG4gICAgICB1bC5hcHBlbmQodGhpcy5jcmVhdGVSZXN0YXVyYW50SFRNTChyZXN0YXVyYW50KSk7XHJcbiAgICB9KTtcclxuICAgIHRoaXMuYWRkTWFya2Vyc1RvTWFwKCk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBDcmVhdGUgcmVzdGF1cmFudCBIVE1MLlxyXG4gICAqL1xyXG4gIGNyZWF0ZVJlc3RhdXJhbnRIVE1MKHJlc3RhdXJhbnQpIHtcclxuICAgIGNvbnN0IGxpID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnbGknKTtcclxuICAgIGxpLmNsYXNzTmFtZSA9ICdyZXN0YXVyYW50LWl0ZW0nO1xyXG5cclxuICAgIC8qIGltYWdlIHNpemVzIHRvIHVzZSBpbiBzcmNzZXQgKi9cclxuICAgIGNvbnN0IGltZ1NpemVzID0gWyczMDAnLCAnNDAwJywgJzYwMCcsICc4MDAnXTtcclxuICAgIC8qIGltYWdlIHNpemUgdG8gdXNlIGFzIGZhbGxiYWNrIGluIHNyYyAqL1xyXG4gICAgY29uc3QgZGVmYXVsdFNpemUgPSAnNDAwJztcclxuICAgIGNvbnN0IGltYWdlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaW1nJyk7XHJcbiAgICBpbWFnZS5jbGFzc05hbWUgPSAncmVzdGF1cmFudC1pbWcnO1xyXG4gICAgaW1hZ2Uuc3JjID0gREJIZWxwZXIuaW1hZ2VVcmxGb3JSZXN0YXVyYW50KFxyXG4gICAgICByZXN0YXVyYW50LnBob3RvZ3JhcGgsXHJcbiAgICAgIGRlZmF1bHRTaXplXHJcbiAgICApO1xyXG4gICAgaW1hZ2Uuc3Jjc2V0ID0gREJIZWxwZXIuaW1hZ2VTcmNzZXRGb3JSZXN0YXVyYW50KFxyXG4gICAgICByZXN0YXVyYW50LnBob3RvZ3JhcGgsXHJcbiAgICAgIGltZ1NpemVzXHJcbiAgICApO1xyXG4gICAgaW1hZ2Uuc2l6ZXMgPSBgKG1pbi13aWR0aDogNDE2cHgpIGFuZCAobWF4LXdpZHRoOiA2MzJweCkgNDAwcHgsXHJcbiAgICAgICAgICAgICAgICAgIChtaW4td2lkdGg6IDEyNDhweCkgNDAwcHgsXHJcbiAgICAgICAgICAgICAgICAgIDMwMHB4YDtcclxuICAgIGltYWdlLmFsdCA9IGBUaGlzIGlzIGFuIGltYWdlIG9mIHRoZSAke3Jlc3RhdXJhbnQubmFtZX0gcmVzdGF1cmFudGA7XHJcbiAgICBsaS5hcHBlbmQoaW1hZ2UpO1xyXG5cclxuICAgIGNvbnN0IGluZm8gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcclxuICAgIGluZm8uY2xhc3NOYW1lID0gJ3Jlc3RhdXJhbnQtaW5mbyc7XHJcbiAgICBsaS5hcHBlbmQoaW5mbyk7XHJcblxyXG4gICAgY29uc3QgbmFtZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2gxJyk7XHJcbiAgICBuYW1lLmlubmVySFRNTCA9IHJlc3RhdXJhbnQubmFtZTtcclxuICAgIGluZm8uYXBwZW5kKG5hbWUpO1xyXG5cclxuICAgIGNvbnN0IG5laWdoYm9yaG9vZCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3AnKTtcclxuICAgIG5laWdoYm9yaG9vZC5pbm5lckhUTUwgPSByZXN0YXVyYW50Lm5laWdoYm9yaG9vZDtcclxuICAgIGluZm8uYXBwZW5kKG5laWdoYm9yaG9vZCk7XHJcblxyXG4gICAgY29uc3QgYWRkcmVzcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3AnKTtcclxuICAgIGFkZHJlc3MuaW5uZXJIVE1MID0gcmVzdGF1cmFudC5hZGRyZXNzO1xyXG4gICAgaW5mby5hcHBlbmQoYWRkcmVzcyk7XHJcblxyXG4gICAgY29uc3QgbW9yZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2EnKTtcclxuICAgIG1vcmUuaW5uZXJIVE1MID0gJ1ZpZXcgRGV0YWlscyc7XHJcbiAgICBtb3JlLmhyZWYgPSBEQkhlbHBlci51cmxGb3JSZXN0YXVyYW50KHJlc3RhdXJhbnQpO1xyXG4gICAgbW9yZS5zZXRBdHRyaWJ1dGUoJ2FyaWEtbGFiZWwnLCByZXN0YXVyYW50Lm5hbWUpO1xyXG4gICAgaW5mby5hcHBlbmQobW9yZSk7XHJcblxyXG4gICAgcmV0dXJuIGxpO1xyXG4gIH1cclxuXHJcbiAgLyoqKioqKioqKioqKioqKioqKioqKipcclxuICAgICAgICAgIE1BUFxyXG4gICoqKioqKioqKioqKioqKioqKioqKiovXHJcbiAgLyoqXHJcbiAgICogSW5pdGlhbGl6ZSBsZWFmbGV0IG1hcCwgY2FsbGVkIGZyb20gSFRNTC5cclxuICAgKi9cclxuICBpbml0TWFwKG1hcGJveFRva2VuKSB7XHJcbiAgICB0aGlzLm5ld01hcCA9IEwubWFwKCdtYXAnLCB7XHJcbiAgICAgIGNlbnRlcjogWzQwLjcyMjIxNiwgLTczLjk4NzUwMV0sXHJcbiAgICAgIHpvb206IDEyLFxyXG4gICAgICBzY3JvbGxXaGVlbFpvb206IGZhbHNlXHJcbiAgICB9KTtcclxuICAgIEwudGlsZUxheWVyKCdodHRwczovL2FwaS50aWxlcy5tYXBib3guY29tL3Y0L3tpZH0ve3p9L3t4fS97eX0uanBnNzA/YWNjZXNzX3Rva2VuPXttYXBib3hUb2tlbn0nLCB7XHJcbiAgICAgIG1hcGJveFRva2VuLFxyXG4gICAgICBtYXhab29tOiAxOCxcclxuICAgICAgYXR0cmlidXRpb246ICdNYXAgZGF0YSAmY29weTsgPGEgaHJlZj1cImh0dHBzOi8vd3d3Lm9wZW5zdHJlZXRtYXAub3JnL1wiPk9wZW5TdHJlZXRNYXA8L2E+IGNvbnRyaWJ1dG9ycywgJyArXHJcbiAgICAgICAgJzxhIGhyZWY9XCJodHRwczovL2NyZWF0aXZlY29tbW9ucy5vcmcvbGljZW5zZXMvYnktc2EvMi4wL1wiPkNDLUJZLVNBPC9hPiwgJyArXHJcbiAgICAgICAgJ0ltYWdlcnkgwqkgPGEgaHJlZj1cImh0dHBzOi8vd3d3Lm1hcGJveC5jb20vXCI+TWFwYm94PC9hPicsXHJcbiAgICAgIGlkOiAnbWFwYm94LnN0cmVldHMnXHJcbiAgICB9KS5hZGRUbyh0aGlzLm5ld01hcCk7XHJcblxyXG4gICAgdGhpcy51cGRhdGVSZXN0YXVyYW50cygpO1xyXG4gIH1cclxuXHJcblxyXG4gIC8qKlxyXG4gICAqIEFkZCBtYXJrZXJzIGZvciBjdXJyZW50IHJlc3RhdXJhbnRzIHRvIHRoZSBtYXAuXHJcbiAgICovXHJcbiAgYWRkTWFya2Vyc1RvTWFwKCkge1xyXG4gICAgdGhpcy5yZXN0YXVyYW50cy5mb3JFYWNoKHJlc3RhdXJhbnQgPT4ge1xyXG4gICAgICAvLyBBZGQgbWFya2VyIHRvIHRoZSBtYXBcclxuICAgICAgY29uc3QgbWFya2VyID0gREJIZWxwZXIubWFwTWFya2VyRm9yUmVzdGF1cmFudChyZXN0YXVyYW50LCB0aGlzLm5ld01hcCk7XHJcbiAgICAgIG1hcmtlci5vbignY2xpY2snLCBvbkNsaWNrKTtcclxuICAgICAgZnVuY3Rpb24gb25DbGljaygpIHtcclxuICAgICAgICB3aW5kb3cubG9jYXRpb24uaHJlZiA9IG1hcmtlci5vcHRpb25zLnVybDtcclxuICAgICAgfVxyXG4gICAgICB0aGlzLm1hcmtlcnMucHVzaChtYXJrZXIpO1xyXG4gICAgfSk7XHJcbiAgfVxyXG5cclxuXHJcbiAgLyoqKioqKioqKioqKioqKioqKioqKipcclxuICAgICAgSW5pdGlhbGl6YXRpb25cclxuICAqKioqKioqKioqKioqKioqKioqKioqL1xyXG5cclxuXHJcbiAgaW5pdCgpIHtcclxuICAgIC8qKlxyXG4gICAgICogRmV0Y2ggbmVpZ2hib3Job29kcyBhbmQgY3Vpc2luZXMgYXMgc29vbiBhcyB0aGUgcGFnZSBpcyBsb2FkZWQuXHJcbiAgICAgKi9cclxuICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ0RPTUNvbnRlbnRMb2FkZWQnLCAoKSA9PiB7XHJcbiAgICAgIERCSGVscGVyLmZldGNoTUFQQk9YVG9rZW4oKS50aGVuKG1hcGJveFRva2VuID0+IHtcclxuICAgICAgICB0aGlzLmluaXRNYXAobWFwYm94VG9rZW4pOyAvLyBhZGRlZFxyXG4gICAgICB9KTtcclxuICAgICAgdGhpcy5mZXRjaE5laWdoYm9yaG9vZHMoKTtcclxuICAgICAgdGhpcy5mZXRjaEN1aXNpbmVzKCk7XHJcblxyXG4gICAgICAvKiBsaXN0ZW4gZm9yIHNlbGVjdCBlbGVtZW50cyBhbmQgdXBkYXRlIFJlc3RhdXJhbnRzICovXHJcbiAgICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5maWx0ZXItb3B0aW9ucycpLmFkZEV2ZW50TGlzdGVuZXIoJ2NoYW5nZScsKGUpID0+IHtcclxuICAgICAgICBpZihlLnRhcmdldC5pZC5pbmNsdWRlcygnLXNlbGVjdCcpKSB7XHJcbiAgICAgICAgICB0aGlzLnVwZGF0ZVJlc3RhdXJhbnRzKCk7XHJcbiAgICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xyXG4gICAgICAgIH1cclxuICAgICAgfSk7XHJcblxyXG4gICAgfSk7XHJcbiAgfVxyXG59XHJcblxyXG4oKCkgPT4ge1xyXG4gIGNvbnN0IG1haW4gPSBuZXcgTWFpblBhZ2UoKTtcclxuICBtYWluLmluaXQoKTtcclxufSkoKTtcclxuXHJcbi8qPT09PT09PT09PT09PT09PT09Rm9jdXM9PT09PT09PT09PT09PT09PT0qL1xyXG5cclxuLy8gZnVuY3Rpb24gaGFuZGxlUmVzdG9Gb2N1cyh2aWV3RGV0YWlsc0J1dHRvbil7XHJcbi8vICAgdmlld0RldGFpbHNCdXR0b24uYWRkRXZlbnRMaXN0ZW5lcignZm9jdXMnLCBmdW5jdGlvbihlKXtcclxuLy8gICAgIGNvbnNvbGUubG9nKGUudGFyZ2V0KTtcclxuLy8gICB9KTtcclxuLy8gfVxyXG4iXX0=
