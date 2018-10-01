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

var RestaurantInfo =
/*#__PURE__*/
function () {
  function RestaurantInfo() {
    _classCallCheck(this, RestaurantInfo);
  }

  _createClass(RestaurantInfo, [{
    key: "initMap",

    /**
     * Initialize leaflet map
     * @param {string} mapboxToken - mapbox API Token
     */
    value: function initMap(mapboxToken) {
      var _this = this;

      this.fetchRestaurantFromURL(function (error, restaurant) {
        if (error) {
          // Got an error!
          console.error(error);
        } else {
          _this.newMap = L.map('map', {
            center: [restaurant.latlng.lat, restaurant.latlng.lng],
            zoom: 16,
            scrollWheelZoom: false
          });
          L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.jpg70?access_token={mapboxToken}', {
            mapboxToken: mapboxToken,
            maxZoom: 18,
            attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' + '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' + 'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
            id: 'mapbox.streets'
          }).addTo(_this.newMap);

          _this.fillBreadcrumb();

          DBHelper.mapMarkerForRestaurant(_this.restaurant, _this.newMap);
        }
      });
    }
    /**
     * Get current restaurant from page URL.
     */

  }, {
    key: "fetchRestaurantFromURL",
    value: function fetchRestaurantFromURL(callback) {
      var _this2 = this;

      if (this.restaurant) {
        // restaurant already fetched!
        callback(null, this.restaurant);
        return;
      }

      var id = this.getParameterByName('id');

      if (!id) {
        // no id found in URL
        var error = 'No restaurant id in URL';
        callback(error, null);
      } else {
        DBHelper.fetchRestaurantById(id, function (error, restaurant) {
          _this2.restaurant = restaurant;

          if (!restaurant) {
            console.error(error);

            _this2.handleRestaurantNotFound();

            return;
          }

          _this2.fillRestaurantHTML();

          callback(null, restaurant);
        });
      }
    }
    /**
     * Shows a message when request restaurant 'id' is not found
     */

  }, {
    key: "handleRestaurantNotFound",
    value: function handleRestaurantNotFound() {
      /* selecting all the elements that are not needed anymore */
      var $uselessElems = document.querySelectorAll('.breadcrumb-wrapper, .restaurant-container, .map-container, .reviews-container');
      /* removing all "useless" elements */

      $uselessElems.forEach(function (elem) {
        elem.remove();
      });
      var $main = document.querySelector('.maincontent');
      var $container = document.createElement('div');
      $container.className = 'rst-not-found';
      $container.innerHTML = "<h2>Restaurant Not found</h2>\n    <p>This is not the restaurant you are looking for!</p>";
      $main.prepend($container);
    }
    /**
     * Create restaurant HTML and add it to the webpage
     */

  }, {
    key: "fillRestaurantHTML",
    value: function fillRestaurantHTML() {
      var name = document.querySelector('.restaurant-name');
      name.innerHTML = this.restaurant.name;
      var address = document.querySelector('.restaurant-address');
      address.innerHTML = this.restaurant.address;
      /* image sizes to use in srcset */

      var imgSizes = ['300', '400', '500', '600', '800', '1000', '1200'];
      /* image size to use as fallback in src */

      var defaultSize = '600';
      var image = document.querySelector('.restaurant-img');
      image.className = 'restaurant-img';
      image.src = DBHelper.imageUrlForRestaurant(this.restaurant.photograph, defaultSize);
      image.srcset = DBHelper.imageSrcsetForRestaurant(this.restaurant.photograph, imgSizes);
      image.sizes = '(min-width: 632px) 600px, 100vw';
      image.alt = "This is an image of the ".concat(this.restaurant.name, " restaurant");
      var cuisine = document.querySelector('.restaurant-cuisine');
      cuisine.innerHTML = this.restaurant.cuisine_type; // fill operating hours

      if (this.restaurant.operating_hours) {
        this.fillRestaurantHoursHTML();
      } // fill reviews


      this.fillReviewsHTML();
    }
    /**
     * Create restaurant operating hours HTML table and add it to the webpage.
     */

  }, {
    key: "fillRestaurantHoursHTML",
    value: function fillRestaurantHoursHTML() {
      var operatingHours = this.restaurant.operating_hours;
      var hours = document.querySelector('.restaurant-hours');

      for (var key in operatingHours) {
        /*
          wrapping the content of the for-in loop
          in a conditional statement to prevent
          it from from iterating over the prototype chain
        */
        if (operatingHours.hasOwnProperty(key)) {
          var row = document.createElement('tr');
          row.setAttribute('tabindex', '0');
          var day = document.createElement('td');
          day.innerHTML = key;
          row.appendChild(day);
          var time = document.createElement('td');
          time.innerHTML = operatingHours[key];
          row.appendChild(time);
          hours.appendChild(row);
        }
      }
    }
    /**
     * Create all reviews HTML and add them to the webpage.
     */

  }, {
    key: "fillReviewsHTML",
    value: function fillReviewsHTML() {
      var _this3 = this;

      var container = document.querySelector('.reviews-container');
      var title = document.createElement('h2');
      title.innerHTML = 'Reviews';
      container.appendChild(title);

      if (!this.restaurant.reviews) {
        var noReviews = document.createElement('p');
        noReviews.innerHTML = 'No reviews yet!';
        container.appendChild(noReviews);
        return;
      }

      var ul = document.querySelector('.reviews-list');
      this.restaurant.reviews.forEach(function (review) {
        ul.appendChild(_this3.createReviewHTML(review));
      });
      container.appendChild(ul);
    }
    /**
     * Create review HTML and add it to the webpage.
     */

  }, {
    key: "createReviewHTML",
    value: function createReviewHTML(review) {
      var li = document.createElement('li');
      var name = document.createElement('p');
      name.setAttribute('tabindex', '0');
      name.className = 'review-name';
      name.innerHTML = review.name;
      li.appendChild(name);
      var date = document.createElement('p');
      date.innerHTML = review.date;
      date.className = 'review-date';
      li.appendChild(date);
      var rating = this.createRatingElement(review.rating);
      li.appendChild(rating);
      var comments = document.createElement('p');
      comments.innerHTML = review.comments;
      li.appendChild(comments);
      return li;
    }
    /**
     * Create rating element as stars
     */

  }, {
    key: "createRatingElement",
    value: function createRatingElement(reviewRating) {
      var $rating = document.createElement('p');
      $rating.className = 'review-rating';
      var hollowStars = 5 - reviewRating;

      for (var i = 0; i < reviewRating; i++) {
        var $star = document.createElement('span');
        $star.innerHTML = '★';
        $rating.appendChild($star);
      }

      for (var _i = 0; _i < hollowStars; _i++) {
        var _$star = document.createElement('span');

        _$star.innerHTML = '☆';
        $rating.appendChild(_$star);
      }

      return $rating;
    }
    /**
     * Add restaurant name to the breadcrumb navigation menu
     */

  }, {
    key: "fillBreadcrumb",
    value: function fillBreadcrumb() {
      var breadcrumb = document.querySelector('.breadcrumb');
      var li = document.createElement('li');
      li.innerHTML = this.restaurant.name;
      breadcrumb.appendChild(li);
    }
    /**
     * Get a parameter by name from page URL.
     */

  }, {
    key: "getParameterByName",
    value: function getParameterByName(name, url) {
      if (!url) {
        url = window.location.href;
      }

      var sanitizePattern = new RegExp('[\\[\\]]', 'g'); // name = name.replace(/[\[\]]/g, '\\$&');

      name = name.replace(sanitizePattern, '\\$&');
      var regex = new RegExp("[?&]".concat(name, "(=([^&#]*)|&|#|$)"));
      var results = regex.exec(url);
      if (!results) return null;
      if (!results[2]) return '';
      return decodeURIComponent(results[2].replace(/\+/g, ' '));
    }
  }, {
    key: "init",
    value: function init() {
      var _this4 = this;

      /**
       * Initialize map as soon as the page is loaded.
       */
      document.addEventListener('DOMContentLoaded', function () {
        DBHelper.fetchMAPBOXToken().then(function (mapboxToken) {
          _this4.initMap(mapboxToken); // added

        });
      });
    }
  }]);

  return RestaurantInfo;
}();

(function () {
  var inside = new RestaurantInfo();
  inside.init();
})();
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImRiaGVscGVyLmpzIiwicmVzdGF1cmFudF9pbmZvLmpzIl0sIm5hbWVzIjpbIkJBU0VfVVJMIiwibG9jYXRpb24iLCJvcmlnaW4iLCJpbmNsdWRlcyIsIkRCSGVscGVyIiwiZmV0Y2giLCJEQVRBQkFTRV9VUkwiLCJ0aGVuIiwicmVzIiwianNvbiIsImRhdGEiLCJNQVBCT1hfVE9LRU4iLCJjYXRjaCIsImVyciIsImNvbnNvbGUiLCJsb2ciLCJjYWxsYmFjayIsInhociIsIlhNTEh0dHBSZXF1ZXN0Iiwib3BlbiIsIm9ubG9hZCIsInN0YXR1cyIsIkpTT04iLCJwYXJzZSIsInJlc3BvbnNlVGV4dCIsInJlc3RhdXJhbnRzIiwiZXJyb3IiLCJzZW5kIiwiaWQiLCJmZXRjaFJlc3RhdXJhbnRzIiwicmVzdGF1cmFudCIsImZpbmQiLCJyIiwiY3Vpc2luZSIsInJlc3VsdHMiLCJmaWx0ZXIiLCJjdWlzaW5lX3R5cGUiLCJuZWlnaGJvcmhvb2QiLCJuZWlnaGJvcmhvb2RzIiwibWFwIiwidiIsImkiLCJ1bmlxdWVOZWlnaGJvcmhvb2RzIiwiaW5kZXhPZiIsImN1aXNpbmVzIiwidW5pcXVlQ3Vpc2luZXMiLCJwaG90b2dyYXBoIiwic2l6ZSIsInNpemVzIiwiaW1nUGF0aHMiLCJmb3JFYWNoIiwicHVzaCIsImpvaW4iLCJtYXJrZXIiLCJMIiwibGF0bG5nIiwibGF0IiwibG5nIiwidGl0bGUiLCJuYW1lIiwiYWx0IiwidXJsIiwidXJsRm9yUmVzdGF1cmFudCIsImFkZFRvIiwibmF2aWdhdG9yIiwid2luZG93IiwiYWRkRXZlbnRMaXN0ZW5lciIsInNlcnZpY2VXb3JrZXIiLCJyZWdpc3RlciIsIlJlc3RhdXJhbnRJbmZvIiwibWFwYm94VG9rZW4iLCJmZXRjaFJlc3RhdXJhbnRGcm9tVVJMIiwibmV3TWFwIiwiY2VudGVyIiwiem9vbSIsInNjcm9sbFdoZWVsWm9vbSIsInRpbGVMYXllciIsIm1heFpvb20iLCJhdHRyaWJ1dGlvbiIsImZpbGxCcmVhZGNydW1iIiwibWFwTWFya2VyRm9yUmVzdGF1cmFudCIsImdldFBhcmFtZXRlckJ5TmFtZSIsImZldGNoUmVzdGF1cmFudEJ5SWQiLCJoYW5kbGVSZXN0YXVyYW50Tm90Rm91bmQiLCJmaWxsUmVzdGF1cmFudEhUTUwiLCIkdXNlbGVzc0VsZW1zIiwiZG9jdW1lbnQiLCJxdWVyeVNlbGVjdG9yQWxsIiwiZWxlbSIsInJlbW92ZSIsIiRtYWluIiwicXVlcnlTZWxlY3RvciIsIiRjb250YWluZXIiLCJjcmVhdGVFbGVtZW50IiwiY2xhc3NOYW1lIiwiaW5uZXJIVE1MIiwicHJlcGVuZCIsImFkZHJlc3MiLCJpbWdTaXplcyIsImRlZmF1bHRTaXplIiwiaW1hZ2UiLCJzcmMiLCJpbWFnZVVybEZvclJlc3RhdXJhbnQiLCJzcmNzZXQiLCJpbWFnZVNyY3NldEZvclJlc3RhdXJhbnQiLCJvcGVyYXRpbmdfaG91cnMiLCJmaWxsUmVzdGF1cmFudEhvdXJzSFRNTCIsImZpbGxSZXZpZXdzSFRNTCIsIm9wZXJhdGluZ0hvdXJzIiwiaG91cnMiLCJrZXkiLCJoYXNPd25Qcm9wZXJ0eSIsInJvdyIsInNldEF0dHJpYnV0ZSIsImRheSIsImFwcGVuZENoaWxkIiwidGltZSIsImNvbnRhaW5lciIsInJldmlld3MiLCJub1Jldmlld3MiLCJ1bCIsInJldmlldyIsImNyZWF0ZVJldmlld0hUTUwiLCJsaSIsImRhdGUiLCJyYXRpbmciLCJjcmVhdGVSYXRpbmdFbGVtZW50IiwiY29tbWVudHMiLCJyZXZpZXdSYXRpbmciLCIkcmF0aW5nIiwiaG9sbG93U3RhcnMiLCIkc3RhciIsImJyZWFkY3J1bWIiLCJocmVmIiwic2FuaXRpemVQYXR0ZXJuIiwiUmVnRXhwIiwicmVwbGFjZSIsInJlZ2V4IiwiZXhlYyIsImRlY29kZVVSSUNvbXBvbmVudCIsImZldGNoTUFQQk9YVG9rZW4iLCJpbml0TWFwIiwiaW5zaWRlIiwiaW5pdCJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7QUFBQTs7QUFFQTs7OztBQUlBLElBQU1BLFFBQVEsR0FBSSxZQUFN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Y0FBSixFQUFmO0FBQ0F5RSxFQUFBQSxNQUFNLENBQUNDLElBQVA7QUFDRCxDQUhEIiwiZmlsZSI6Imluc2lkZS5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qZXNsaW50IG5vLXVudXNlZC12YXJzOiBbXCJlcnJvclwiLCB7IFwidmFyc0lnbm9yZVBhdHRlcm5cIjogXCJEQkhlbHBlclwiIH1dKi9cclxuXHJcbi8qXHJcbiBDaGFuZ2UgdGhpcyB0byB5b3VyIGJhc2UgdXJsIGluIGxvY2FsIGVudlxyXG4gdGhhdCB3b3VsZCBiZSAnaHR0cDovL2xvY2FsaG9zdDpwb3J0J1xyXG4qL1xyXG5jb25zdCBCQVNFX1VSTCA9ICgoKSA9PiB7XHJcbiAgaWYobG9jYXRpb24ub3JpZ2luLmluY2x1ZGVzKCdodHRwOi8vbG9jYWxob3N0OicpKSB7XHJcbiAgICByZXR1cm4gbG9jYXRpb24ub3JpZ2luO1xyXG4gIH1cclxuICByZXR1cm4gYCR7bG9jYXRpb24ub3JpZ2lufS9td3MtcmVzdGF1cmFudC1zdGFnZS0xYDtcclxufSkoKTtcclxuXHJcbi8qKlxyXG4gKiBDb21tb24gZGF0YWJhc2UgaGVscGVyIGZ1bmN0aW9ucy5cclxuICovXHJcbmNsYXNzIERCSGVscGVyIHtcclxuXHJcbiAgLyoqXHJcbiAgICogRmV0Y2ggTUFQQk9YIFRva2VuIGZyb20gREIgaW5zdGVhZCBvZiBpbmNsdWRpbmdcclxuICAgKiBpdCBpbiB0aGUgc2NyaXB0XHJcbiAgICovXHJcbiAgc3RhdGljIGZldGNoTUFQQk9YVG9rZW4oKSB7XHJcbiAgICByZXR1cm4gZmV0Y2goREJIZWxwZXIuREFUQUJBU0VfVVJMKVxyXG4gICAgICAudGhlbihyZXMgPT4gcmVzLmpzb24oKSlcclxuICAgICAgLnRoZW4oZGF0YSA9PiBkYXRhLk1BUEJPWF9UT0tFTilcclxuICAgICAgLmNhdGNoKGVyciA9PiB7XHJcbiAgICAgICAgY29uc29sZS5sb2coZXJyKTtcclxuICAgICAgfSk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBEYXRhYmFzZSBVUkwuXHJcbiAgICogQ2hhbmdlIHRoaXMgdG8gcmVzdGF1cmFudHMuanNvbiBmaWxlIGxvY2F0aW9uIG9uIHlvdXIgc2VydmVyLlxyXG4gICAqL1xyXG4gIHN0YXRpYyBnZXQgREFUQUJBU0VfVVJMKCkge1xyXG4gICAgcmV0dXJuIGAke0JBU0VfVVJMfS9idWlsZC9kYXRhL3Jlc3RhdXJhbnRzLmpzb25gO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogRmV0Y2ggYWxsIHJlc3RhdXJhbnRzLlxyXG4gICAqL1xyXG4gIHN0YXRpYyBmZXRjaFJlc3RhdXJhbnRzKGNhbGxiYWNrKSB7XHJcbiAgICBsZXQgeGhyID0gbmV3IFhNTEh0dHBSZXF1ZXN0KCk7XHJcbiAgICB4aHIub3BlbignR0VUJywgREJIZWxwZXIuREFUQUJBU0VfVVJMKTtcclxuICAgIHhoci5vbmxvYWQgPSAoKSA9PiB7XHJcbiAgICAgIGlmICh4aHIuc3RhdHVzID09PSAyMDApIHsgLy8gR290IGEgc3VjY2VzcyByZXNwb25zZSBmcm9tIHNlcnZlciFcclxuICAgICAgICBjb25zdCBqc29uID0gSlNPTi5wYXJzZSh4aHIucmVzcG9uc2VUZXh0KTtcclxuICAgICAgICBjb25zdCByZXN0YXVyYW50cyA9IGpzb24ucmVzdGF1cmFudHM7XHJcbiAgICAgICAgY2FsbGJhY2sobnVsbCwgcmVzdGF1cmFudHMpO1xyXG4gICAgICB9IGVsc2UgeyAvLyBPb3BzIS4gR290IGFuIGVycm9yIGZyb20gc2VydmVyLlxyXG4gICAgICAgIGNvbnN0IGVycm9yID0gKGBSZXF1ZXN0IGZhaWxlZC4gUmV0dXJuZWQgc3RhdHVzIG9mICR7eGhyLnN0YXR1c31gKTtcclxuICAgICAgICBjYWxsYmFjayhlcnJvciwgbnVsbCk7XHJcbiAgICAgIH1cclxuICAgIH07XHJcbiAgICB4aHIuc2VuZCgpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogRmV0Y2ggYSByZXN0YXVyYW50IGJ5IGl0cyBJRC5cclxuICAgKi9cclxuICBzdGF0aWMgZmV0Y2hSZXN0YXVyYW50QnlJZChpZCwgY2FsbGJhY2spIHtcclxuICAgIC8vIGZldGNoIGFsbCByZXN0YXVyYW50cyB3aXRoIHByb3BlciBlcnJvciBoYW5kbGluZy5cclxuICAgIERCSGVscGVyLmZldGNoUmVzdGF1cmFudHMoKGVycm9yLCByZXN0YXVyYW50cykgPT4ge1xyXG4gICAgICBpZiAoZXJyb3IpIHtcclxuICAgICAgICBjYWxsYmFjayhlcnJvciwgbnVsbCk7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgY29uc3QgcmVzdGF1cmFudCA9IHJlc3RhdXJhbnRzLmZpbmQociA9PiByLmlkID09IGlkKTtcclxuICAgICAgICBpZiAocmVzdGF1cmFudCkgeyAvLyBHb3QgdGhlIHJlc3RhdXJhbnRcclxuICAgICAgICAgIGNhbGxiYWNrKG51bGwsIHJlc3RhdXJhbnQpO1xyXG4gICAgICAgIH0gZWxzZSB7IC8vIFJlc3RhdXJhbnQgZG9lcyBub3QgZXhpc3QgaW4gdGhlIGRhdGFiYXNlXHJcbiAgICAgICAgICBjYWxsYmFjaygnUmVzdGF1cmFudCBkb2VzIG5vdCBleGlzdCcsIG51bGwpO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfSk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBGZXRjaCByZXN0YXVyYW50cyBieSBhIGN1aXNpbmUgdHlwZSB3aXRoIHByb3BlciBlcnJvciBoYW5kbGluZy5cclxuICAgKi9cclxuICBzdGF0aWMgZmV0Y2hSZXN0YXVyYW50QnlDdWlzaW5lKGN1aXNpbmUsIGNhbGxiYWNrKSB7XHJcbiAgICAvLyBGZXRjaCBhbGwgcmVzdGF1cmFudHMgIHdpdGggcHJvcGVyIGVycm9yIGhhbmRsaW5nXHJcbiAgICBEQkhlbHBlci5mZXRjaFJlc3RhdXJhbnRzKChlcnJvciwgcmVzdGF1cmFudHMpID0+IHtcclxuICAgICAgaWYgKGVycm9yKSB7XHJcbiAgICAgICAgY2FsbGJhY2soZXJyb3IsIG51bGwpO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIC8vIEZpbHRlciByZXN0YXVyYW50cyB0byBoYXZlIG9ubHkgZ2l2ZW4gY3Vpc2luZSB0eXBlXHJcbiAgICAgICAgY29uc3QgcmVzdWx0cyA9IHJlc3RhdXJhbnRzLmZpbHRlcihyID0+IHIuY3Vpc2luZV90eXBlID09IGN1aXNpbmUpO1xyXG4gICAgICAgIGNhbGxiYWNrKG51bGwsIHJlc3VsdHMpO1xyXG4gICAgICB9XHJcbiAgICB9KTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEZldGNoIHJlc3RhdXJhbnRzIGJ5IGEgbmVpZ2hib3Job29kIHdpdGggcHJvcGVyIGVycm9yIGhhbmRsaW5nLlxyXG4gICAqL1xyXG4gIHN0YXRpYyBmZXRjaFJlc3RhdXJhbnRCeU5laWdoYm9yaG9vZChuZWlnaGJvcmhvb2QsIGNhbGxiYWNrKSB7XHJcbiAgICAvLyBGZXRjaCBhbGwgcmVzdGF1cmFudHNcclxuICAgIERCSGVscGVyLmZldGNoUmVzdGF1cmFudHMoKGVycm9yLCByZXN0YXVyYW50cykgPT4ge1xyXG4gICAgICBpZiAoZXJyb3IpIHtcclxuICAgICAgICBjYWxsYmFjayhlcnJvciwgbnVsbCk7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgLy8gRmlsdGVyIHJlc3RhdXJhbnRzIHRvIGhhdmUgb25seSBnaXZlbiBuZWlnaGJvcmhvb2RcclxuICAgICAgICBjb25zdCByZXN1bHRzID0gcmVzdGF1cmFudHMuZmlsdGVyKHIgPT4gci5uZWlnaGJvcmhvb2QgPT0gbmVpZ2hib3Job29kKTtcclxuICAgICAgICBjYWxsYmFjayhudWxsLCByZXN1bHRzKTtcclxuICAgICAgfVxyXG4gICAgfSk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBGZXRjaCByZXN0YXVyYW50cyBieSBhIGN1aXNpbmUgYW5kIGEgbmVpZ2hib3Job29kIHdpdGggcHJvcGVyIGVycm9yIGhhbmRsaW5nLlxyXG4gICAqL1xyXG4gIHN0YXRpYyBmZXRjaFJlc3RhdXJhbnRCeUN1aXNpbmVBbmROZWlnaGJvcmhvb2QoY3Vpc2luZSwgbmVpZ2hib3Job29kLCBjYWxsYmFjaykge1xyXG4gICAgLy8gRmV0Y2ggYWxsIHJlc3RhdXJhbnRzXHJcbiAgICBEQkhlbHBlci5mZXRjaFJlc3RhdXJhbnRzKChlcnJvciwgcmVzdGF1cmFudHMpID0+IHtcclxuICAgICAgaWYgKGVycm9yKSB7XHJcbiAgICAgICAgY2FsbGJhY2soZXJyb3IsIG51bGwpO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIGxldCByZXN1bHRzID0gcmVzdGF1cmFudHM7XHJcbiAgICAgICAgaWYgKGN1aXNpbmUgIT0gJ2FsbCcpIHsgLy8gZmlsdGVyIGJ5IGN1aXNpbmVcclxuICAgICAgICAgIHJlc3VsdHMgPSByZXN1bHRzLmZpbHRlcihyID0+IHIuY3Vpc2luZV90eXBlID09IGN1aXNpbmUpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAobmVpZ2hib3Job29kICE9ICdhbGwnKSB7IC8vIGZpbHRlciBieSBuZWlnaGJvcmhvb2RcclxuICAgICAgICAgIHJlc3VsdHMgPSByZXN1bHRzLmZpbHRlcihyID0+IHIubmVpZ2hib3Job29kID09IG5laWdoYm9yaG9vZCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNhbGxiYWNrKG51bGwsIHJlc3VsdHMpO1xyXG4gICAgICB9XHJcbiAgICB9KTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEZldGNoIGFsbCBuZWlnaGJvcmhvb2RzIHdpdGggcHJvcGVyIGVycm9yIGhhbmRsaW5nLlxyXG4gICAqL1xyXG4gIHN0YXRpYyBmZXRjaE5laWdoYm9yaG9vZHMoY2FsbGJhY2spIHtcclxuICAgIC8vIEZldGNoIGFsbCByZXN0YXVyYW50c1xyXG4gICAgREJIZWxwZXIuZmV0Y2hSZXN0YXVyYW50cygoZXJyb3IsIHJlc3RhdXJhbnRzKSA9PiB7XHJcbiAgICAgIGlmIChlcnJvcikge1xyXG4gICAgICAgIGNhbGxiYWNrKGVycm9yLCBudWxsKTtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICAvLyBHZXQgYWxsIG5laWdoYm9yaG9vZHMgZnJvbSBhbGwgcmVzdGF1cmFudHNcclxuICAgICAgICBjb25zdCBuZWlnaGJvcmhvb2RzID0gcmVzdGF1cmFudHMubWFwKCh2LCBpKSA9PiByZXN0YXVyYW50c1tpXS5uZWlnaGJvcmhvb2QpO1xyXG4gICAgICAgIC8vIFJlbW92ZSBkdXBsaWNhdGVzIGZyb20gbmVpZ2hib3Job29kc1xyXG4gICAgICAgIGNvbnN0IHVuaXF1ZU5laWdoYm9yaG9vZHMgPSBuZWlnaGJvcmhvb2RzLmZpbHRlcigodiwgaSkgPT4gbmVpZ2hib3Job29kcy5pbmRleE9mKHYpID09IGkpO1xyXG4gICAgICAgIGNhbGxiYWNrKG51bGwsIHVuaXF1ZU5laWdoYm9yaG9vZHMpO1xyXG4gICAgICB9XHJcbiAgICB9KTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEZldGNoIGFsbCBjdWlzaW5lcyB3aXRoIHByb3BlciBlcnJvciBoYW5kbGluZy5cclxuICAgKi9cclxuICBzdGF0aWMgZmV0Y2hDdWlzaW5lcyhjYWxsYmFjaykge1xyXG4gICAgLy8gRmV0Y2ggYWxsIHJlc3RhdXJhbnRzXHJcbiAgICBEQkhlbHBlci5mZXRjaFJlc3RhdXJhbnRzKChlcnJvciwgcmVzdGF1cmFudHMpID0+IHtcclxuICAgICAgaWYgKGVycm9yKSB7XHJcbiAgICAgICAgY2FsbGJhY2soZXJyb3IsIG51bGwpO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIC8vIEdldCBhbGwgY3Vpc2luZXMgZnJvbSBhbGwgcmVzdGF1cmFudHNcclxuICAgICAgICBjb25zdCBjdWlzaW5lcyA9IHJlc3RhdXJhbnRzLm1hcCgodiwgaSkgPT4gcmVzdGF1cmFudHNbaV0uY3Vpc2luZV90eXBlKTtcclxuICAgICAgICAvLyBSZW1vdmUgZHVwbGljYXRlcyBmcm9tIGN1aXNpbmVzXHJcbiAgICAgICAgY29uc3QgdW5pcXVlQ3Vpc2luZXMgPSBjdWlzaW5lcy5maWx0ZXIoKHYsIGkpID0+IGN1aXNpbmVzLmluZGV4T2YodikgPT0gaSk7XHJcbiAgICAgICAgY2FsbGJhY2sobnVsbCwgdW5pcXVlQ3Vpc2luZXMpO1xyXG4gICAgICB9XHJcbiAgICB9KTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJlc3RhdXJhbnQgcGFnZSBVUkwuXHJcbiAgICovXHJcbiAgc3RhdGljIHVybEZvclJlc3RhdXJhbnQocmVzdGF1cmFudCkge1xyXG4gICAgcmV0dXJuIChgJHtCQVNFX1VSTH0vcmVzdGF1cmFudC5odG1sP2lkPSR7cmVzdGF1cmFudC5pZH1gKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJlc3RhdXJhbnQgaW1hZ2UgVVJMLlxyXG4gICAqL1xyXG4gIHN0YXRpYyBpbWFnZVVybEZvclJlc3RhdXJhbnQocGhvdG9ncmFwaCwgc2l6ZSkge1xyXG4gICAgcmV0dXJuIChcclxuICAgICAgYCR7QkFTRV9VUkx9L2J1aWxkL2ltZy8ke3Bob3RvZ3JhcGh9LSR7c2l6ZX13LmpwZ2BcclxuICAgICk7XHJcbiAgfVxyXG5cclxuICBzdGF0aWMgaW1hZ2VTcmNzZXRGb3JSZXN0YXVyYW50KHBob3RvZ3JhcGgsIHNpemVzPVtdKXtcclxuICAgIGNvbnN0IGltZ1BhdGhzID0gW107XHJcbiAgICBzaXplcy5mb3JFYWNoKHNpemUgPT4ge1xyXG4gICAgICBpbWdQYXRocy5wdXNoKFxyXG4gICAgICAgIGAke0JBU0VfVVJMfS9idWlsZC9pbWcvJHtwaG90b2dyYXBofS0ke3NpemV9dy5qcGcgJHtzaXplfXdgXHJcbiAgICAgICk7XHJcbiAgICB9KTtcclxuICAgIHJldHVybiBpbWdQYXRocy5qb2luKCcsICcpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogTWFwIG1hcmtlciBmb3IgYSByZXN0YXVyYW50LlxyXG4gICAqL1xyXG4gIHN0YXRpYyBtYXBNYXJrZXJGb3JSZXN0YXVyYW50KHJlc3RhdXJhbnQsIG1hcCkge1xyXG4gICAgLy8gaHR0cHM6Ly9sZWFmbGV0anMuY29tL3JlZmVyZW5jZS0xLjMuMC5odG1sI21hcmtlclxyXG4gICAgY29uc3QgbWFya2VyID0gbmV3IEwubWFya2VyKFtyZXN0YXVyYW50LmxhdGxuZy5sYXQsIHJlc3RhdXJhbnQubGF0bG5nLmxuZ10sXHJcbiAgICAgIHtcclxuICAgICAgICB0aXRsZTogcmVzdGF1cmFudC5uYW1lLFxyXG4gICAgICAgIGFsdDogcmVzdGF1cmFudC5uYW1lLFxyXG4gICAgICAgIHVybDogREJIZWxwZXIudXJsRm9yUmVzdGF1cmFudChyZXN0YXVyYW50KVxyXG4gICAgICB9KTtcclxuICAgIG1hcmtlci5hZGRUbyhtYXApO1xyXG4gICAgcmV0dXJuIG1hcmtlcjtcclxuICB9XHJcblxyXG4gIC8qICA9PT09PT09PT09PT09PSBTZXJ2aWNlIFdvcmtlciBSZWdpc3RyYXRpb24gPT09PT09PT09PT09PT0gKi9cclxuICBzdGF0aWMgcmVnaXN0ZXJTZXJ2aWNlV29ya2VyKCkge1xyXG5cclxuICAgIC8qIG1ha2luZyBzdXJlIGJyb3dzZXIgc3VwcG9ydHMgc2VydmljZSB3b3JrZXIgKi9cclxuICAgIGlmICgnc2VydmljZVdvcmtlcicgaW4gbmF2aWdhdG9yKSB7XHJcblxyXG4gICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignbG9hZCcsICgpID0+IHtcclxuICAgICAgICBuYXZpZ2F0b3Iuc2VydmljZVdvcmtlci5yZWdpc3RlcignLi9zdy5qcycpXHJcbiAgICAgICAgICAudGhlbigoKSA9PiB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdSZWdpc3RlcmluZyBzZXJ2aWNlIHdvcmtlcicpO1xyXG4gICAgICAgICAgfSlcclxuICAgICAgICAgIC5jYXRjaCgoKSA9PiB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdTZXJ2aWNlIFdvcmtlciByZWdpc3RyYXRpb24gZmFpbGVkJyk7XHJcbiAgICAgICAgICB9KTtcclxuICAgICAgfSk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxufSIsIlxyXG5jbGFzcyBSZXN0YXVyYW50SW5mbyB7XHJcblxyXG4gIC8qKlxyXG4gICAqIEluaXRpYWxpemUgbGVhZmxldCBtYXBcclxuICAgKiBAcGFyYW0ge3N0cmluZ30gbWFwYm94VG9rZW4gLSBtYXBib3ggQVBJIFRva2VuXHJcbiAgICovXHJcbiAgaW5pdE1hcChtYXBib3hUb2tlbikge1xyXG4gICAgdGhpcy5mZXRjaFJlc3RhdXJhbnRGcm9tVVJMKChlcnJvciwgcmVzdGF1cmFudCkgPT4ge1xyXG4gICAgICBpZiAoZXJyb3IpIHsgLy8gR290IGFuIGVycm9yIVxyXG4gICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyb3IpO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIHRoaXMubmV3TWFwID0gTC5tYXAoJ21hcCcsIHtcclxuICAgICAgICAgIGNlbnRlcjogW3Jlc3RhdXJhbnQubGF0bG5nLmxhdCwgcmVzdGF1cmFudC5sYXRsbmcubG5nXSxcclxuICAgICAgICAgIHpvb206IDE2LFxyXG4gICAgICAgICAgc2Nyb2xsV2hlZWxab29tOiBmYWxzZVxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIEwudGlsZUxheWVyKCdodHRwczovL2FwaS50aWxlcy5tYXBib3guY29tL3Y0L3tpZH0ve3p9L3t4fS97eX0uanBnNzA/YWNjZXNzX3Rva2VuPXttYXBib3hUb2tlbn0nLCB7XHJcbiAgICAgICAgICBtYXBib3hUb2tlbixcclxuICAgICAgICAgIG1heFpvb206IDE4LFxyXG4gICAgICAgICAgYXR0cmlidXRpb246ICdNYXAgZGF0YSAmY29weTsgPGEgaHJlZj1cImh0dHBzOi8vd3d3Lm9wZW5zdHJlZXRtYXAub3JnL1wiPk9wZW5TdHJlZXRNYXA8L2E+IGNvbnRyaWJ1dG9ycywgJyArXHJcbiAgICAgICAgICAgICc8YSBocmVmPVwiaHR0cHM6Ly9jcmVhdGl2ZWNvbW1vbnMub3JnL2xpY2Vuc2VzL2J5LXNhLzIuMC9cIj5DQy1CWS1TQTwvYT4sICcgK1xyXG4gICAgICAgICAgICAnSW1hZ2VyeSDCqSA8YSBocmVmPVwiaHR0cHM6Ly93d3cubWFwYm94LmNvbS9cIj5NYXBib3g8L2E+JyxcclxuICAgICAgICAgIGlkOiAnbWFwYm94LnN0cmVldHMnXHJcbiAgICAgICAgfSkuYWRkVG8odGhpcy5uZXdNYXApO1xyXG5cclxuICAgICAgICB0aGlzLmZpbGxCcmVhZGNydW1iKCk7XHJcbiAgICAgICAgREJIZWxwZXIubWFwTWFya2VyRm9yUmVzdGF1cmFudCh0aGlzLnJlc3RhdXJhbnQsIHRoaXMubmV3TWFwKTtcclxuICAgICAgfVxyXG4gICAgfSk7XHJcbiAgfVxyXG5cclxuXHJcbiAgLyoqXHJcbiAgICogR2V0IGN1cnJlbnQgcmVzdGF1cmFudCBmcm9tIHBhZ2UgVVJMLlxyXG4gICAqL1xyXG4gIGZldGNoUmVzdGF1cmFudEZyb21VUkwoY2FsbGJhY2spIHtcclxuICAgIGlmICh0aGlzLnJlc3RhdXJhbnQpIHsgLy8gcmVzdGF1cmFudCBhbHJlYWR5IGZldGNoZWQhXHJcbiAgICAgIGNhbGxiYWNrKG51bGwsIHRoaXMucmVzdGF1cmFudCk7XHJcbiAgICAgIHJldHVybjtcclxuICAgIH1cclxuICAgIGNvbnN0IGlkID0gdGhpcy5nZXRQYXJhbWV0ZXJCeU5hbWUoJ2lkJyk7XHJcbiAgICBpZiAoIWlkKSB7IC8vIG5vIGlkIGZvdW5kIGluIFVSTFxyXG4gICAgICBjb25zdCBlcnJvciA9ICdObyByZXN0YXVyYW50IGlkIGluIFVSTCc7XHJcbiAgICAgIGNhbGxiYWNrKGVycm9yLCBudWxsKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIERCSGVscGVyLmZldGNoUmVzdGF1cmFudEJ5SWQoaWQsIChlcnJvciwgcmVzdGF1cmFudCkgPT4ge1xyXG4gICAgICAgIHRoaXMucmVzdGF1cmFudCA9IHJlc3RhdXJhbnQ7XHJcbiAgICAgICAgaWYgKCFyZXN0YXVyYW50KSB7XHJcbiAgICAgICAgICBjb25zb2xlLmVycm9yKGVycm9yKTtcclxuICAgICAgICAgIHRoaXMuaGFuZGxlUmVzdGF1cmFudE5vdEZvdW5kKCk7XHJcbiAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMuZmlsbFJlc3RhdXJhbnRIVE1MKCk7XHJcbiAgICAgICAgY2FsbGJhY2sobnVsbCwgcmVzdGF1cmFudCk7XHJcbiAgICAgIH0pO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcblxyXG4gIC8qKlxyXG4gICAqIFNob3dzIGEgbWVzc2FnZSB3aGVuIHJlcXVlc3QgcmVzdGF1cmFudCAnaWQnIGlzIG5vdCBmb3VuZFxyXG4gICAqL1xyXG4gIGhhbmRsZVJlc3RhdXJhbnROb3RGb3VuZCgpIHtcclxuICAgIC8qIHNlbGVjdGluZyBhbGwgdGhlIGVsZW1lbnRzIHRoYXQgYXJlIG5vdCBuZWVkZWQgYW55bW9yZSAqL1xyXG4gICAgY29uc3QgJHVzZWxlc3NFbGVtcyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoXHJcbiAgICAgICcuYnJlYWRjcnVtYi13cmFwcGVyLCAucmVzdGF1cmFudC1jb250YWluZXIsIC5tYXAtY29udGFpbmVyLCAucmV2aWV3cy1jb250YWluZXInXHJcbiAgICApO1xyXG4gICAgLyogcmVtb3ZpbmcgYWxsIFwidXNlbGVzc1wiIGVsZW1lbnRzICovXHJcbiAgICAkdXNlbGVzc0VsZW1zLmZvckVhY2goZWxlbSA9PiB7XHJcbiAgICAgIGVsZW0ucmVtb3ZlKCk7XHJcbiAgICB9KTtcclxuXHJcbiAgICBjb25zdCAkbWFpbiA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5tYWluY29udGVudCcpO1xyXG5cclxuICAgIGNvbnN0ICRjb250YWluZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcclxuICAgICRjb250YWluZXIuY2xhc3NOYW1lID0gJ3JzdC1ub3QtZm91bmQnO1xyXG4gICAgJGNvbnRhaW5lci5pbm5lckhUTUwgPSBgPGgyPlJlc3RhdXJhbnQgTm90IGZvdW5kPC9oMj5cclxuICAgIDxwPlRoaXMgaXMgbm90IHRoZSByZXN0YXVyYW50IHlvdSBhcmUgbG9va2luZyBmb3IhPC9wPmA7XHJcblxyXG4gICAgJG1haW4ucHJlcGVuZCgkY29udGFpbmVyKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIENyZWF0ZSByZXN0YXVyYW50IEhUTUwgYW5kIGFkZCBpdCB0byB0aGUgd2VicGFnZVxyXG4gICAqL1xyXG4gIGZpbGxSZXN0YXVyYW50SFRNTCgpIHtcclxuICAgIGNvbnN0IG5hbWUgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcucmVzdGF1cmFudC1uYW1lJyk7XHJcbiAgICBuYW1lLmlubmVySFRNTCA9IHRoaXMucmVzdGF1cmFudC5uYW1lO1xyXG5cclxuICAgIGNvbnN0IGFkZHJlc3MgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcucmVzdGF1cmFudC1hZGRyZXNzJyk7XHJcbiAgICBhZGRyZXNzLmlubmVySFRNTCA9IHRoaXMucmVzdGF1cmFudC5hZGRyZXNzO1xyXG5cclxuICAgIC8qIGltYWdlIHNpemVzIHRvIHVzZSBpbiBzcmNzZXQgKi9cclxuICAgIGNvbnN0IGltZ1NpemVzID0gWyczMDAnLCAnNDAwJywgJzUwMCcsICc2MDAnLCAnODAwJywgJzEwMDAnLCAnMTIwMCddO1xyXG4gICAgLyogaW1hZ2Ugc2l6ZSB0byB1c2UgYXMgZmFsbGJhY2sgaW4gc3JjICovXHJcbiAgICBjb25zdCBkZWZhdWx0U2l6ZSA9ICc2MDAnO1xyXG5cclxuICAgIGNvbnN0IGltYWdlID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLnJlc3RhdXJhbnQtaW1nJyk7XHJcbiAgICBpbWFnZS5jbGFzc05hbWUgPSAncmVzdGF1cmFudC1pbWcnO1xyXG4gICAgaW1hZ2Uuc3JjID0gREJIZWxwZXIuaW1hZ2VVcmxGb3JSZXN0YXVyYW50KFxyXG4gICAgICB0aGlzLnJlc3RhdXJhbnQucGhvdG9ncmFwaCxcclxuICAgICAgZGVmYXVsdFNpemVcclxuICAgICk7XHJcbiAgICBpbWFnZS5zcmNzZXQgPSBEQkhlbHBlci5pbWFnZVNyY3NldEZvclJlc3RhdXJhbnQoXHJcbiAgICAgIHRoaXMucmVzdGF1cmFudC5waG90b2dyYXBoLFxyXG4gICAgICBpbWdTaXplc1xyXG4gICAgKTtcclxuICAgIGltYWdlLnNpemVzID0gJyhtaW4td2lkdGg6IDYzMnB4KSA2MDBweCwgMTAwdncnO1xyXG4gICAgaW1hZ2UuYWx0ID0gYFRoaXMgaXMgYW4gaW1hZ2Ugb2YgdGhlICR7dGhpcy5yZXN0YXVyYW50Lm5hbWV9IHJlc3RhdXJhbnRgO1xyXG5cclxuICAgIGNvbnN0IGN1aXNpbmUgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcucmVzdGF1cmFudC1jdWlzaW5lJyk7XHJcbiAgICBjdWlzaW5lLmlubmVySFRNTCA9IHRoaXMucmVzdGF1cmFudC5jdWlzaW5lX3R5cGU7XHJcblxyXG4gICAgLy8gZmlsbCBvcGVyYXRpbmcgaG91cnNcclxuICAgIGlmICh0aGlzLnJlc3RhdXJhbnQub3BlcmF0aW5nX2hvdXJzKSB7XHJcbiAgICAgIHRoaXMuZmlsbFJlc3RhdXJhbnRIb3Vyc0hUTUwoKTtcclxuICAgIH1cclxuICAgIC8vIGZpbGwgcmV2aWV3c1xyXG4gICAgdGhpcy5maWxsUmV2aWV3c0hUTUwoKTtcclxuICB9XHJcblxyXG5cclxuXHJcbiAgLyoqXHJcbiAgICogQ3JlYXRlIHJlc3RhdXJhbnQgb3BlcmF0aW5nIGhvdXJzIEhUTUwgdGFibGUgYW5kIGFkZCBpdCB0byB0aGUgd2VicGFnZS5cclxuICAgKi9cclxuICBmaWxsUmVzdGF1cmFudEhvdXJzSFRNTCgpIHtcclxuICAgIGNvbnN0IG9wZXJhdGluZ0hvdXJzID0gdGhpcy5yZXN0YXVyYW50Lm9wZXJhdGluZ19ob3VycztcclxuICAgIGNvbnN0IGhvdXJzID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLnJlc3RhdXJhbnQtaG91cnMnKTtcclxuXHJcbiAgICBmb3IgKGxldCBrZXkgaW4gb3BlcmF0aW5nSG91cnMpIHtcclxuICAgICAgLypcclxuICAgICAgICB3cmFwcGluZyB0aGUgY29udGVudCBvZiB0aGUgZm9yLWluIGxvb3BcclxuICAgICAgICBpbiBhIGNvbmRpdGlvbmFsIHN0YXRlbWVudCB0byBwcmV2ZW50XHJcbiAgICAgICAgaXQgZnJvbSBmcm9tIGl0ZXJhdGluZyBvdmVyIHRoZSBwcm90b3R5cGUgY2hhaW5cclxuICAgICAgKi9cclxuICAgICAgaWYgKG9wZXJhdGluZ0hvdXJzLmhhc093blByb3BlcnR5KGtleSkpIHtcclxuXHJcbiAgICAgICAgY29uc3Qgcm93ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgndHInKTtcclxuICAgICAgICByb3cuc2V0QXR0cmlidXRlKCd0YWJpbmRleCcsICcwJyk7XHJcblxyXG4gICAgICAgIGNvbnN0IGRheSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3RkJyk7XHJcbiAgICAgICAgZGF5LmlubmVySFRNTCA9IGtleTtcclxuICAgICAgICByb3cuYXBwZW5kQ2hpbGQoZGF5KTtcclxuXHJcbiAgICAgICAgY29uc3QgdGltZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3RkJyk7XHJcbiAgICAgICAgdGltZS5pbm5lckhUTUwgPSBvcGVyYXRpbmdIb3Vyc1trZXldO1xyXG4gICAgICAgIHJvdy5hcHBlbmRDaGlsZCh0aW1lKTtcclxuXHJcbiAgICAgICAgaG91cnMuYXBwZW5kQ2hpbGQocm93KTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQ3JlYXRlIGFsbCByZXZpZXdzIEhUTUwgYW5kIGFkZCB0aGVtIHRvIHRoZSB3ZWJwYWdlLlxyXG4gICAqL1xyXG4gIGZpbGxSZXZpZXdzSFRNTCgpIHtcclxuICAgIGNvbnN0IGNvbnRhaW5lciA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5yZXZpZXdzLWNvbnRhaW5lcicpO1xyXG5cclxuICAgIGNvbnN0IHRpdGxlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaDInKTtcclxuICAgIHRpdGxlLmlubmVySFRNTCA9ICdSZXZpZXdzJztcclxuICAgIGNvbnRhaW5lci5hcHBlbmRDaGlsZCh0aXRsZSk7XHJcblxyXG4gICAgaWYgKCF0aGlzLnJlc3RhdXJhbnQucmV2aWV3cykge1xyXG4gICAgICBjb25zdCBub1Jldmlld3MgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdwJyk7XHJcbiAgICAgIG5vUmV2aWV3cy5pbm5lckhUTUwgPSAnTm8gcmV2aWV3cyB5ZXQhJztcclxuICAgICAgY29udGFpbmVyLmFwcGVuZENoaWxkKG5vUmV2aWV3cyk7XHJcbiAgICAgIHJldHVybjtcclxuICAgIH1cclxuICAgIGNvbnN0IHVsID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLnJldmlld3MtbGlzdCcpO1xyXG4gICAgdGhpcy5yZXN0YXVyYW50LnJldmlld3MuZm9yRWFjaChyZXZpZXcgPT4ge1xyXG4gICAgICB1bC5hcHBlbmRDaGlsZCh0aGlzLmNyZWF0ZVJldmlld0hUTUwocmV2aWV3KSk7XHJcbiAgICB9KTtcclxuICAgIGNvbnRhaW5lci5hcHBlbmRDaGlsZCh1bCk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBDcmVhdGUgcmV2aWV3IEhUTUwgYW5kIGFkZCBpdCB0byB0aGUgd2VicGFnZS5cclxuICAgKi9cclxuICBjcmVhdGVSZXZpZXdIVE1MKHJldmlldykge1xyXG4gICAgY29uc3QgbGkgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdsaScpO1xyXG5cclxuICAgIGNvbnN0IG5hbWUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdwJyk7XHJcbiAgICBuYW1lLnNldEF0dHJpYnV0ZSgndGFiaW5kZXgnLCAnMCcpO1xyXG4gICAgbmFtZS5jbGFzc05hbWUgPSAncmV2aWV3LW5hbWUnO1xyXG4gICAgbmFtZS5pbm5lckhUTUwgPSByZXZpZXcubmFtZTtcclxuICAgIGxpLmFwcGVuZENoaWxkKG5hbWUpO1xyXG5cclxuICAgIGNvbnN0IGRhdGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdwJyk7XHJcbiAgICBkYXRlLmlubmVySFRNTCA9IHJldmlldy5kYXRlO1xyXG4gICAgZGF0ZS5jbGFzc05hbWUgPSAncmV2aWV3LWRhdGUnO1xyXG4gICAgbGkuYXBwZW5kQ2hpbGQoZGF0ZSk7XHJcblxyXG4gICAgY29uc3QgcmF0aW5nID0gdGhpcy5jcmVhdGVSYXRpbmdFbGVtZW50KHJldmlldy5yYXRpbmcpO1xyXG4gICAgbGkuYXBwZW5kQ2hpbGQocmF0aW5nKTtcclxuXHJcbiAgICBjb25zdCBjb21tZW50cyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3AnKTtcclxuICAgIGNvbW1lbnRzLmlubmVySFRNTCA9IHJldmlldy5jb21tZW50cztcclxuICAgIGxpLmFwcGVuZENoaWxkKGNvbW1lbnRzKTtcclxuXHJcbiAgICByZXR1cm4gbGk7XHJcbiAgfVxyXG5cclxuXHJcblxyXG4gIC8qKlxyXG4gICAqIENyZWF0ZSByYXRpbmcgZWxlbWVudCBhcyBzdGFyc1xyXG4gICAqL1xyXG4gIGNyZWF0ZVJhdGluZ0VsZW1lbnQocmV2aWV3UmF0aW5nKSB7XHJcbiAgICBjb25zdCAkcmF0aW5nID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgncCcpO1xyXG4gICAgJHJhdGluZy5jbGFzc05hbWUgPSAncmV2aWV3LXJhdGluZyc7XHJcblxyXG4gICAgY29uc3QgaG9sbG93U3RhcnMgPSA1IC0gcmV2aWV3UmF0aW5nO1xyXG5cclxuICAgIGZvcihsZXQgaT0wOyBpPHJldmlld1JhdGluZzsgaSsrKXtcclxuICAgICAgY29uc3QgJHN0YXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzcGFuJyk7XHJcbiAgICAgICRzdGFyLmlubmVySFRNTCA9ICfimIUnO1xyXG4gICAgICAkcmF0aW5nLmFwcGVuZENoaWxkKCRzdGFyKTtcclxuICAgIH1cclxuXHJcbiAgICBmb3IobGV0IGk9MDsgaTxob2xsb3dTdGFyczsgaSsrKXtcclxuICAgICAgY29uc3QgJHN0YXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzcGFuJyk7XHJcbiAgICAgICRzdGFyLmlubmVySFRNTCA9ICfimIYnO1xyXG4gICAgICAkcmF0aW5nLmFwcGVuZENoaWxkKCRzdGFyKTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gJHJhdGluZztcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEFkZCByZXN0YXVyYW50IG5hbWUgdG8gdGhlIGJyZWFkY3J1bWIgbmF2aWdhdGlvbiBtZW51XHJcbiAgICovXHJcbiAgZmlsbEJyZWFkY3J1bWIoKSB7XHJcbiAgICBjb25zdCBicmVhZGNydW1iID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLmJyZWFkY3J1bWInKTtcclxuICAgIGNvbnN0IGxpID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnbGknKTtcclxuICAgIGxpLmlubmVySFRNTCA9IHRoaXMucmVzdGF1cmFudC5uYW1lO1xyXG4gICAgYnJlYWRjcnVtYi5hcHBlbmRDaGlsZChsaSk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBHZXQgYSBwYXJhbWV0ZXIgYnkgbmFtZSBmcm9tIHBhZ2UgVVJMLlxyXG4gICAqL1xyXG4gIGdldFBhcmFtZXRlckJ5TmFtZShuYW1lLCB1cmwpIHtcclxuICAgIGlmICghdXJsKXtcclxuICAgICAgdXJsID0gd2luZG93LmxvY2F0aW9uLmhyZWY7XHJcbiAgICB9XHJcbiAgICBjb25zdCBzYW5pdGl6ZVBhdHRlcm4gPSBuZXcgUmVnRXhwKCdbXFxcXFtcXFxcXV0nLCAnZycpO1xyXG4gICAgLy8gbmFtZSA9IG5hbWUucmVwbGFjZSgvW1xcW1xcXV0vZywgJ1xcXFwkJicpO1xyXG4gICAgbmFtZSA9IG5hbWUucmVwbGFjZShzYW5pdGl6ZVBhdHRlcm4sICdcXFxcJCYnKTtcclxuICAgIGNvbnN0IHJlZ2V4ID0gbmV3IFJlZ0V4cChgWz8mXSR7bmFtZX0oPShbXiYjXSopfCZ8I3wkKWApO1xyXG4gICAgY29uc3QgcmVzdWx0cyA9IHJlZ2V4LmV4ZWModXJsKTtcclxuICAgIGlmICghcmVzdWx0cylcclxuICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICBpZiAoIXJlc3VsdHNbMl0pXHJcbiAgICAgIHJldHVybiAnJztcclxuICAgIHJldHVybiBkZWNvZGVVUklDb21wb25lbnQocmVzdWx0c1syXS5yZXBsYWNlKC9cXCsvZywgJyAnKSk7XHJcbiAgfVxyXG5cclxuICBpbml0KCkge1xyXG4gICAgLyoqXHJcbiAgICAgKiBJbml0aWFsaXplIG1hcCBhcyBzb29uIGFzIHRoZSBwYWdlIGlzIGxvYWRlZC5cclxuICAgICAqL1xyXG4gICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignRE9NQ29udGVudExvYWRlZCcsICgpID0+IHtcclxuICAgICAgREJIZWxwZXIuZmV0Y2hNQVBCT1hUb2tlbigpLnRoZW4oIG1hcGJveFRva2VuID0+IHtcclxuICAgICAgICB0aGlzLmluaXRNYXAobWFwYm94VG9rZW4pOyAvLyBhZGRlZFxyXG4gICAgICB9KTtcclxuICAgIH0pO1xyXG4gIH1cclxufVxyXG5cclxuKCgpID0+IHtcclxuICBjb25zdCBpbnNpZGUgPSBuZXcgUmVzdGF1cmFudEluZm8oKTtcclxuICBpbnNpZGUuaW5pdCgpO1xyXG59KSgpOyJdfQ==
