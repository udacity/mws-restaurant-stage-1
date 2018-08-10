(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
/**
 * Common database helper functions.
 */

let fetchedCuisines;
let fetchedNeighborhoods;
const dbPromise = idb.open("mu-restaurant-review", 1, upgradeDB => {
  switch (upgradeDB.oldVersion) {
    case 0:
      upgradeDB.createObjectStore("restaurants", { keyPath: "id" });
    case 1:
      {
        const reviewsStore = upgradeDB.createObjectStore("reviews", { keyPath: "id" });
        reviewsStore.createIndex("restaurant_id", "restaurant_id");
      }
    case 2:
      upgradeDB.createObjectStore("pending", {
        keyPath: "id",
        autoIncrement: true
      });
  }
});

class DBHelper {

  /**
   * Database URL.
   * Change this to restaurants.json file location on your server.
   */
  static get DATABASE_URL() {
    const port = 1337; // Change this to your server port
    return `http://localhost:${port}/restaurants`;
  }

  /**
   * Fetch all restaurants.
   */
  static fetchRestaurants(callback, id) {
    let fetchURL;
    if (!id) {
      fetchURL = DBHelper.DATABASE_URL;
    } else {
      fetchURL = DBHelper.DATABASE_URL + "/" + id;
    }
    fetch(fetchURL, { method: "GET" }).then(response => {
      response.json().then(restaurants => {
        if (restaurants.length) {
          // Get all neighborhoods from all restaurants
          const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood);
          // Remove duplicates from neighborhoods
          fetchedNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i);

          // Get all cuisines from all restaurants
          const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type);
          // Remove duplicates from cuisines
          fetchedCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i);
        }

        callback(null, restaurants);
      });
    }).catch(error => {
      callback(`Request failed. Returned ${error}`, null);
    });
    // let xhr = new XMLHttpRequest();
    // xhr.open('GET', DBHelper.DATABASE_URL);
    // xhr.onload = () => {
    //   if (xhr.status === 200) { // Got a success response from server!
    //     const json = JSON.parse(xhr.responseText);
    //     const restaurants = json.restaurants;
    //     callback(null, restaurants);
    //   } else { // Oops!. Got an error from server.
    //     const error = (`Request failed. Returned status of ${xhr.status}`);
    //     callback(error, null);
    //   }
    // };
    // xhr.send();
  }

  /**
   * Fetch a restaurant by its ID.
   */
  static fetchRestaurantById(id, callback) {
    // fetch all restaurants with proper error handling.
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        const restaurant = restaurants.find(r => r.id == id);
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
  static fetchRestaurantByCuisine(cuisine, callback) {
    // Fetch all restaurants  with proper error handling
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given cuisine type
        const results = restaurants.filter(r => r.cuisine_type == cuisine);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a neighborhood with proper error handling.
   */
  static fetchRestaurantByNeighborhood(neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given neighborhood
        const results = restaurants.filter(r => r.neighborhood == neighborhood);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */
  static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        let results = restaurants;
        if (cuisine != 'all') {
          // filter by cuisine
          results = results.filter(r => r.cuisine_type == cuisine);
        }
        if (neighborhood != 'all') {
          // filter by neighborhood
          results = results.filter(r => r.neighborhood == neighborhood);
        }
        callback(null, results);
      }
    });
  }

  /**
   * Fetch all neighborhoods with proper error handling.
   */
  static fetchNeighborhoods(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all neighborhoods from all restaurants
        const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood);
        // Remove duplicates from neighborhoods
        const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i);
        callback(null, uniqueNeighborhoods);
      }
    });
  }

  /**
   * Fetch all cuisines with proper error handling.
   */
  static fetchCuisines(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all cuisines from all restaurants
        const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type);
        // Remove duplicates from cuisines
        const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i);
        callback(null, uniqueCuisines);
      }
    });
  }

  /**
   * Restaurant page URL.
   */
  static urlForRestaurant(restaurant) {
    return `./restaurant.html?id=${restaurant.id}`;
  }

  /**
   * Restaurant image URL.
   */
  static imageUrlForRestaurant(restaurant) {
    return `/img/${restaurant.photograph}.jpg`;
  }

  /**
   * Restaurant image alt tag.
   */
  static imageAltForRestaurant(restaurant) {
    return `${restaurant.name}`;
  }

  /**
   * Map marker for a restaurant.
   */
  static mapMarkerForRestaurant(restaurant, map) {
    const marker = new google.maps.Marker({
      position: restaurant.latlng,
      title: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant),
      map: map,
      animation: google.maps.Animation.DROP });
    return marker;
  }

}

},{}]},{},[1])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJhcHAvanMvZGJoZWxwZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTs7OztBQUlBLElBQUksZUFBSjtBQUNBLElBQUksb0JBQUo7QUFDQSxNQUFNLFlBQVksSUFBSSxJQUFKLENBQVMsc0JBQVQsRUFBaUMsQ0FBakMsRUFBb0MsYUFBYTtBQUNqRSxVQUFRLFVBQVUsVUFBbEI7QUFDRSxTQUFLLENBQUw7QUFDRSxnQkFBVSxpQkFBVixDQUE0QixhQUE1QixFQUEyQyxFQUFDLFNBQVMsSUFBVixFQUEzQztBQUNGLFNBQUssQ0FBTDtBQUNFO0FBQ0UsY0FBTSxlQUFlLFVBQVUsaUJBQVYsQ0FBNEIsU0FBNUIsRUFBdUMsRUFBQyxTQUFTLElBQVYsRUFBdkMsQ0FBckI7QUFDQSxxQkFBYSxXQUFiLENBQXlCLGVBQXpCLEVBQTBDLGVBQTFDO0FBQ0Q7QUFDSCxTQUFLLENBQUw7QUFDRSxnQkFBVSxpQkFBVixDQUE0QixTQUE1QixFQUF1QztBQUNyQyxpQkFBUyxJQUQ0QjtBQUVyQyx1QkFBZTtBQUZzQixPQUF2QztBQVRKO0FBY0QsQ0FmaUIsQ0FBbEI7O0FBaUJBLE1BQU0sUUFBTixDQUFlOztBQUViOzs7O0FBSUEsYUFBVyxZQUFYLEdBQTBCO0FBQ3hCLFVBQU0sT0FBTyxJQUFiLENBRHdCLENBQ047QUFDbEIsV0FBUSxvQkFBbUIsSUFBSyxjQUFoQztBQUNEOztBQUVEOzs7QUFHQSxTQUFPLGdCQUFQLENBQXdCLFFBQXhCLEVBQWtDLEVBQWxDLEVBQXNDO0FBQ3BDLFFBQUksUUFBSjtBQUNBLFFBQUksQ0FBQyxFQUFMLEVBQVM7QUFDUCxpQkFBVyxTQUFTLFlBQXBCO0FBQ0QsS0FGRCxNQUVPO0FBQ0wsaUJBQVcsU0FBUyxZQUFULEdBQXdCLEdBQXhCLEdBQThCLEVBQXpDO0FBQ0Q7QUFDRCxVQUFNLFFBQU4sRUFBZ0IsRUFBQyxRQUFRLEtBQVQsRUFBaEIsRUFB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QUFNLGlCQUFpQixTQUFTLE1BQVQsQ0FBZ0IsQ0FBQyxDQUFELEVBQUksQ0FBSixLQUFVLFNBQVMsT0FBVCxDQUFpQixDQUFqQixLQUF1QixDQUFqRCxDQUF2QjtBQUNBLGlCQUFTLElBQVQsRUFBZSxjQUFmO0FBQ0Q7QUFDRixLQVZEO0FBV0Q7O0FBRUQ7OztBQUdBLFNBQU8sZ0JBQVAsQ0FBd0IsVUFBeEIsRUFBb0M7QUFDbEMsV0FBUyx3QkFBdUIsV0FBVyxFQUFHLEVBQTlDO0FBQ0Q7O0FBRUQ7OztBQUdBLFNBQU8scUJBQVAsQ0FBNkIsVUFBN0IsRUFBeUM7QUFDdkMsV0FBUyxRQUFPLFdBQVcsVUFBVyxNQUF0QztBQUNEOztBQUVEOzs7QUFHQSxTQUFPLHFCQUFQLENBQTZCLFVBQTdCLEVBQXlDO0FBQ3ZDLFdBQVMsR0FBRSxXQUFXLElBQUssRUFBM0I7QUFDRDs7QUFFRDs7O0FBR0EsU0FBTyxzQkFBUCxDQUE4QixVQUE5QixFQUEwQyxHQUExQyxFQUErQztBQUM3QyxVQUFNLFNBQVMsSUFBSSxPQUFPLElBQVAsQ0FBWSxNQUFoQixDQUF1QjtBQUNwQyxnQkFBVSxXQUFXLE1BRGU7QUFFcEMsYUFBTyxXQUFXLElBRmtCO0FBR3BDLFdBQUssU0FBUyxnQkFBVCxDQUEwQixVQUExQixDQUgrQjtBQUlwQyxXQUFLLEdBSitCO0FBS3BDLGlCQUFXLE9BQU8sSUFBUCxDQUFZLFNBQVosQ0FBc0IsSUFMRyxFQUF2QixDQUFmO0FBT0EsV0FBTyxNQUFQO0FBQ0Q7O0FBdE1ZIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24oKXtmdW5jdGlvbiByKGUsbix0KXtmdW5jdGlvbiBvKGksZil7aWYoIW5baV0pe2lmKCFlW2ldKXt2YXIgYz1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlO2lmKCFmJiZjKXJldHVybiBjKGksITApO2lmKHUpcmV0dXJuIHUoaSwhMCk7dmFyIGE9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitpK1wiJ1wiKTt0aHJvdyBhLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsYX12YXIgcD1uW2ldPXtleHBvcnRzOnt9fTtlW2ldWzBdLmNhbGwocC5leHBvcnRzLGZ1bmN0aW9uKHIpe3ZhciBuPWVbaV1bMV1bcl07cmV0dXJuIG8obnx8cil9LHAscC5leHBvcnRzLHIsZSxuLHQpfXJldHVybiBuW2ldLmV4cG9ydHN9Zm9yKHZhciB1PVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmUsaT0wO2k8dC5sZW5ndGg7aSsrKW8odFtpXSk7cmV0dXJuIG99cmV0dXJuIHJ9KSgpIiwiLyoqXHJcbiAqIENvbW1vbiBkYXRhYmFzZSBoZWxwZXIgZnVuY3Rpb25zLlxyXG4gKi9cclxuXHJcbmxldCBmZXRjaGVkQ3Vpc2luZXM7XHJcbmxldCBmZXRjaGVkTmVpZ2hib3Job29kcztcclxuY29uc3QgZGJQcm9taXNlID0gaWRiLm9wZW4oXCJtdS1yZXN0YXVyYW50LXJldmlld1wiLCAxLCB1cGdyYWRlREIgPT4ge1xyXG4gIHN3aXRjaCAodXBncmFkZURCLm9sZFZlcnNpb24pIHtcclxuICAgIGNhc2UgMDpcclxuICAgICAgdXBncmFkZURCLmNyZWF0ZU9iamVjdFN0b3JlKFwicmVzdGF1cmFudHNcIiwge2tleVBhdGg6IFwiaWRcIn0pO1xyXG4gICAgY2FzZSAxOlxyXG4gICAgICB7XHJcbiAgICAgICAgY29uc3QgcmV2aWV3c1N0b3JlID0gdXBncmFkZURCLmNyZWF0ZU9iamVjdFN0b3JlKFwicmV2aWV3c1wiLCB7a2V5UGF0aDogXCJpZFwifSk7XHJcbiAgICAgICAgcmV2aWV3c1N0b3JlLmNyZWF0ZUluZGV4KFwicmVzdGF1cmFudF9pZFwiLCBcInJlc3RhdXJhbnRfaWRcIik7XHJcbiAgICAgIH1cclxuICAgIGNhc2UgMjpcclxuICAgICAgdXBncmFkZURCLmNyZWF0ZU9iamVjdFN0b3JlKFwicGVuZGluZ1wiLCB7XHJcbiAgICAgICAga2V5UGF0aDogXCJpZFwiLFxyXG4gICAgICAgIGF1dG9JbmNyZW1lbnQ6IHRydWVcclxuICAgICAgfSk7XHJcbiAgfVxyXG59KTtcclxuXHJcbmNsYXNzIERCSGVscGVyIHtcclxuXHJcbiAgLyoqXHJcbiAgICogRGF0YWJhc2UgVVJMLlxyXG4gICAqIENoYW5nZSB0aGlzIHRvIHJlc3RhdXJhbnRzLmpzb24gZmlsZSBsb2NhdGlvbiBvbiB5b3VyIHNlcnZlci5cclxuICAgKi9cclxuICBzdGF0aWMgZ2V0IERBVEFCQVNFX1VSTCgpIHtcclxuICAgIGNvbnN0IHBvcnQgPSAxMzM3IC8vIENoYW5nZSB0aGlzIHRvIHlvdXIgc2VydmVyIHBvcnRcclxuICAgIHJldHVybiBgaHR0cDovL2xvY2FsaG9zdDoke3BvcnR9L3Jlc3RhdXJhbnRzYDtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEZldGNoIGFsbCByZXN0YXVyYW50cy5cclxuICAgKi9cclxuICBzdGF0aWMgZmV0Y2hSZXN0YXVyYW50cyhjYWxsYmFjaywgaWQpIHtcclxuICAgIGxldCBmZXRjaFVSTDtcclxuICAgIGlmICghaWQpIHtcclxuICAgICAgZmV0Y2hVUkwgPSBEQkhlbHBlci5EQVRBQkFTRV9VUkw7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBmZXRjaFVSTCA9IERCSGVscGVyLkRBVEFCQVNFX1VSTCArIFwiL1wiICsgaWQ7XHJcbiAgICB9XHJcbiAgICBmZXRjaChmZXRjaFVSTCwge21ldGhvZDogXCJHRVRcIn0pLnRoZW4ocmVzcG9uc2UgPT4ge1xyXG4gICAgICByZXNwb25zZVxyXG4gICAgICAgIC5qc29uKClcclxuICAgICAgICAudGhlbihyZXN0YXVyYW50cyA9PiB7XHJcbiAgICAgICAgICBpZiAocmVzdGF1cmFudHMubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgIC8vIEdldCBhbGwgbmVpZ2hib3Job29kcyBmcm9tIGFsbCByZXN0YXVyYW50c1xyXG4gICAgICAgICAgICBjb25zdCBuZWlnaGJvcmhvb2RzID0gcmVzdGF1cmFudHMubWFwKCh2LCBpKSA9PiByZXN0YXVyYW50c1tpXS5uZWlnaGJvcmhvb2QpO1xyXG4gICAgICAgICAgICAvLyBSZW1vdmUgZHVwbGljYXRlcyBmcm9tIG5laWdoYm9yaG9vZHNcclxuICAgICAgICAgICAgZmV0Y2hlZE5laWdoYm9yaG9vZHMgPSBuZWlnaGJvcmhvb2RzLmZpbHRlcigodiwgaSkgPT4gbmVpZ2hib3Job29kcy5pbmRleE9mKHYpID09IGkpO1xyXG5cclxuICAgICAgICAgICAgLy8gR2V0IGFsbCBjdWlzaW5lcyBmcm9tIGFsbCByZXN0YXVyYW50c1xyXG4gICAgICAgICAgICBjb25zdCBjdWlzaW5lcyA9IHJlc3RhdXJhbnRzLm1hcCgodiwgaSkgPT4gcmVzdGF1cmFudHNbaV0uY3Vpc2luZV90eXBlKTtcclxuICAgICAgICAgICAgLy8gUmVtb3ZlIGR1cGxpY2F0ZXMgZnJvbSBjdWlzaW5lc1xyXG4gICAgICAgICAgICBmZXRjaGVkQ3Vpc2luZXMgPSBjdWlzaW5lcy5maWx0ZXIoKHYsIGkpID0+IGN1aXNpbmVzLmluZGV4T2YodikgPT0gaSk7XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgY2FsbGJhY2sobnVsbCwgcmVzdGF1cmFudHMpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfSkuY2F0Y2goZXJyb3IgPT4ge1xyXG4gICAgICBjYWxsYmFjayhgUmVxdWVzdCBmYWlsZWQuIFJldHVybmVkICR7ZXJyb3J9YCwgbnVsbCk7XHJcbiAgICB9KTtcclxuICAgIC8vIGxldCB4aHIgPSBuZXcgWE1MSHR0cFJlcXVlc3QoKTtcclxuICAgIC8vIHhoci5vcGVuKCdHRVQnLCBEQkhlbHBlci5EQVRBQkFTRV9VUkwpO1xyXG4gICAgLy8geGhyLm9ubG9hZCA9ICgpID0+IHtcclxuICAgIC8vICAgaWYgKHhoci5zdGF0dXMgPT09IDIwMCkgeyAvLyBHb3QgYSBzdWNjZXNzIHJlc3BvbnNlIGZyb20gc2VydmVyIVxyXG4gICAgLy8gICAgIGNvbnN0IGpzb24gPSBKU09OLnBhcnNlKHhoci5yZXNwb25zZVRleHQpO1xyXG4gICAgLy8gICAgIGNvbnN0IHJlc3RhdXJhbnRzID0ganNvbi5yZXN0YXVyYW50cztcclxuICAgIC8vICAgICBjYWxsYmFjayhudWxsLCByZXN0YXVyYW50cyk7XHJcbiAgICAvLyAgIH0gZWxzZSB7IC8vIE9vcHMhLiBHb3QgYW4gZXJyb3IgZnJvbSBzZXJ2ZXIuXHJcbiAgICAvLyAgICAgY29uc3QgZXJyb3IgPSAoYFJlcXVlc3QgZmFpbGVkLiBSZXR1cm5lZCBzdGF0dXMgb2YgJHt4aHIuc3RhdHVzfWApO1xyXG4gICAgLy8gICAgIGNhbGxiYWNrKGVycm9yLCBudWxsKTtcclxuICAgIC8vICAgfVxyXG4gICAgLy8gfTtcclxuICAgIC8vIHhoci5zZW5kKCk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBGZXRjaCBhIHJlc3RhdXJhbnQgYnkgaXRzIElELlxyXG4gICAqL1xyXG4gIHN0YXRpYyBmZXRjaFJlc3RhdXJhbnRCeUlkKGlkLCBjYWxsYmFjaykge1xyXG4gICAgLy8gZmV0Y2ggYWxsIHJlc3RhdXJhbnRzIHdpdGggcHJvcGVyIGVycm9yIGhhbmRsaW5nLlxyXG4gICAgREJIZWxwZXIuZmV0Y2hSZXN0YXVyYW50cygoZXJyb3IsIHJlc3RhdXJhbnRzKSA9PiB7XHJcbiAgICAgIGlmIChlcnJvcikge1xyXG4gICAgICAgIGNhbGxiYWNrKGVycm9yLCBudWxsKTtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICBjb25zdCByZXN0YXVyYW50ID0gcmVzdGF1cmFudHMuZmluZChyID0+IHIuaWQgPT0gaWQpO1xyXG4gICAgICAgIGlmIChyZXN0YXVyYW50KSB7IC8vIEdvdCB0aGUgcmVzdGF1cmFudFxyXG4gICAgICAgICAgY2FsbGJhY2sobnVsbCwgcmVzdGF1cmFudCk7XHJcbiAgICAgICAgfSBlbHNlIHsgLy8gUmVzdGF1cmFudCBkb2VzIG5vdCBleGlzdCBpbiB0aGUgZGF0YWJhc2VcclxuICAgICAgICAgIGNhbGxiYWNrKCdSZXN0YXVyYW50IGRvZXMgbm90IGV4aXN0JywgbnVsbCk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9KTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEZldGNoIHJlc3RhdXJhbnRzIGJ5IGEgY3Vpc2luZSB0eXBlIHdpdGggcHJvcGVyIGVycm9yIGhhbmRsaW5nLlxyXG4gICAqL1xyXG4gIHN0YXRpYyBmZXRjaFJlc3RhdXJhbnRCeUN1aXNpbmUoY3Vpc2luZSwgY2FsbGJhY2spIHtcclxuICAgIC8vIEZldGNoIGFsbCByZXN0YXVyYW50cyAgd2l0aCBwcm9wZXIgZXJyb3IgaGFuZGxpbmdcclxuICAgIERCSGVscGVyLmZldGNoUmVzdGF1cmFudHMoKGVycm9yLCByZXN0YXVyYW50cykgPT4ge1xyXG4gICAgICBpZiAoZXJyb3IpIHtcclxuICAgICAgICBjYWxsYmFjayhlcnJvciwgbnVsbCk7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgLy8gRmlsdGVyIHJlc3RhdXJhbnRzIHRvIGhhdmUgb25seSBnaXZlbiBjdWlzaW5lIHR5cGVcclxuICAgICAgICBjb25zdCByZXN1bHRzID0gcmVzdGF1cmFudHMuZmlsdGVyKHIgPT4gci5jdWlzaW5lX3R5cGUgPT0gY3Vpc2luZSk7XHJcbiAgICAgICAgY2FsbGJhY2sobnVsbCwgcmVzdWx0cyk7XHJcbiAgICAgIH1cclxuICAgIH0pO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogRmV0Y2ggcmVzdGF1cmFudHMgYnkgYSBuZWlnaGJvcmhvb2Qgd2l0aCBwcm9wZXIgZXJyb3IgaGFuZGxpbmcuXHJcbiAgICovXHJcbiAgc3RhdGljIGZldGNoUmVzdGF1cmFudEJ5TmVpZ2hib3Job29kKG5laWdoYm9yaG9vZCwgY2FsbGJhY2spIHtcclxuICAgIC8vIEZldGNoIGFsbCByZXN0YXVyYW50c1xyXG4gICAgREJIZWxwZXIuZmV0Y2hSZXN0YXVyYW50cygoZXJyb3IsIHJlc3RhdXJhbnRzKSA9PiB7XHJcbiAgICAgIGlmIChlcnJvcikge1xyXG4gICAgICAgIGNhbGxiYWNrKGVycm9yLCBudWxsKTtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICAvLyBGaWx0ZXIgcmVzdGF1cmFudHMgdG8gaGF2ZSBvbmx5IGdpdmVuIG5laWdoYm9yaG9vZFxyXG4gICAgICAgIGNvbnN0IHJlc3VsdHMgPSByZXN0YXVyYW50cy5maWx0ZXIociA9PiByLm5laWdoYm9yaG9vZCA9PSBuZWlnaGJvcmhvb2QpO1xyXG4gICAgICAgIGNhbGxiYWNrKG51bGwsIHJlc3VsdHMpO1xyXG4gICAgICB9XHJcbiAgICB9KTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEZldGNoIHJlc3RhdXJhbnRzIGJ5IGEgY3Vpc2luZSBhbmQgYSBuZWlnaGJvcmhvb2Qgd2l0aCBwcm9wZXIgZXJyb3IgaGFuZGxpbmcuXHJcbiAgICovXHJcbiAgc3RhdGljIGZldGNoUmVzdGF1cmFudEJ5Q3Vpc2luZUFuZE5laWdoYm9yaG9vZChjdWlzaW5lLCBuZWlnaGJvcmhvb2QsIGNhbGxiYWNrKSB7XHJcbiAgICAvLyBGZXRjaCBhbGwgcmVzdGF1cmFudHNcclxuICAgIERCSGVscGVyLmZldGNoUmVzdGF1cmFudHMoKGVycm9yLCByZXN0YXVyYW50cykgPT4ge1xyXG4gICAgICBpZiAoZXJyb3IpIHtcclxuICAgICAgICBjYWxsYmFjayhlcnJvciwgbnVsbCk7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgbGV0IHJlc3VsdHMgPSByZXN0YXVyYW50c1xyXG4gICAgICAgIGlmIChjdWlzaW5lICE9ICdhbGwnKSB7IC8vIGZpbHRlciBieSBjdWlzaW5lXHJcbiAgICAgICAgICByZXN1bHRzID0gcmVzdWx0cy5maWx0ZXIociA9PiByLmN1aXNpbmVfdHlwZSA9PSBjdWlzaW5lKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKG5laWdoYm9yaG9vZCAhPSAnYWxsJykgeyAvLyBmaWx0ZXIgYnkgbmVpZ2hib3Job29kXHJcbiAgICAgICAgICByZXN1bHRzID0gcmVzdWx0cy5maWx0ZXIociA9PiByLm5laWdoYm9yaG9vZCA9PSBuZWlnaGJvcmhvb2QpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBjYWxsYmFjayhudWxsLCByZXN1bHRzKTtcclxuICAgICAgfVxyXG4gICAgfSk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBGZXRjaCBhbGwgbmVpZ2hib3Job29kcyB3aXRoIHByb3BlciBlcnJvciBoYW5kbGluZy5cclxuICAgKi9cclxuICBzdGF0aWMgZmV0Y2hOZWlnaGJvcmhvb2RzKGNhbGxiYWNrKSB7XHJcbiAgICAvLyBGZXRjaCBhbGwgcmVzdGF1cmFudHNcclxuICAgIERCSGVscGVyLmZldGNoUmVzdGF1cmFudHMoKGVycm9yLCByZXN0YXVyYW50cykgPT4ge1xyXG4gICAgICBpZiAoZXJyb3IpIHtcclxuICAgICAgICBjYWxsYmFjayhlcnJvciwgbnVsbCk7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgLy8gR2V0IGFsbCBuZWlnaGJvcmhvb2RzIGZyb20gYWxsIHJlc3RhdXJhbnRzXHJcbiAgICAgICAgY29uc3QgbmVpZ2hib3Job29kcyA9IHJlc3RhdXJhbnRzLm1hcCgodiwgaSkgPT4gcmVzdGF1cmFudHNbaV0ubmVpZ2hib3Job29kKVxyXG4gICAgICAgIC8vIFJlbW92ZSBkdXBsaWNhdGVzIGZyb20gbmVpZ2hib3Job29kc1xyXG4gICAgICAgIGNvbnN0IHVuaXF1ZU5laWdoYm9yaG9vZHMgPSBuZWlnaGJvcmhvb2RzLmZpbHRlcigodiwgaSkgPT4gbmVpZ2hib3Job29kcy5pbmRleE9mKHYpID09IGkpXHJcbiAgICAgICAgY2FsbGJhY2sobnVsbCwgdW5pcXVlTmVpZ2hib3Job29kcyk7XHJcbiAgICAgIH1cclxuICAgIH0pO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogRmV0Y2ggYWxsIGN1aXNpbmVzIHdpdGggcHJvcGVyIGVycm9yIGhhbmRsaW5nLlxyXG4gICAqL1xyXG4gIHN0YXRpYyBmZXRjaEN1aXNpbmVzKGNhbGxiYWNrKSB7XHJcbiAgICAvLyBGZXRjaCBhbGwgcmVzdGF1cmFudHNcclxuICAgIERCSGVscGVyLmZldGNoUmVzdGF1cmFudHMoKGVycm9yLCByZXN0YXVyYW50cykgPT4ge1xyXG4gICAgICBpZiAoZXJyb3IpIHtcclxuICAgICAgICBjYWxsYmFjayhlcnJvciwgbnVsbCk7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgLy8gR2V0IGFsbCBjdWlzaW5lcyBmcm9tIGFsbCByZXN0YXVyYW50c1xyXG4gICAgICAgIGNvbnN0IGN1aXNpbmVzID0gcmVzdGF1cmFudHMubWFwKCh2LCBpKSA9PiByZXN0YXVyYW50c1tpXS5jdWlzaW5lX3R5cGUpXHJcbiAgICAgICAgLy8gUmVtb3ZlIGR1cGxpY2F0ZXMgZnJvbSBjdWlzaW5lc1xyXG4gICAgICAgIGNvbnN0IHVuaXF1ZUN1aXNpbmVzID0gY3Vpc2luZXMuZmlsdGVyKCh2LCBpKSA9PiBjdWlzaW5lcy5pbmRleE9mKHYpID09IGkpXHJcbiAgICAgICAgY2FsbGJhY2sobnVsbCwgdW5pcXVlQ3Vpc2luZXMpO1xyXG4gICAgICB9XHJcbiAgICB9KTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJlc3RhdXJhbnQgcGFnZSBVUkwuXHJcbiAgICovXHJcbiAgc3RhdGljIHVybEZvclJlc3RhdXJhbnQocmVzdGF1cmFudCkge1xyXG4gICAgcmV0dXJuIChgLi9yZXN0YXVyYW50Lmh0bWw/aWQ9JHtyZXN0YXVyYW50LmlkfWApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmVzdGF1cmFudCBpbWFnZSBVUkwuXHJcbiAgICovXHJcbiAgc3RhdGljIGltYWdlVXJsRm9yUmVzdGF1cmFudChyZXN0YXVyYW50KSB7XHJcbiAgICByZXR1cm4gKGAvaW1nLyR7cmVzdGF1cmFudC5waG90b2dyYXBofS5qcGdgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJlc3RhdXJhbnQgaW1hZ2UgYWx0IHRhZy5cclxuICAgKi9cclxuICBzdGF0aWMgaW1hZ2VBbHRGb3JSZXN0YXVyYW50KHJlc3RhdXJhbnQpIHtcclxuICAgIHJldHVybiAoYCR7cmVzdGF1cmFudC5uYW1lfWApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogTWFwIG1hcmtlciBmb3IgYSByZXN0YXVyYW50LlxyXG4gICAqL1xyXG4gIHN0YXRpYyBtYXBNYXJrZXJGb3JSZXN0YXVyYW50KHJlc3RhdXJhbnQsIG1hcCkge1xyXG4gICAgY29uc3QgbWFya2VyID0gbmV3IGdvb2dsZS5tYXBzLk1hcmtlcih7XHJcbiAgICAgIHBvc2l0aW9uOiByZXN0YXVyYW50LmxhdGxuZyxcclxuICAgICAgdGl0bGU6IHJlc3RhdXJhbnQubmFtZSxcclxuICAgICAgdXJsOiBEQkhlbHBlci51cmxGb3JSZXN0YXVyYW50KHJlc3RhdXJhbnQpLFxyXG4gICAgICBtYXA6IG1hcCxcclxuICAgICAgYW5pbWF0aW9uOiBnb29nbGUubWFwcy5BbmltYXRpb24uRFJPUH1cclxuICAgICk7XHJcbiAgICByZXR1cm4gbWFya2VyO1xyXG4gIH1cclxuXHJcbn1cclxuIl19
