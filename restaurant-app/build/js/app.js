const API_URL = 'http://localhost:1337/restaurants';
let fetchStatus = 0;

/*
 * Helper Functions for various IDb Operations
 */
class IDbOperationsHelper {
    static checkForIDbSupport() {
        if (!('indexedDB' in window)) {
            return 0;
        } else {
            return 1;
        }
    }

    static openIDb(name, version, objectStoreName) {
        const dbPromise = idb.open(name, version, upgradeDB => {
            upgradeDB.createObjectStore(objectStoreName, { autoIncrement: true });
        });
        return dbPromise;
    }

    static addToDb(dbPromise, objectStoreName, permision, jsonData) {
        dbPromise.then(db => {
            const transact = db.transaction(objectStoreName, permision);
            //Add all the json content here
            transact.objectStore(objectStoreName).put(jsonData);
            return transact.complete;
        }).then(response => {
            console.log('Restaurant saved to IDb');
        });
    }

    static getAllData(dbPromise, transactionName, objectStoreName) {
        let responseArrayPromise = dbPromise.then(db => db
            .transaction(transactionName)
            .objectStore(objectStoreName)
            .getAll()
            );
        responseArrayPromise.then(arry => {
            IDbOperationsHelper.setRestaurantsData(arry);
        });
    }

    static getRestaurantsFromServer(dbPromise, objectStoreName, permision, callback) {
        fetch(API_URL)
        .then(response => response.json())
        .then(responseJson => {
            responseJson.forEach(restaurant => {
                restaurant = IDbOperationsHelper.addMissingData(restaurant)
            });

            if (fetchStatus != 1) {
                fetchStatus = 1;
                responseJson.forEach(restaurantData => {

                    //Add every single restaurant data to IDb
                    IDbOperationsHelper.addToDb(
                        dbPromise,
                        objectStoreName,
                        permision,
                        restaurantData
                    );
                });
            }

            console.log(responseJson);
            callback (null, responseJson);
        }).catch(error => {
            console.log(`Unable to fetch restaurants, Error: ${error}`);
            callback (error, null);
        });
    }

    static getRestaurantsData(callback) {
        const idbName = 'restaurants-data';
        const dbVersion = 1;
        const objectStoreNameString = 'restaurants';
        const transactionNameString = 'restaurants';
        const dbPermission = 'readwrite';

        let dbPromise = IDbOperationsHelper.openIDb(
            idbName,
            dbVersion,
            objectStoreNameString
        );

        dbPromise.then(db =>
            db.transaction(transactionNameString)
              .objectStore(objectStoreNameString)
              .getAll()
        ).then(responseObejcts => {
            if (responseObejcts.length <= 0) {
                IDbOperationsHelper.getRestaurantsFromServer(
                    dbPromise,
                    objectStoreNameString,
                    dbPermission,
                    callback
                );
            } else {
                callback(null, responseObejcts);
            }
        });
    }

    // Handle for last entry on Restaurants List
    static addMissingData(restJson) {
        if (!isNaN(restJson.photograph)) {
            restJson.photograph = restJson.photograph + '.jpg';
        } else {
            restJson['photograph'] = restJson.id + '.jpg';
        }
        return restJson;
    }
}

/**
 * Common database helper functions.
 */
 class DBHelper {
  /**
   * Database URL.
   * Change this to restaurants.json file location on your server.
   */
   static get NEW_URL() {
   	return `http://localhost:1337/restaurants`;
   }
  /**
   * Fetch a restaurant by its ID.
   */
   static fetchRestaurantById(id, callback) {
	// fetch all restaurants with proper error handling.
	IDbOperationsHelper.getRestaurantsData((error, restaurants) => {
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
	IDbOperationsHelper.getRestaurantsData((error, restaurants) => {
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
	IDbOperationsHelper.getRestaurantsData((error, restaurants) => {
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
   static fetchRestaurantByCuisineAndNeighborhood(
   	cuisine,
   	neighborhood,
   	callback
   	) {
	// Fetch all restaurants
	IDbOperationsHelper.getRestaurantsData((error, restaurants) => {
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
	IDbOperationsHelper.getRestaurantsData((error, restaurants) => {
		if (error) {
			callback(error, null);
		} else {
		// Get all neighborhoods from all restaurants
		const neighborhoods = restaurants.map(
			(v, i) => restaurants[i].neighborhood
			);
		// Remove duplicates from neighborhoods
		const uniqueNeighborhoods = neighborhoods.filter(
			(v, i) => neighborhoods.indexOf(v) == i
			);
		callback(null, uniqueNeighborhoods);
	}
});
}

  /**
   * Fetch all cuisines with proper error handling.
   */
   static fetchCuisines(callback) {
	// Fetch all restaurants
	IDbOperationsHelper.getRestaurantsData((error, restaurants) => {
		if (error) {
			callback(error, null);
		} else {
		// Get all cuisines from all restaurants
		const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type);
		// Remove duplicates from cuisines
		const uniqueCuisines = cuisines.filter(
			(v, i) => cuisines.indexOf(v) == i
			);
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
   	return `/img/${restaurant.photograph}`;
   }

  /**
   * Map marker for a restaurant.
   */
   static mapMarkerForRestaurant(restaurant, map) {
   	const marker = new L.marker(
   		[restaurant.latlng.lat, restaurant.latlng.lng],
   		{
   			title: restaurant.name,
   			alt: restaurant.name,
   			url: DBHelper.urlForRestaurant(restaurant)
   		}
   		);
   	marker.addTo(newMap);
   	return marker;
   }
}
'use strict';

(function() {
  function toArray(arr) {
    return Array.prototype.slice.call(arr);
  }

  function promisifyRequest(request) {
    return new Promise(function(resolve, reject) {
      request.onsuccess = function() {
        resolve(request.result);
      };

      request.onerror = function() {
        reject(request.error);
      };
    });
  }

  function promisifyRequestCall(obj, method, args) {
    var request;
    var p = new Promise(function(resolve, reject) {
      request = obj[method].apply(obj, args);
      promisifyRequest(request).then(resolve, reject);
    });

    p.request = request;
    return p;
  }

  function promisifyCursorRequestCall(obj, method, args) {
    var p = promisifyRequestCall(obj, method, args);
    return p.then(function(value) {
      if (!value) return;
      return new Cursor(value, p.request);
    });
  }

  function proxyProperties(ProxyClass, targetProp, properties) {
    properties.forEach(function(prop) {
      Object.defineProperty(ProxyClass.prototype, prop, {
        get: function() {
          return this[targetProp][prop];
        },
        set: function(val) {
          this[targetProp][prop] = val;
        }
      });
    });
  }

  function proxyRequestMethods(ProxyClass, targetProp, Constructor, properties) {
    properties.forEach(function(prop) {
      if (!(prop in Constructor.prototype)) return;
      ProxyClass.prototype[prop] = function() {
        return promisifyRequestCall(this[targetProp], prop, arguments);
      };
    });
  }

  function proxyMethods(ProxyClass, targetProp, Constructor, properties) {
    properties.forEach(function(prop) {
      if (!(prop in Constructor.prototype)) return;
      ProxyClass.prototype[prop] = function() {
        return this[targetProp][prop].apply(this[targetProp], arguments);
      };
    });
  }

  function proxyCursorRequestMethods(ProxyClass, targetProp, Constructor, properties) {
    properties.forEach(function(prop) {
      if (!(prop in Constructor.prototype)) return;
      ProxyClass.prototype[prop] = function() {
        return promisifyCursorRequestCall(this[targetProp], prop, arguments);
      };
    });
  }

  function Index(index) {
    this._index = index;
  }

  proxyProperties(Index, '_index', [
    'name',
    'keyPath',
    'multiEntry',
    'unique'
  ]);

  proxyRequestMethods(Index, '_index', IDBIndex, [
    'get',
    'getKey',
    'getAll',
    'getAllKeys',
    'count'
  ]);

  proxyCursorRequestMethods(Index, '_index', IDBIndex, [
    'openCursor',
    'openKeyCursor'
  ]);

  function Cursor(cursor, request) {
    this._cursor = cursor;
    this._request = request;
  }

  proxyProperties(Cursor, '_cursor', [
    'direction',
    'key',
    'primaryKey',
    'value'
  ]);

  proxyRequestMethods(Cursor, '_cursor', IDBCursor, [
    'update',
    'delete'
  ]);

  // proxy 'next' methods
  ['advance', 'continue', 'continuePrimaryKey'].forEach(function(methodName) {
    if (!(methodName in IDBCursor.prototype)) return;
    Cursor.prototype[methodName] = function() {
      var cursor = this;
      var args = arguments;
      return Promise.resolve().then(function() {
        cursor._cursor[methodName].apply(cursor._cursor, args);
        return promisifyRequest(cursor._request).then(function(value) {
          if (!value) return;
          return new Cursor(value, cursor._request);
        });
      });
    };
  });

  function ObjectStore(store) {
    this._store = store;
  }

  ObjectStore.prototype.createIndex = function() {
    return new Index(this._store.createIndex.apply(this._store, arguments));
  };

  ObjectStore.prototype.index = function() {
    return new Index(this._store.index.apply(this._store, arguments));
  };

  proxyProperties(ObjectStore, '_store', [
    'name',
    'keyPath',
    'indexNames',
    'autoIncrement'
  ]);

  proxyRequestMethods(ObjectStore, '_store', IDBObjectStore, [
    'put',
    'add',
    'delete',
    'clear',
    'get',
    'getAll',
    'getKey',
    'getAllKeys',
    'count'
  ]);

  proxyCursorRequestMethods(ObjectStore, '_store', IDBObjectStore, [
    'openCursor',
    'openKeyCursor'
  ]);

  proxyMethods(ObjectStore, '_store', IDBObjectStore, [
    'deleteIndex'
  ]);

  function Transaction(idbTransaction) {
    this._tx = idbTransaction;
    this.complete = new Promise(function(resolve, reject) {
      idbTransaction.oncomplete = function() {
        resolve();
      };
      idbTransaction.onerror = function() {
        reject(idbTransaction.error);
      };
      idbTransaction.onabort = function() {
        reject(idbTransaction.error);
      };
    });
  }

  Transaction.prototype.objectStore = function() {
    return new ObjectStore(this._tx.objectStore.apply(this._tx, arguments));
  };

  proxyProperties(Transaction, '_tx', [
    'objectStoreNames',
    'mode'
  ]);

  proxyMethods(Transaction, '_tx', IDBTransaction, [
    'abort'
  ]);

  function UpgradeDB(db, oldVersion, transaction) {
    this._db = db;
    this.oldVersion = oldVersion;
    this.transaction = new Transaction(transaction);
  }

  UpgradeDB.prototype.createObjectStore = function() {
    return new ObjectStore(this._db.createObjectStore.apply(this._db, arguments));
  };

  proxyProperties(UpgradeDB, '_db', [
    'name',
    'version',
    'objectStoreNames'
  ]);

  proxyMethods(UpgradeDB, '_db', IDBDatabase, [
    'deleteObjectStore',
    'close'
  ]);

  function DB(db) {
    this._db = db;
  }

  DB.prototype.transaction = function() {
    return new Transaction(this._db.transaction.apply(this._db, arguments));
  };

  proxyProperties(DB, '_db', [
    'name',
    'version',
    'objectStoreNames'
  ]);

  proxyMethods(DB, '_db', IDBDatabase, [
    'close'
  ]);

  // Add cursor iterators
  // TODO: remove this once browsers do the right thing with promises
  ['openCursor', 'openKeyCursor'].forEach(function(funcName) {
    [ObjectStore, Index].forEach(function(Constructor) {
      // Don't create iterateKeyCursor if openKeyCursor doesn't exist.
      if (!(funcName in Constructor.prototype)) return;

      Constructor.prototype[funcName.replace('open', 'iterate')] = function() {
        var args = toArray(arguments);
        var callback = args[args.length - 1];
        var nativeObject = this._store || this._index;
        var request = nativeObject[funcName].apply(nativeObject, args.slice(0, -1));
        request.onsuccess = function() {
          callback(request.result);
        };
      };
    });
  });

  // polyfill getAll
  [Index, ObjectStore].forEach(function(Constructor) {
    if (Constructor.prototype.getAll) return;
    Constructor.prototype.getAll = function(query, count) {
      var instance = this;
      var items = [];

      return new Promise(function(resolve) {
        instance.iterateCursor(query, function(cursor) {
          if (!cursor) {
            resolve(items);
            return;
          }
          items.push(cursor.value);

          if (count !== undefined && items.length == count) {
            resolve(items);
            return;
          }
          cursor.continue();
        });
      });
    };
  });

  var exp = {
    open: function(name, version, upgradeCallback) {
      var p = promisifyRequestCall(indexedDB, 'open', [name, version]);
      var request = p.request;

      if (request) {
        request.onupgradeneeded = function(event) {
          if (upgradeCallback) {
            upgradeCallback(new UpgradeDB(request.result, event.oldVersion, request.transaction));
          }
        };
      }

      return p.then(function(db) {
        return new DB(db);
      });
    },
    delete: function(name) {
      return promisifyRequestCall(indexedDB, 'deleteDatabase', [name]);
    }
  };

  if (typeof module !== 'undefined') {
    module.exports = exp;
    module.exports.default = module.exports;
  }
  else {
    self.idb = exp;
  }
}());

if (navigator.serviceWorker) {
    navigator.serviceWorker.register('/sw.js').then(function(reg) {
        console.log(`Worker registered!: ${reg}`);
    }).catch(function(err) {
        console.log(err);
    });

}
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
 * Initialize leaflet map, called from HTML.
 */
initMap = () => {
    self.newMap = L.map('map', {
        center: [40.722216, -73.987501],
        zoom: 12,
        scrollWheelZoom: false
    });
    L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.jpg70?access_token={mapboxToken}', {
        mapboxToken: 'pk.eyJ1IjoiaW12cG4yMiIsImEiOiJjaml2bnlycGExM3FuM3FxbTc0eWM2NHV2In0.ESs374xN3guFAGO_1EPdmQ',
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
 * Update page and map for current restalisturants.
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
    li.setAttribute('tabindex', 0);

    const image = document.createElement('img');
    image.src = DBHelper.imageUrlForRestaurant(restaurant);
    image.className = 'restaurant-img';
    if (image.src == `http://localhost:8080/no-image`) {
        image.src = '';
        image.classList.add('fallback-image-icon');
    }
    image.alt = `${restaurant.name} restaurant image`;
    image.setAttribute('tabindex', 0);
    li.append(image);

    const details = document.createElement('div');
    details.className = 'restaurant-details';
    li.append(details);

    const name = document.createElement('h2');
    name.innerHTML = restaurant.name;
    name.setAttribute('tabindex', 0);
    details.append(name);

    const neighborhood = document.createElement('p');
    neighborhood.innerHTML = restaurant.neighborhood;
    neighborhood.setAttribute('tabindex', 0);
    details.append(neighborhood);

    const address = document.createElement('p');
    address.className = 'rest-address';
    address.innerHTML = `<i class='fa fa-map-marker'></i>` + restaurant.address;
    address.setAttribute('tabindex', 0);
    details.append(address);

    const more = document.createElement('a');
    more.innerHTML = 'View Details';
    more.href = DBHelper.urlForRestaurant(restaurant);
    more.setAttribute('aria-label', `View details of ${restaurant.name}`)
    details.append(more)

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


/* Manage focus and tabindex on filter options */




let restaurant;
var newMap;

/**
 * Initialize map as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {
    initMap();
});

/**
 * Initialize leaflet map
 */
initMap = () => {
    fetchRestaurantFromURL((error, restaurant) => {
        if (error) { // Got an error!
            console.error(error);
        } else {
            self.newMap = L.map('map', {
                center: [restaurant.latlng.lat, restaurant.latlng.lng],
                zoom: 16,
                scrollWheelZoom: false
            });
            L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.jpg70?access_token={mapboxToken}', {
                mapboxToken: 'pk.eyJ1IjoiaW12cG4yMiIsImEiOiJjaml2bnlycGExM3FuM3FxbTc0eWM2NHV2In0.ESs374xN3guFAGO_1EPdmQ',
                maxZoom: 18,
                attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
                '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
                'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
                id: 'mapbox.streets'
            }).addTo(newMap);
            fillBreadcrumb();
            DBHelper.mapMarkerForRestaurant(self.restaurant, self.newMap);
        }
    });
}

/* window.initMap = () => {
  fetchRestaurantFromURL((error, restaurant) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.map = new google.maps.Map(document.getElementById('map'), {
        zoom: 16,
        center: restaurant.latlng,
        scrollwheel: false
      });
      fillBreadcrumb();
      DBHelper.mapMarkerForRestaurant(self.restaurant, self.map);
    }
  });
} */

/**
 * Get current restaurant from page URL.
 */
fetchRestaurantFromURL = (callback) => {
    if (self.restaurant) { // restaurant already fetched!
        callback(null, self.restaurant)
        return;
    }
    const id = getParameterByName('id');
    if (!id) { // no id found in URL
        error = 'No restaurant id in URL'
        callback(error, null);
    } else {
        DBHelper.fetchRestaurantById(id, (error, restaurant) => {
            self.restaurant = restaurant;
            if (!restaurant) {
                console.error(error);
                return;
            }
            fillRestaurantHTML();
            callback(null, restaurant)
        });
    }
}

/**
 * Create restaurant HTML and add it to the webpage
 */
fillRestaurantHTML = (restaurant = self.restaurant) => {
    const name = document.getElementById('restaurant-name');
    name.innerHTML = restaurant.name;

    const address = document.getElementById('restaurant-address');
    address.innerHTML = `<i class='fa fa-map-marker'></i>` + restaurant.address;

    const image = document.getElementById('restaurant-img');
    image.className = 'restaurant-img'
    image.src = DBHelper.imageUrlForRestaurant(restaurant);
    if (image.src == `http://localhost:8080/no-image`) {
        image.classList.add('fallback-image-icon');
    }
    image.alt = `${restaurant.name} restaurant image`;

    const cuisine = document.getElementById('restaurant-cuisine');
    cuisine.innerHTML = restaurant.cuisine_type;

    // fill operating hours
    if (restaurant.operating_hours) {
        fillRestaurantHoursHTML();
    }
    // fill reviews
    fillReviewsHTML();
}

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
    const hours = document.getElementById('restaurant-hours');
    for (let key in operatingHours) {
        const row = document.createElement('tr');

        const day = document.createElement('td');
        day.innerHTML = key;
        row.appendChild(day);

        const time = document.createElement('td');
        time.innerHTML = operatingHours[key];
        row.appendChild(time);

        hours.appendChild(row);
    }
}

/**
 * Create all reviews HTML and add them to the webpage.
 */
fillReviewsHTML = (reviews = self.restaurant.reviews) => {
    const container = document.getElementById('reviews-container');
    const title = document.createElement('h2');
    title.innerHTML = 'Reviews';
    title.setAttribute('tabindex', 0);
    container.appendChild(title);

    if (!reviews) {
        const noReviews = document.createElement('p');
        noReviews.innerHTML = 'No reviews yet!';
        noReviews.setAttribute('tabindex', 0);
        container.appendChild(noReviews);
        return;
    }
    const ul = document.getElementById('reviews-list');
    reviews.forEach(review => {
        ul.appendChild(createReviewHTML(review));
    });
    container.appendChild(ul);
}

/**
 * Create review HTML and add it to the webpage.
 */
createReviewHTML = (review) => {
    const li = document.createElement('li');
    li.setAttribute('tabindex', 0);
    const name = document.createElement('p');
    name.className = 'review-user';
    name.innerHTML = `<i class='fa fa-user'></i>` + review.name;
    name.setAttribute('tabindex', 0);
    li.appendChild(name);

    const date = document.createElement('p');
    date.className = 'review-date';
    date.innerHTML = `<i class='fa fa-calendar'></i>` + review.date;
    date.setAttribute('tabindex', 0);
    li.appendChild(date);

    const rating = document.createElement('p');
    rating.className = 'review-rating';
    // rating.innerHTML = `<i class='fa fa-star'></i>Rating: ${review.rating}`;
    rating.innerHTML = '';
    rating.setAttribute('tabindex', 0);
    rating.setAttribute('aria-label', `Rating: ${review.rating} out of 5 stars`);

    // Filled star for rating
    for (i=0; i<review.rating; i++) {
        let star = document.createElement('i');
        star.className = 'fa fa-star';
        rating.appendChild(star);
    }
    for (i=review.rating; i<5; i++) {
        let star = document.createElement('i');
        star.className = 'far fa-star';
        rating.appendChild(star);
    }
    li.appendChild(rating);

    const comments = document.createElement('p');
    comments.className = 'review-comments';
    comments.innerHTML = review.comments;
    comments.setAttribute('tabindex', 0);
    li.appendChild(comments);

    return li;
}

/**
 * Add restaurant name to the breadcrumb navigation menu
 */
fillBreadcrumb = (restaurant=self.restaurant) => {
    const breadcrumb = document.getElementById('breadcrumb');
    const li = document.createElement('li');
    li.innerHTML = restaurant.name;
    breadcrumb.appendChild(li);
}

/**
 * Get a parameter by name from page URL.
 */
getParameterByName = (name, url) => {
    if (!url)
        url = window.location.href;
    name = name.replace(/[\[\]]/g, '\\$&');
    const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
        results = regex.exec(url);
    if (!results)
        return null;
    if (!results[2])
        return '';
    return decodeURIComponent(results[2].replace(/\+/g, ' '));
}

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIklEYk9wZXJhdGlvbnNIZWxwZXIuanMiLCJkYmhlbHBlci5qcyIsImlkYi5qcyIsImluZGV4Q29udHJvbGxlci5qcyIsIm1haW4uanMiLCJyZXN0YXVyYW50SW5mby5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDbkhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDbEtBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUM1VEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ1BBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN4T0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJhcHAuanMiLCJzb3VyY2VzQ29udGVudCI6WyJjb25zdCBBUElfVVJMID0gJ2h0dHA6Ly9sb2NhbGhvc3Q6MTMzNy9yZXN0YXVyYW50cyc7XG5sZXQgZmV0Y2hTdGF0dXMgPSAwO1xuXG4vKlxuICogSGVscGVyIEZ1bmN0aW9ucyBmb3IgdmFyaW91cyBJRGIgT3BlcmF0aW9uc1xuICovXG5jbGFzcyBJRGJPcGVyYXRpb25zSGVscGVyIHtcbiAgICBzdGF0aWMgY2hlY2tGb3JJRGJTdXBwb3J0KCkge1xuICAgICAgICBpZiAoISgnaW5kZXhlZERCJyBpbiB3aW5kb3cpKSB7XG4gICAgICAgICAgICByZXR1cm4gMDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiAxO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgc3RhdGljIG9wZW5JRGIobmFtZSwgdmVyc2lvbiwgb2JqZWN0U3RvcmVOYW1lKSB7XG4gICAgICAgIGNvbnN0IGRiUHJvbWlzZSA9IGlkYi5vcGVuKG5hbWUsIHZlcnNpb24sIHVwZ3JhZGVEQiA9PiB7XG4gICAgICAgICAgICB1cGdyYWRlREIuY3JlYXRlT2JqZWN0U3RvcmUob2JqZWN0U3RvcmVOYW1lLCB7IGF1dG9JbmNyZW1lbnQ6IHRydWUgfSk7XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gZGJQcm9taXNlO1xuICAgIH1cblxuICAgIHN0YXRpYyBhZGRUb0RiKGRiUHJvbWlzZSwgb2JqZWN0U3RvcmVOYW1lLCBwZXJtaXNpb24sIGpzb25EYXRhKSB7XG4gICAgICAgIGRiUHJvbWlzZS50aGVuKGRiID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHRyYW5zYWN0ID0gZGIudHJhbnNhY3Rpb24ob2JqZWN0U3RvcmVOYW1lLCBwZXJtaXNpb24pO1xuICAgICAgICAgICAgLy9BZGQgYWxsIHRoZSBqc29uIGNvbnRlbnQgaGVyZVxuICAgICAgICAgICAgdHJhbnNhY3Qub2JqZWN0U3RvcmUob2JqZWN0U3RvcmVOYW1lKS5wdXQoanNvbkRhdGEpO1xuICAgICAgICAgICAgcmV0dXJuIHRyYW5zYWN0LmNvbXBsZXRlO1xuICAgICAgICB9KS50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdSZXN0YXVyYW50IHNhdmVkIHRvIElEYicpO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBzdGF0aWMgZ2V0QWxsRGF0YShkYlByb21pc2UsIHRyYW5zYWN0aW9uTmFtZSwgb2JqZWN0U3RvcmVOYW1lKSB7XG4gICAgICAgIGxldCByZXNwb25zZUFycmF5UHJvbWlzZSA9IGRiUHJvbWlzZS50aGVuKGRiID0+IGRiXG4gICAgICAgICAgICAudHJhbnNhY3Rpb24odHJhbnNhY3Rpb25OYW1lKVxuICAgICAgICAgICAgLm9iamVjdFN0b3JlKG9iamVjdFN0b3JlTmFtZSlcbiAgICAgICAgICAgIC5nZXRBbGwoKVxuICAgICAgICAgICAgKTtcbiAgICAgICAgcmVzcG9uc2VBcnJheVByb21pc2UudGhlbihhcnJ5ID0+IHtcbiAgICAgICAgICAgIElEYk9wZXJhdGlvbnNIZWxwZXIuc2V0UmVzdGF1cmFudHNEYXRhKGFycnkpO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBzdGF0aWMgZ2V0UmVzdGF1cmFudHNGcm9tU2VydmVyKGRiUHJvbWlzZSwgb2JqZWN0U3RvcmVOYW1lLCBwZXJtaXNpb24sIGNhbGxiYWNrKSB7XG4gICAgICAgIGZldGNoKEFQSV9VUkwpXG4gICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHJlc3BvbnNlLmpzb24oKSlcbiAgICAgICAgLnRoZW4ocmVzcG9uc2VKc29uID0+IHtcbiAgICAgICAgICAgIHJlc3BvbnNlSnNvbi5mb3JFYWNoKHJlc3RhdXJhbnQgPT4ge1xuICAgICAgICAgICAgICAgIHJlc3RhdXJhbnQgPSBJRGJPcGVyYXRpb25zSGVscGVyLmFkZE1pc3NpbmdEYXRhKHJlc3RhdXJhbnQpXG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgaWYgKGZldGNoU3RhdHVzICE9IDEpIHtcbiAgICAgICAgICAgICAgICBmZXRjaFN0YXR1cyA9IDE7XG4gICAgICAgICAgICAgICAgcmVzcG9uc2VKc29uLmZvckVhY2gocmVzdGF1cmFudERhdGEgPT4ge1xuXG4gICAgICAgICAgICAgICAgICAgIC8vQWRkIGV2ZXJ5IHNpbmdsZSByZXN0YXVyYW50IGRhdGEgdG8gSURiXG4gICAgICAgICAgICAgICAgICAgIElEYk9wZXJhdGlvbnNIZWxwZXIuYWRkVG9EYihcbiAgICAgICAgICAgICAgICAgICAgICAgIGRiUHJvbWlzZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIG9iamVjdFN0b3JlTmFtZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHBlcm1pc2lvbixcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc3RhdXJhbnREYXRhXG4gICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbnNvbGUubG9nKHJlc3BvbnNlSnNvbik7XG4gICAgICAgICAgICBjYWxsYmFjayAobnVsbCwgcmVzcG9uc2VKc29uKTtcbiAgICAgICAgfSkuY2F0Y2goZXJyb3IgPT4ge1xuICAgICAgICAgICAgY29uc29sZS5sb2coYFVuYWJsZSB0byBmZXRjaCByZXN0YXVyYW50cywgRXJyb3I6ICR7ZXJyb3J9YCk7XG4gICAgICAgICAgICBjYWxsYmFjayAoZXJyb3IsIG51bGwpO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBzdGF0aWMgZ2V0UmVzdGF1cmFudHNEYXRhKGNhbGxiYWNrKSB7XG4gICAgICAgIGNvbnN0IGlkYk5hbWUgPSAncmVzdGF1cmFudHMtZGF0YSc7XG4gICAgICAgIGNvbnN0IGRiVmVyc2lvbiA9IDE7XG4gICAgICAgIGNvbnN0IG9iamVjdFN0b3JlTmFtZVN0cmluZyA9ICdyZXN0YXVyYW50cyc7XG4gICAgICAgIGNvbnN0IHRyYW5zYWN0aW9uTmFtZVN0cmluZyA9ICdyZXN0YXVyYW50cyc7XG4gICAgICAgIGNvbnN0IGRiUGVybWlzc2lvbiA9ICdyZWFkd3JpdGUnO1xuXG4gICAgICAgIGxldCBkYlByb21pc2UgPSBJRGJPcGVyYXRpb25zSGVscGVyLm9wZW5JRGIoXG4gICAgICAgICAgICBpZGJOYW1lLFxuICAgICAgICAgICAgZGJWZXJzaW9uLFxuICAgICAgICAgICAgb2JqZWN0U3RvcmVOYW1lU3RyaW5nXG4gICAgICAgICk7XG5cbiAgICAgICAgZGJQcm9taXNlLnRoZW4oZGIgPT5cbiAgICAgICAgICAgIGRiLnRyYW5zYWN0aW9uKHRyYW5zYWN0aW9uTmFtZVN0cmluZylcbiAgICAgICAgICAgICAgLm9iamVjdFN0b3JlKG9iamVjdFN0b3JlTmFtZVN0cmluZylcbiAgICAgICAgICAgICAgLmdldEFsbCgpXG4gICAgICAgICkudGhlbihyZXNwb25zZU9iZWpjdHMgPT4ge1xuICAgICAgICAgICAgaWYgKHJlc3BvbnNlT2JlamN0cy5sZW5ndGggPD0gMCkge1xuICAgICAgICAgICAgICAgIElEYk9wZXJhdGlvbnNIZWxwZXIuZ2V0UmVzdGF1cmFudHNGcm9tU2VydmVyKFxuICAgICAgICAgICAgICAgICAgICBkYlByb21pc2UsXG4gICAgICAgICAgICAgICAgICAgIG9iamVjdFN0b3JlTmFtZVN0cmluZyxcbiAgICAgICAgICAgICAgICAgICAgZGJQZXJtaXNzaW9uLFxuICAgICAgICAgICAgICAgICAgICBjYWxsYmFja1xuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGNhbGxiYWNrKG51bGwsIHJlc3BvbnNlT2JlamN0cyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIC8vIEhhbmRsZSBmb3IgbGFzdCBlbnRyeSBvbiBSZXN0YXVyYW50cyBMaXN0XG4gICAgc3RhdGljIGFkZE1pc3NpbmdEYXRhKHJlc3RKc29uKSB7XG4gICAgICAgIGlmICghaXNOYU4ocmVzdEpzb24ucGhvdG9ncmFwaCkpIHtcbiAgICAgICAgICAgIHJlc3RKc29uLnBob3RvZ3JhcGggPSByZXN0SnNvbi5waG90b2dyYXBoICsgJy5qcGcnO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmVzdEpzb25bJ3Bob3RvZ3JhcGgnXSA9IHJlc3RKc29uLmlkICsgJy5qcGcnO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXN0SnNvbjtcbiAgICB9XG59XG4iLCIvKipcclxuICogQ29tbW9uIGRhdGFiYXNlIGhlbHBlciBmdW5jdGlvbnMuXHJcbiAqL1xyXG4gY2xhc3MgREJIZWxwZXIge1xyXG4gIC8qKlxyXG4gICAqIERhdGFiYXNlIFVSTC5cclxuICAgKiBDaGFuZ2UgdGhpcyB0byByZXN0YXVyYW50cy5qc29uIGZpbGUgbG9jYXRpb24gb24geW91ciBzZXJ2ZXIuXHJcbiAgICovXHJcbiAgIHN0YXRpYyBnZXQgTkVXX1VSTCgpIHtcclxuICAgXHRyZXR1cm4gYGh0dHA6Ly9sb2NhbGhvc3Q6MTMzNy9yZXN0YXVyYW50c2A7XHJcbiAgIH1cclxuICAvKipcclxuICAgKiBGZXRjaCBhIHJlc3RhdXJhbnQgYnkgaXRzIElELlxyXG4gICAqL1xyXG4gICBzdGF0aWMgZmV0Y2hSZXN0YXVyYW50QnlJZChpZCwgY2FsbGJhY2spIHtcclxuXHQvLyBmZXRjaCBhbGwgcmVzdGF1cmFudHMgd2l0aCBwcm9wZXIgZXJyb3IgaGFuZGxpbmcuXHJcblx0SURiT3BlcmF0aW9uc0hlbHBlci5nZXRSZXN0YXVyYW50c0RhdGEoKGVycm9yLCByZXN0YXVyYW50cykgPT4ge1xyXG5cdFx0aWYgKGVycm9yKSB7XHJcblx0XHRcdGNhbGxiYWNrKGVycm9yLCBudWxsKTtcclxuXHRcdH0gZWxzZSB7XHJcblx0XHRcdGNvbnN0IHJlc3RhdXJhbnQgPSByZXN0YXVyYW50cy5maW5kKHIgPT4gci5pZCA9PSBpZCk7XHJcblx0XHRcdGlmIChyZXN0YXVyYW50KSB7XHJcblx0XHQgIC8vIEdvdCB0aGUgcmVzdGF1cmFudFxyXG5cdFx0ICBjYWxsYmFjayhudWxsLCByZXN0YXVyYW50KTtcclxuXHRcdH0gZWxzZSB7XHJcblx0XHQgIC8vIFJlc3RhdXJhbnQgZG9lcyBub3QgZXhpc3QgaW4gdGhlIGRhdGFiYXNlXHJcblx0XHQgIGNhbGxiYWNrKCdSZXN0YXVyYW50IGRvZXMgbm90IGV4aXN0JywgbnVsbCk7XHJcblx0XHR9XHJcblx0fVxyXG59KTtcclxufVxyXG5cclxuICAvKipcclxuICAgKiBGZXRjaCByZXN0YXVyYW50cyBieSBhIGN1aXNpbmUgdHlwZSB3aXRoIHByb3BlciBlcnJvciBoYW5kbGluZy5cclxuICAgKi9cclxuICAgc3RhdGljIGZldGNoUmVzdGF1cmFudEJ5Q3Vpc2luZShjdWlzaW5lLCBjYWxsYmFjaykge1xyXG5cdC8vIEZldGNoIGFsbCByZXN0YXVyYW50cyAgd2l0aCBwcm9wZXIgZXJyb3IgaGFuZGxpbmdcclxuXHRJRGJPcGVyYXRpb25zSGVscGVyLmdldFJlc3RhdXJhbnRzRGF0YSgoZXJyb3IsIHJlc3RhdXJhbnRzKSA9PiB7XHJcblx0XHRpZiAoZXJyb3IpIHtcclxuXHRcdFx0Y2FsbGJhY2soZXJyb3IsIG51bGwpO1xyXG5cdFx0fSBlbHNlIHtcclxuXHRcdC8vIEZpbHRlciByZXN0YXVyYW50cyB0byBoYXZlIG9ubHkgZ2l2ZW4gY3Vpc2luZSB0eXBlXHJcblx0XHRjb25zdCByZXN1bHRzID0gcmVzdGF1cmFudHMuZmlsdGVyKHIgPT4gci5jdWlzaW5lX3R5cGUgPT0gY3Vpc2luZSk7XHJcblx0XHRjYWxsYmFjayhudWxsLCByZXN1bHRzKTtcclxuXHR9XHJcbn0pO1xyXG59XHJcblxyXG4gIC8qKlxyXG4gICAqIEZldGNoIHJlc3RhdXJhbnRzIGJ5IGEgbmVpZ2hib3Job29kIHdpdGggcHJvcGVyIGVycm9yIGhhbmRsaW5nLlxyXG4gICAqL1xyXG4gICBzdGF0aWMgZmV0Y2hSZXN0YXVyYW50QnlOZWlnaGJvcmhvb2QobmVpZ2hib3Job29kLCBjYWxsYmFjaykge1xyXG5cdC8vIEZldGNoIGFsbCByZXN0YXVyYW50c1xyXG5cdElEYk9wZXJhdGlvbnNIZWxwZXIuZ2V0UmVzdGF1cmFudHNEYXRhKChlcnJvciwgcmVzdGF1cmFudHMpID0+IHtcclxuXHRcdGlmIChlcnJvcikge1xyXG5cdFx0XHRjYWxsYmFjayhlcnJvciwgbnVsbCk7XHJcblx0XHR9IGVsc2Uge1xyXG5cdFx0Ly8gRmlsdGVyIHJlc3RhdXJhbnRzIHRvIGhhdmUgb25seSBnaXZlbiBuZWlnaGJvcmhvb2RcclxuXHRcdGNvbnN0IHJlc3VsdHMgPSByZXN0YXVyYW50cy5maWx0ZXIociA9PiByLm5laWdoYm9yaG9vZCA9PSBuZWlnaGJvcmhvb2QpO1xyXG5cdFx0Y2FsbGJhY2sobnVsbCwgcmVzdWx0cyk7XHJcblx0fVxyXG59KTtcclxufVxyXG5cclxuICAvKipcclxuICAgKiBGZXRjaCByZXN0YXVyYW50cyBieSBhIGN1aXNpbmUgYW5kIGEgbmVpZ2hib3Job29kIHdpdGggcHJvcGVyIGVycm9yIGhhbmRsaW5nLlxyXG4gICAqL1xyXG4gICBzdGF0aWMgZmV0Y2hSZXN0YXVyYW50QnlDdWlzaW5lQW5kTmVpZ2hib3Job29kKFxyXG4gICBcdGN1aXNpbmUsXHJcbiAgIFx0bmVpZ2hib3Job29kLFxyXG4gICBcdGNhbGxiYWNrXHJcbiAgIFx0KSB7XHJcblx0Ly8gRmV0Y2ggYWxsIHJlc3RhdXJhbnRzXHJcblx0SURiT3BlcmF0aW9uc0hlbHBlci5nZXRSZXN0YXVyYW50c0RhdGEoKGVycm9yLCByZXN0YXVyYW50cykgPT4ge1xyXG5cdFx0aWYgKGVycm9yKSB7XHJcblx0XHRcdGNhbGxiYWNrKGVycm9yLCBudWxsKTtcclxuXHRcdH0gZWxzZSB7XHJcblx0XHRcdGxldCByZXN1bHRzID0gcmVzdGF1cmFudHM7XHJcblx0XHRcdGlmIChjdWlzaW5lICE9ICdhbGwnKSB7XHJcblx0XHQgIC8vIGZpbHRlciBieSBjdWlzaW5lXHJcblx0XHQgIHJlc3VsdHMgPSByZXN1bHRzLmZpbHRlcihyID0+IHIuY3Vpc2luZV90eXBlID09IGN1aXNpbmUpO1xyXG5cdFx0fVxyXG5cdFx0aWYgKG5laWdoYm9yaG9vZCAhPSAnYWxsJykge1xyXG5cdFx0ICAvLyBmaWx0ZXIgYnkgbmVpZ2hib3Job29kXHJcblx0XHQgIHJlc3VsdHMgPSByZXN1bHRzLmZpbHRlcihyID0+IHIubmVpZ2hib3Job29kID09IG5laWdoYm9yaG9vZCk7XHJcblx0XHR9XHJcblx0XHRjYWxsYmFjayhudWxsLCByZXN1bHRzKTtcclxuXHR9XHJcbn0pO1xyXG59XHJcblxyXG4gIC8qKlxyXG4gICAqIEZldGNoIGFsbCBuZWlnaGJvcmhvb2RzIHdpdGggcHJvcGVyIGVycm9yIGhhbmRsaW5nLlxyXG4gICAqL1xyXG4gICBzdGF0aWMgZmV0Y2hOZWlnaGJvcmhvb2RzKGNhbGxiYWNrKSB7XHJcblx0Ly8gRmV0Y2ggYWxsIHJlc3RhdXJhbnRzXHJcblx0SURiT3BlcmF0aW9uc0hlbHBlci5nZXRSZXN0YXVyYW50c0RhdGEoKGVycm9yLCByZXN0YXVyYW50cykgPT4ge1xyXG5cdFx0aWYgKGVycm9yKSB7XHJcblx0XHRcdGNhbGxiYWNrKGVycm9yLCBudWxsKTtcclxuXHRcdH0gZWxzZSB7XHJcblx0XHQvLyBHZXQgYWxsIG5laWdoYm9yaG9vZHMgZnJvbSBhbGwgcmVzdGF1cmFudHNcclxuXHRcdGNvbnN0IG5laWdoYm9yaG9vZHMgPSByZXN0YXVyYW50cy5tYXAoXHJcblx0XHRcdCh2LCBpKSA9PiByZXN0YXVyYW50c1tpXS5uZWlnaGJvcmhvb2RcclxuXHRcdFx0KTtcclxuXHRcdC8vIFJlbW92ZSBkdXBsaWNhdGVzIGZyb20gbmVpZ2hib3Job29kc1xyXG5cdFx0Y29uc3QgdW5pcXVlTmVpZ2hib3Job29kcyA9IG5laWdoYm9yaG9vZHMuZmlsdGVyKFxyXG5cdFx0XHQodiwgaSkgPT4gbmVpZ2hib3Job29kcy5pbmRleE9mKHYpID09IGlcclxuXHRcdFx0KTtcclxuXHRcdGNhbGxiYWNrKG51bGwsIHVuaXF1ZU5laWdoYm9yaG9vZHMpO1xyXG5cdH1cclxufSk7XHJcbn1cclxuXHJcbiAgLyoqXHJcbiAgICogRmV0Y2ggYWxsIGN1aXNpbmVzIHdpdGggcHJvcGVyIGVycm9yIGhhbmRsaW5nLlxyXG4gICAqL1xyXG4gICBzdGF0aWMgZmV0Y2hDdWlzaW5lcyhjYWxsYmFjaykge1xyXG5cdC8vIEZldGNoIGFsbCByZXN0YXVyYW50c1xyXG5cdElEYk9wZXJhdGlvbnNIZWxwZXIuZ2V0UmVzdGF1cmFudHNEYXRhKChlcnJvciwgcmVzdGF1cmFudHMpID0+IHtcclxuXHRcdGlmIChlcnJvcikge1xyXG5cdFx0XHRjYWxsYmFjayhlcnJvciwgbnVsbCk7XHJcblx0XHR9IGVsc2Uge1xyXG5cdFx0Ly8gR2V0IGFsbCBjdWlzaW5lcyBmcm9tIGFsbCByZXN0YXVyYW50c1xyXG5cdFx0Y29uc3QgY3Vpc2luZXMgPSByZXN0YXVyYW50cy5tYXAoKHYsIGkpID0+IHJlc3RhdXJhbnRzW2ldLmN1aXNpbmVfdHlwZSk7XHJcblx0XHQvLyBSZW1vdmUgZHVwbGljYXRlcyBmcm9tIGN1aXNpbmVzXHJcblx0XHRjb25zdCB1bmlxdWVDdWlzaW5lcyA9IGN1aXNpbmVzLmZpbHRlcihcclxuXHRcdFx0KHYsIGkpID0+IGN1aXNpbmVzLmluZGV4T2YodikgPT0gaVxyXG5cdFx0XHQpO1xyXG5cdFx0Y2FsbGJhY2sobnVsbCwgdW5pcXVlQ3Vpc2luZXMpO1xyXG5cdH1cclxufSk7XHJcbn1cclxuXHJcbiAgLyoqXHJcbiAgICogUmVzdGF1cmFudCBwYWdlIFVSTC5cclxuICAgKi9cclxuICAgc3RhdGljIHVybEZvclJlc3RhdXJhbnQocmVzdGF1cmFudCkge1xyXG4gICBcdHJldHVybiBgLi9yZXN0YXVyYW50Lmh0bWw/aWQ9JHtyZXN0YXVyYW50LmlkfWA7XHJcbiAgIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmVzdGF1cmFudCBpbWFnZSBVUkwuXHJcbiAgICovXHJcbiAgIHN0YXRpYyBpbWFnZVVybEZvclJlc3RhdXJhbnQocmVzdGF1cmFudCkge1xyXG4gICBcdHJldHVybiBgL2ltZy8ke3Jlc3RhdXJhbnQucGhvdG9ncmFwaH1gO1xyXG4gICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIE1hcCBtYXJrZXIgZm9yIGEgcmVzdGF1cmFudC5cclxuICAgKi9cclxuICAgc3RhdGljIG1hcE1hcmtlckZvclJlc3RhdXJhbnQocmVzdGF1cmFudCwgbWFwKSB7XHJcbiAgIFx0Y29uc3QgbWFya2VyID0gbmV3IEwubWFya2VyKFxyXG4gICBcdFx0W3Jlc3RhdXJhbnQubGF0bG5nLmxhdCwgcmVzdGF1cmFudC5sYXRsbmcubG5nXSxcclxuICAgXHRcdHtcclxuICAgXHRcdFx0dGl0bGU6IHJlc3RhdXJhbnQubmFtZSxcclxuICAgXHRcdFx0YWx0OiByZXN0YXVyYW50Lm5hbWUsXHJcbiAgIFx0XHRcdHVybDogREJIZWxwZXIudXJsRm9yUmVzdGF1cmFudChyZXN0YXVyYW50KVxyXG4gICBcdFx0fVxyXG4gICBcdFx0KTtcclxuICAgXHRtYXJrZXIuYWRkVG8obmV3TWFwKTtcclxuICAgXHRyZXR1cm4gbWFya2VyO1xyXG4gICB9XHJcbn0iLCIndXNlIHN0cmljdCc7XG5cbihmdW5jdGlvbigpIHtcbiAgZnVuY3Rpb24gdG9BcnJheShhcnIpIHtcbiAgICByZXR1cm4gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJyKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHByb21pc2lmeVJlcXVlc3QocmVxdWVzdCkge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbihyZXNvbHZlLCByZWplY3QpIHtcbiAgICAgIHJlcXVlc3Qub25zdWNjZXNzID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHJlc29sdmUocmVxdWVzdC5yZXN1bHQpO1xuICAgICAgfTtcblxuICAgICAgcmVxdWVzdC5vbmVycm9yID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHJlamVjdChyZXF1ZXN0LmVycm9yKTtcbiAgICAgIH07XG4gICAgfSk7XG4gIH1cblxuICBmdW5jdGlvbiBwcm9taXNpZnlSZXF1ZXN0Q2FsbChvYmosIG1ldGhvZCwgYXJncykge1xuICAgIHZhciByZXF1ZXN0O1xuICAgIHZhciBwID0gbmV3IFByb21pc2UoZnVuY3Rpb24ocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICByZXF1ZXN0ID0gb2JqW21ldGhvZF0uYXBwbHkob2JqLCBhcmdzKTtcbiAgICAgIHByb21pc2lmeVJlcXVlc3QocmVxdWVzdCkudGhlbihyZXNvbHZlLCByZWplY3QpO1xuICAgIH0pO1xuXG4gICAgcC5yZXF1ZXN0ID0gcmVxdWVzdDtcbiAgICByZXR1cm4gcDtcbiAgfVxuXG4gIGZ1bmN0aW9uIHByb21pc2lmeUN1cnNvclJlcXVlc3RDYWxsKG9iaiwgbWV0aG9kLCBhcmdzKSB7XG4gICAgdmFyIHAgPSBwcm9taXNpZnlSZXF1ZXN0Q2FsbChvYmosIG1ldGhvZCwgYXJncyk7XG4gICAgcmV0dXJuIHAudGhlbihmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgaWYgKCF2YWx1ZSkgcmV0dXJuO1xuICAgICAgcmV0dXJuIG5ldyBDdXJzb3IodmFsdWUsIHAucmVxdWVzdCk7XG4gICAgfSk7XG4gIH1cblxuICBmdW5jdGlvbiBwcm94eVByb3BlcnRpZXMoUHJveHlDbGFzcywgdGFyZ2V0UHJvcCwgcHJvcGVydGllcykge1xuICAgIHByb3BlcnRpZXMuZm9yRWFjaChmdW5jdGlvbihwcm9wKSB7XG4gICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoUHJveHlDbGFzcy5wcm90b3R5cGUsIHByb3AsIHtcbiAgICAgICAgZ2V0OiBmdW5jdGlvbigpIHtcbiAgICAgICAgICByZXR1cm4gdGhpc1t0YXJnZXRQcm9wXVtwcm9wXTtcbiAgICAgICAgfSxcbiAgICAgICAgc2V0OiBmdW5jdGlvbih2YWwpIHtcbiAgICAgICAgICB0aGlzW3RhcmdldFByb3BdW3Byb3BdID0gdmFsO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHByb3h5UmVxdWVzdE1ldGhvZHMoUHJveHlDbGFzcywgdGFyZ2V0UHJvcCwgQ29uc3RydWN0b3IsIHByb3BlcnRpZXMpIHtcbiAgICBwcm9wZXJ0aWVzLmZvckVhY2goZnVuY3Rpb24ocHJvcCkge1xuICAgICAgaWYgKCEocHJvcCBpbiBDb25zdHJ1Y3Rvci5wcm90b3R5cGUpKSByZXR1cm47XG4gICAgICBQcm94eUNsYXNzLnByb3RvdHlwZVtwcm9wXSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gcHJvbWlzaWZ5UmVxdWVzdENhbGwodGhpc1t0YXJnZXRQcm9wXSwgcHJvcCwgYXJndW1lbnRzKTtcbiAgICAgIH07XG4gICAgfSk7XG4gIH1cblxuICBmdW5jdGlvbiBwcm94eU1ldGhvZHMoUHJveHlDbGFzcywgdGFyZ2V0UHJvcCwgQ29uc3RydWN0b3IsIHByb3BlcnRpZXMpIHtcbiAgICBwcm9wZXJ0aWVzLmZvckVhY2goZnVuY3Rpb24ocHJvcCkge1xuICAgICAgaWYgKCEocHJvcCBpbiBDb25zdHJ1Y3Rvci5wcm90b3R5cGUpKSByZXR1cm47XG4gICAgICBQcm94eUNsYXNzLnByb3RvdHlwZVtwcm9wXSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gdGhpc1t0YXJnZXRQcm9wXVtwcm9wXS5hcHBseSh0aGlzW3RhcmdldFByb3BdLCBhcmd1bWVudHMpO1xuICAgICAgfTtcbiAgICB9KTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHByb3h5Q3Vyc29yUmVxdWVzdE1ldGhvZHMoUHJveHlDbGFzcywgdGFyZ2V0UHJvcCwgQ29uc3RydWN0b3IsIHByb3BlcnRpZXMpIHtcbiAgICBwcm9wZXJ0aWVzLmZvckVhY2goZnVuY3Rpb24ocHJvcCkge1xuICAgICAgaWYgKCEocHJvcCBpbiBDb25zdHJ1Y3Rvci5wcm90b3R5cGUpKSByZXR1cm47XG4gICAgICBQcm94eUNsYXNzLnByb3RvdHlwZVtwcm9wXSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gcHJvbWlzaWZ5Q3Vyc29yUmVxdWVzdENhbGwodGhpc1t0YXJnZXRQcm9wXSwgcHJvcCwgYXJndW1lbnRzKTtcbiAgICAgIH07XG4gICAgfSk7XG4gIH1cblxuICBmdW5jdGlvbiBJbmRleChpbmRleCkge1xuICAgIHRoaXMuX2luZGV4ID0gaW5kZXg7XG4gIH1cblxuICBwcm94eVByb3BlcnRpZXMoSW5kZXgsICdfaW5kZXgnLCBbXG4gICAgJ25hbWUnLFxuICAgICdrZXlQYXRoJyxcbiAgICAnbXVsdGlFbnRyeScsXG4gICAgJ3VuaXF1ZSdcbiAgXSk7XG5cbiAgcHJveHlSZXF1ZXN0TWV0aG9kcyhJbmRleCwgJ19pbmRleCcsIElEQkluZGV4LCBbXG4gICAgJ2dldCcsXG4gICAgJ2dldEtleScsXG4gICAgJ2dldEFsbCcsXG4gICAgJ2dldEFsbEtleXMnLFxuICAgICdjb3VudCdcbiAgXSk7XG5cbiAgcHJveHlDdXJzb3JSZXF1ZXN0TWV0aG9kcyhJbmRleCwgJ19pbmRleCcsIElEQkluZGV4LCBbXG4gICAgJ29wZW5DdXJzb3InLFxuICAgICdvcGVuS2V5Q3Vyc29yJ1xuICBdKTtcblxuICBmdW5jdGlvbiBDdXJzb3IoY3Vyc29yLCByZXF1ZXN0KSB7XG4gICAgdGhpcy5fY3Vyc29yID0gY3Vyc29yO1xuICAgIHRoaXMuX3JlcXVlc3QgPSByZXF1ZXN0O1xuICB9XG5cbiAgcHJveHlQcm9wZXJ0aWVzKEN1cnNvciwgJ19jdXJzb3InLCBbXG4gICAgJ2RpcmVjdGlvbicsXG4gICAgJ2tleScsXG4gICAgJ3ByaW1hcnlLZXknLFxuICAgICd2YWx1ZSdcbiAgXSk7XG5cbiAgcHJveHlSZXF1ZXN0TWV0aG9kcyhDdXJzb3IsICdfY3Vyc29yJywgSURCQ3Vyc29yLCBbXG4gICAgJ3VwZGF0ZScsXG4gICAgJ2RlbGV0ZSdcbiAgXSk7XG5cbiAgLy8gcHJveHkgJ25leHQnIG1ldGhvZHNcbiAgWydhZHZhbmNlJywgJ2NvbnRpbnVlJywgJ2NvbnRpbnVlUHJpbWFyeUtleSddLmZvckVhY2goZnVuY3Rpb24obWV0aG9kTmFtZSkge1xuICAgIGlmICghKG1ldGhvZE5hbWUgaW4gSURCQ3Vyc29yLnByb3RvdHlwZSkpIHJldHVybjtcbiAgICBDdXJzb3IucHJvdG90eXBlW21ldGhvZE5hbWVdID0gZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgY3Vyc29yID0gdGhpcztcbiAgICAgIHZhciBhcmdzID0gYXJndW1lbnRzO1xuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpLnRoZW4oZnVuY3Rpb24oKSB7XG4gICAgICAgIGN1cnNvci5fY3Vyc29yW21ldGhvZE5hbWVdLmFwcGx5KGN1cnNvci5fY3Vyc29yLCBhcmdzKTtcbiAgICAgICAgcmV0dXJuIHByb21pc2lmeVJlcXVlc3QoY3Vyc29yLl9yZXF1ZXN0KS50aGVuKGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICAgICAgaWYgKCF2YWx1ZSkgcmV0dXJuO1xuICAgICAgICAgIHJldHVybiBuZXcgQ3Vyc29yKHZhbHVlLCBjdXJzb3IuX3JlcXVlc3QpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH07XG4gIH0pO1xuXG4gIGZ1bmN0aW9uIE9iamVjdFN0b3JlKHN0b3JlKSB7XG4gICAgdGhpcy5fc3RvcmUgPSBzdG9yZTtcbiAgfVxuXG4gIE9iamVjdFN0b3JlLnByb3RvdHlwZS5jcmVhdGVJbmRleCA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBuZXcgSW5kZXgodGhpcy5fc3RvcmUuY3JlYXRlSW5kZXguYXBwbHkodGhpcy5fc3RvcmUsIGFyZ3VtZW50cykpO1xuICB9O1xuXG4gIE9iamVjdFN0b3JlLnByb3RvdHlwZS5pbmRleCA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBuZXcgSW5kZXgodGhpcy5fc3RvcmUuaW5kZXguYXBwbHkodGhpcy5fc3RvcmUsIGFyZ3VtZW50cykpO1xuICB9O1xuXG4gIHByb3h5UHJvcGVydGllcyhPYmplY3RTdG9yZSwgJ19zdG9yZScsIFtcbiAgICAnbmFtZScsXG4gICAgJ2tleVBhdGgnLFxuICAgICdpbmRleE5hbWVzJyxcbiAgICAnYXV0b0luY3JlbWVudCdcbiAgXSk7XG5cbiAgcHJveHlSZXF1ZXN0TWV0aG9kcyhPYmplY3RTdG9yZSwgJ19zdG9yZScsIElEQk9iamVjdFN0b3JlLCBbXG4gICAgJ3B1dCcsXG4gICAgJ2FkZCcsXG4gICAgJ2RlbGV0ZScsXG4gICAgJ2NsZWFyJyxcbiAgICAnZ2V0JyxcbiAgICAnZ2V0QWxsJyxcbiAgICAnZ2V0S2V5JyxcbiAgICAnZ2V0QWxsS2V5cycsXG4gICAgJ2NvdW50J1xuICBdKTtcblxuICBwcm94eUN1cnNvclJlcXVlc3RNZXRob2RzKE9iamVjdFN0b3JlLCAnX3N0b3JlJywgSURCT2JqZWN0U3RvcmUsIFtcbiAgICAnb3BlbkN1cnNvcicsXG4gICAgJ29wZW5LZXlDdXJzb3InXG4gIF0pO1xuXG4gIHByb3h5TWV0aG9kcyhPYmplY3RTdG9yZSwgJ19zdG9yZScsIElEQk9iamVjdFN0b3JlLCBbXG4gICAgJ2RlbGV0ZUluZGV4J1xuICBdKTtcblxuICBmdW5jdGlvbiBUcmFuc2FjdGlvbihpZGJUcmFuc2FjdGlvbikge1xuICAgIHRoaXMuX3R4ID0gaWRiVHJhbnNhY3Rpb247XG4gICAgdGhpcy5jb21wbGV0ZSA9IG5ldyBQcm9taXNlKGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgaWRiVHJhbnNhY3Rpb24ub25jb21wbGV0ZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXNvbHZlKCk7XG4gICAgICB9O1xuICAgICAgaWRiVHJhbnNhY3Rpb24ub25lcnJvciA9IGZ1bmN0aW9uKCkge1xuICAgICAgICByZWplY3QoaWRiVHJhbnNhY3Rpb24uZXJyb3IpO1xuICAgICAgfTtcbiAgICAgIGlkYlRyYW5zYWN0aW9uLm9uYWJvcnQgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgcmVqZWN0KGlkYlRyYW5zYWN0aW9uLmVycm9yKTtcbiAgICAgIH07XG4gICAgfSk7XG4gIH1cblxuICBUcmFuc2FjdGlvbi5wcm90b3R5cGUub2JqZWN0U3RvcmUgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gbmV3IE9iamVjdFN0b3JlKHRoaXMuX3R4Lm9iamVjdFN0b3JlLmFwcGx5KHRoaXMuX3R4LCBhcmd1bWVudHMpKTtcbiAgfTtcblxuICBwcm94eVByb3BlcnRpZXMoVHJhbnNhY3Rpb24sICdfdHgnLCBbXG4gICAgJ29iamVjdFN0b3JlTmFtZXMnLFxuICAgICdtb2RlJ1xuICBdKTtcblxuICBwcm94eU1ldGhvZHMoVHJhbnNhY3Rpb24sICdfdHgnLCBJREJUcmFuc2FjdGlvbiwgW1xuICAgICdhYm9ydCdcbiAgXSk7XG5cbiAgZnVuY3Rpb24gVXBncmFkZURCKGRiLCBvbGRWZXJzaW9uLCB0cmFuc2FjdGlvbikge1xuICAgIHRoaXMuX2RiID0gZGI7XG4gICAgdGhpcy5vbGRWZXJzaW9uID0gb2xkVmVyc2lvbjtcbiAgICB0aGlzLnRyYW5zYWN0aW9uID0gbmV3IFRyYW5zYWN0aW9uKHRyYW5zYWN0aW9uKTtcbiAgfVxuXG4gIFVwZ3JhZGVEQi5wcm90b3R5cGUuY3JlYXRlT2JqZWN0U3RvcmUgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gbmV3IE9iamVjdFN0b3JlKHRoaXMuX2RiLmNyZWF0ZU9iamVjdFN0b3JlLmFwcGx5KHRoaXMuX2RiLCBhcmd1bWVudHMpKTtcbiAgfTtcblxuICBwcm94eVByb3BlcnRpZXMoVXBncmFkZURCLCAnX2RiJywgW1xuICAgICduYW1lJyxcbiAgICAndmVyc2lvbicsXG4gICAgJ29iamVjdFN0b3JlTmFtZXMnXG4gIF0pO1xuXG4gIHByb3h5TWV0aG9kcyhVcGdyYWRlREIsICdfZGInLCBJREJEYXRhYmFzZSwgW1xuICAgICdkZWxldGVPYmplY3RTdG9yZScsXG4gICAgJ2Nsb3NlJ1xuICBdKTtcblxuICBmdW5jdGlvbiBEQihkYikge1xuICAgIHRoaXMuX2RiID0gZGI7XG4gIH1cblxuICBEQi5wcm90b3R5cGUudHJhbnNhY3Rpb24gPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gbmV3IFRyYW5zYWN0aW9uKHRoaXMuX2RiLnRyYW5zYWN0aW9uLmFwcGx5KHRoaXMuX2RiLCBhcmd1bWVudHMpKTtcbiAgfTtcblxuICBwcm94eVByb3BlcnRpZXMoREIsICdfZGInLCBbXG4gICAgJ25hbWUnLFxuICAgICd2ZXJzaW9uJyxcbiAgICAnb2JqZWN0U3RvcmVOYW1lcydcbiAgXSk7XG5cbiAgcHJveHlNZXRob2RzKERCLCAnX2RiJywgSURCRGF0YWJhc2UsIFtcbiAgICAnY2xvc2UnXG4gIF0pO1xuXG4gIC8vIEFkZCBjdXJzb3IgaXRlcmF0b3JzXG4gIC8vIFRPRE86IHJlbW92ZSB0aGlzIG9uY2UgYnJvd3NlcnMgZG8gdGhlIHJpZ2h0IHRoaW5nIHdpdGggcHJvbWlzZXNcbiAgWydvcGVuQ3Vyc29yJywgJ29wZW5LZXlDdXJzb3InXS5mb3JFYWNoKGZ1bmN0aW9uKGZ1bmNOYW1lKSB7XG4gICAgW09iamVjdFN0b3JlLCBJbmRleF0uZm9yRWFjaChmdW5jdGlvbihDb25zdHJ1Y3Rvcikge1xuICAgICAgLy8gRG9uJ3QgY3JlYXRlIGl0ZXJhdGVLZXlDdXJzb3IgaWYgb3BlbktleUN1cnNvciBkb2Vzbid0IGV4aXN0LlxuICAgICAgaWYgKCEoZnVuY05hbWUgaW4gQ29uc3RydWN0b3IucHJvdG90eXBlKSkgcmV0dXJuO1xuXG4gICAgICBDb25zdHJ1Y3Rvci5wcm90b3R5cGVbZnVuY05hbWUucmVwbGFjZSgnb3BlbicsICdpdGVyYXRlJyldID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBhcmdzID0gdG9BcnJheShhcmd1bWVudHMpO1xuICAgICAgICB2YXIgY2FsbGJhY2sgPSBhcmdzW2FyZ3MubGVuZ3RoIC0gMV07XG4gICAgICAgIHZhciBuYXRpdmVPYmplY3QgPSB0aGlzLl9zdG9yZSB8fCB0aGlzLl9pbmRleDtcbiAgICAgICAgdmFyIHJlcXVlc3QgPSBuYXRpdmVPYmplY3RbZnVuY05hbWVdLmFwcGx5KG5hdGl2ZU9iamVjdCwgYXJncy5zbGljZSgwLCAtMSkpO1xuICAgICAgICByZXF1ZXN0Lm9uc3VjY2VzcyA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgIGNhbGxiYWNrKHJlcXVlc3QucmVzdWx0KTtcbiAgICAgICAgfTtcbiAgICAgIH07XG4gICAgfSk7XG4gIH0pO1xuXG4gIC8vIHBvbHlmaWxsIGdldEFsbFxuICBbSW5kZXgsIE9iamVjdFN0b3JlXS5mb3JFYWNoKGZ1bmN0aW9uKENvbnN0cnVjdG9yKSB7XG4gICAgaWYgKENvbnN0cnVjdG9yLnByb3RvdHlwZS5nZXRBbGwpIHJldHVybjtcbiAgICBDb25zdHJ1Y3Rvci5wcm90b3R5cGUuZ2V0QWxsID0gZnVuY3Rpb24ocXVlcnksIGNvdW50KSB7XG4gICAgICB2YXIgaW5zdGFuY2UgPSB0aGlzO1xuICAgICAgdmFyIGl0ZW1zID0gW107XG5cbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbihyZXNvbHZlKSB7XG4gICAgICAgIGluc3RhbmNlLml0ZXJhdGVDdXJzb3IocXVlcnksIGZ1bmN0aW9uKGN1cnNvcikge1xuICAgICAgICAgIGlmICghY3Vyc29yKSB7XG4gICAgICAgICAgICByZXNvbHZlKGl0ZW1zKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9XG4gICAgICAgICAgaXRlbXMucHVzaChjdXJzb3IudmFsdWUpO1xuXG4gICAgICAgICAgaWYgKGNvdW50ICE9PSB1bmRlZmluZWQgJiYgaXRlbXMubGVuZ3RoID09IGNvdW50KSB7XG4gICAgICAgICAgICByZXNvbHZlKGl0ZW1zKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9XG4gICAgICAgICAgY3Vyc29yLmNvbnRpbnVlKCk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfTtcbiAgfSk7XG5cbiAgdmFyIGV4cCA9IHtcbiAgICBvcGVuOiBmdW5jdGlvbihuYW1lLCB2ZXJzaW9uLCB1cGdyYWRlQ2FsbGJhY2spIHtcbiAgICAgIHZhciBwID0gcHJvbWlzaWZ5UmVxdWVzdENhbGwoaW5kZXhlZERCLCAnb3BlbicsIFtuYW1lLCB2ZXJzaW9uXSk7XG4gICAgICB2YXIgcmVxdWVzdCA9IHAucmVxdWVzdDtcblxuICAgICAgaWYgKHJlcXVlc3QpIHtcbiAgICAgICAgcmVxdWVzdC5vbnVwZ3JhZGVuZWVkZWQgPSBmdW5jdGlvbihldmVudCkge1xuICAgICAgICAgIGlmICh1cGdyYWRlQ2FsbGJhY2spIHtcbiAgICAgICAgICAgIHVwZ3JhZGVDYWxsYmFjayhuZXcgVXBncmFkZURCKHJlcXVlc3QucmVzdWx0LCBldmVudC5vbGRWZXJzaW9uLCByZXF1ZXN0LnRyYW5zYWN0aW9uKSk7XG4gICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gcC50aGVuKGZ1bmN0aW9uKGRiKSB7XG4gICAgICAgIHJldHVybiBuZXcgREIoZGIpO1xuICAgICAgfSk7XG4gICAgfSxcbiAgICBkZWxldGU6IGZ1bmN0aW9uKG5hbWUpIHtcbiAgICAgIHJldHVybiBwcm9taXNpZnlSZXF1ZXN0Q2FsbChpbmRleGVkREIsICdkZWxldGVEYXRhYmFzZScsIFtuYW1lXSk7XG4gICAgfVxuICB9O1xuXG4gIGlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJykge1xuICAgIG1vZHVsZS5leHBvcnRzID0gZXhwO1xuICAgIG1vZHVsZS5leHBvcnRzLmRlZmF1bHQgPSBtb2R1bGUuZXhwb3J0cztcbiAgfVxuICBlbHNlIHtcbiAgICBzZWxmLmlkYiA9IGV4cDtcbiAgfVxufSgpKTtcbiIsImlmIChuYXZpZ2F0b3Iuc2VydmljZVdvcmtlcikge1xuICAgIG5hdmlnYXRvci5zZXJ2aWNlV29ya2VyLnJlZ2lzdGVyKCcvc3cuanMnKS50aGVuKGZ1bmN0aW9uKHJlZykge1xuICAgICAgICBjb25zb2xlLmxvZyhgV29ya2VyIHJlZ2lzdGVyZWQhOiAke3JlZ31gKTtcbiAgICB9KS5jYXRjaChmdW5jdGlvbihlcnIpIHtcbiAgICAgICAgY29uc29sZS5sb2coZXJyKTtcbiAgICB9KTtcblxufSIsImxldCByZXN0YXVyYW50cyxcclxuICAgIG5laWdoYm9yaG9vZHMsXHJcbiAgICBjdWlzaW5lc1xyXG52YXIgbmV3TWFwXHJcbnZhciBtYXJrZXJzID0gW11cclxuXHJcbi8qKlxyXG4gKiBGZXRjaCBuZWlnaGJvcmhvb2RzIGFuZCBjdWlzaW5lcyBhcyBzb29uIGFzIHRoZSBwYWdlIGlzIGxvYWRlZC5cclxuICovXHJcbmRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ0RPTUNvbnRlbnRMb2FkZWQnLCAoZXZlbnQpID0+IHtcclxuICAgIGluaXRNYXAoKTsgLy8gYWRkZWRcclxuICAgIGZldGNoTmVpZ2hib3Job29kcygpO1xyXG4gICAgZmV0Y2hDdWlzaW5lcygpO1xyXG59KTtcclxuXHJcbi8qKlxyXG4gKiBGZXRjaCBhbGwgbmVpZ2hib3Job29kcyBhbmQgc2V0IHRoZWlyIEhUTUwuXHJcbiAqL1xyXG5mZXRjaE5laWdoYm9yaG9vZHMgPSAoKSA9PiB7XHJcbiAgICBEQkhlbHBlci5mZXRjaE5laWdoYm9yaG9vZHMoKGVycm9yLCBuZWlnaGJvcmhvb2RzKSA9PiB7XHJcbiAgICAgICAgaWYgKGVycm9yKSB7IC8vIEdvdCBhbiBlcnJvclxyXG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGVycm9yKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBzZWxmLm5laWdoYm9yaG9vZHMgPSBuZWlnaGJvcmhvb2RzO1xyXG4gICAgICAgICAgICBmaWxsTmVpZ2hib3Job29kc0hUTUwoKTtcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxufVxyXG5cclxuLyoqXHJcbiAqIFNldCBuZWlnaGJvcmhvb2RzIEhUTUwuXHJcbiAqL1xyXG5maWxsTmVpZ2hib3Job29kc0hUTUwgPSAobmVpZ2hib3Job29kcyA9IHNlbGYubmVpZ2hib3Job29kcykgPT4ge1xyXG4gICAgY29uc3Qgc2VsZWN0ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ25laWdoYm9yaG9vZHMtc2VsZWN0Jyk7XHJcbiAgICBuZWlnaGJvcmhvb2RzLmZvckVhY2gobmVpZ2hib3Job29kID0+IHtcclxuICAgICAgICBjb25zdCBvcHRpb24gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdvcHRpb24nKTtcclxuICAgICAgICBvcHRpb24uaW5uZXJIVE1MID0gbmVpZ2hib3Job29kO1xyXG4gICAgICAgIG9wdGlvbi52YWx1ZSA9IG5laWdoYm9yaG9vZDtcclxuICAgICAgICBzZWxlY3QuYXBwZW5kKG9wdGlvbik7XHJcbiAgICB9KTtcclxufVxyXG5cclxuLyoqXHJcbiAqIEZldGNoIGFsbCBjdWlzaW5lcyBhbmQgc2V0IHRoZWlyIEhUTUwuXHJcbiAqL1xyXG5mZXRjaEN1aXNpbmVzID0gKCkgPT4ge1xyXG4gICAgREJIZWxwZXIuZmV0Y2hDdWlzaW5lcygoZXJyb3IsIGN1aXNpbmVzKSA9PiB7XHJcbiAgICAgICAgaWYgKGVycm9yKSB7IC8vIEdvdCBhbiBlcnJvciFcclxuICAgICAgICAgICAgY29uc29sZS5lcnJvcihlcnJvcik7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgc2VsZi5jdWlzaW5lcyA9IGN1aXNpbmVzO1xyXG4gICAgICAgICAgICBmaWxsQ3Vpc2luZXNIVE1MKCk7XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBTZXQgY3Vpc2luZXMgSFRNTC5cclxuICovXHJcbmZpbGxDdWlzaW5lc0hUTUwgPSAoY3Vpc2luZXMgPSBzZWxmLmN1aXNpbmVzKSA9PiB7XHJcbiAgICBjb25zdCBzZWxlY3QgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnY3Vpc2luZXMtc2VsZWN0Jyk7XHJcblxyXG4gICAgY3Vpc2luZXMuZm9yRWFjaChjdWlzaW5lID0+IHtcclxuICAgICAgICBjb25zdCBvcHRpb24gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdvcHRpb24nKTtcclxuICAgICAgICBvcHRpb24uaW5uZXJIVE1MID0gY3Vpc2luZTtcclxuICAgICAgICBvcHRpb24udmFsdWUgPSBjdWlzaW5lO1xyXG4gICAgICAgIHNlbGVjdC5hcHBlbmQob3B0aW9uKTtcclxuICAgIH0pO1xyXG59XHJcblxyXG4vKipcclxuICogSW5pdGlhbGl6ZSBsZWFmbGV0IG1hcCwgY2FsbGVkIGZyb20gSFRNTC5cclxuICovXHJcbmluaXRNYXAgPSAoKSA9PiB7XHJcbiAgICBzZWxmLm5ld01hcCA9IEwubWFwKCdtYXAnLCB7XHJcbiAgICAgICAgY2VudGVyOiBbNDAuNzIyMjE2LCAtNzMuOTg3NTAxXSxcclxuICAgICAgICB6b29tOiAxMixcclxuICAgICAgICBzY3JvbGxXaGVlbFpvb206IGZhbHNlXHJcbiAgICB9KTtcclxuICAgIEwudGlsZUxheWVyKCdodHRwczovL2FwaS50aWxlcy5tYXBib3guY29tL3Y0L3tpZH0ve3p9L3t4fS97eX0uanBnNzA/YWNjZXNzX3Rva2VuPXttYXBib3hUb2tlbn0nLCB7XHJcbiAgICAgICAgbWFwYm94VG9rZW46ICdway5leUoxSWpvaWFXMTJjRzR5TWlJc0ltRWlPaUpqYW1sMmJubHljR0V4TTNGdU0zRnhiVGMwZVdNMk5IVjJJbjAuRVNzMzc0eE4zZ3VGQUdPXzFFUGRtUScsXHJcbiAgICAgICAgbWF4Wm9vbTogMTgsXHJcbiAgICAgICAgYXR0cmlidXRpb246ICdNYXAgZGF0YSAmY29weTsgPGEgaHJlZj1cImh0dHBzOi8vd3d3Lm9wZW5zdHJlZXRtYXAub3JnL1wiPk9wZW5TdHJlZXRNYXA8L2E+IGNvbnRyaWJ1dG9ycywgJyArXHJcbiAgICAgICAgJzxhIGhyZWY9XCJodHRwczovL2NyZWF0aXZlY29tbW9ucy5vcmcvbGljZW5zZXMvYnktc2EvMi4wL1wiPkNDLUJZLVNBPC9hPiwgJyArXHJcbiAgICAgICAgJ0ltYWdlcnkgwqkgPGEgaHJlZj1cImh0dHBzOi8vd3d3Lm1hcGJveC5jb20vXCI+TWFwYm94PC9hPicsXHJcbiAgICAgICAgaWQ6ICdtYXBib3guc3RyZWV0cydcclxuICAgIH0pLmFkZFRvKG5ld01hcCk7XHJcblxyXG4gICAgdXBkYXRlUmVzdGF1cmFudHMoKTtcclxufVxyXG4vKiB3aW5kb3cuaW5pdE1hcCA9ICgpID0+IHtcclxuICBsZXQgbG9jID0ge1xyXG4gICAgbGF0OiA0MC43MjIyMTYsXHJcbiAgICBsbmc6IC03My45ODc1MDFcclxuICB9O1xyXG4gIHNlbGYubWFwID0gbmV3IGdvb2dsZS5tYXBzLk1hcChkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbWFwJyksIHtcclxuICAgIHpvb206IDEyLFxyXG4gICAgY2VudGVyOiBsb2MsXHJcbiAgICBzY3JvbGx3aGVlbDogZmFsc2VcclxuICB9KTtcclxuICB1cGRhdGVSZXN0YXVyYW50cygpO1xyXG59ICovXHJcblxyXG4vKipcclxuICogVXBkYXRlIHBhZ2UgYW5kIG1hcCBmb3IgY3VycmVudCByZXN0YWxpc3R1cmFudHMuXHJcbiAqL1xyXG51cGRhdGVSZXN0YXVyYW50cyA9ICgpID0+IHtcclxuICAgIGNvbnN0IGNTZWxlY3QgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnY3Vpc2luZXMtc2VsZWN0Jyk7XHJcbiAgICBjb25zdCBuU2VsZWN0ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ25laWdoYm9yaG9vZHMtc2VsZWN0Jyk7XHJcblxyXG4gICAgY29uc3QgY0luZGV4ID0gY1NlbGVjdC5zZWxlY3RlZEluZGV4O1xyXG4gICAgY29uc3QgbkluZGV4ID0gblNlbGVjdC5zZWxlY3RlZEluZGV4O1xyXG5cclxuICAgIGNvbnN0IGN1aXNpbmUgPSBjU2VsZWN0W2NJbmRleF0udmFsdWU7XHJcbiAgICBjb25zdCBuZWlnaGJvcmhvb2QgPSBuU2VsZWN0W25JbmRleF0udmFsdWU7XHJcblxyXG4gICAgREJIZWxwZXIuZmV0Y2hSZXN0YXVyYW50QnlDdWlzaW5lQW5kTmVpZ2hib3Job29kKGN1aXNpbmUsIG5laWdoYm9yaG9vZCwgKGVycm9yLCByZXN0YXVyYW50cykgPT4ge1xyXG4gICAgICAgIGlmIChlcnJvcikgeyAvLyBHb3QgYW4gZXJyb3IhXHJcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyb3IpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHJlc2V0UmVzdGF1cmFudHMocmVzdGF1cmFudHMpO1xyXG4gICAgICAgICAgICBmaWxsUmVzdGF1cmFudHNIVE1MKCk7XHJcbiAgICAgICAgfVxyXG4gICAgfSlcclxufVxyXG5cclxuLyoqXHJcbiAqIENsZWFyIGN1cnJlbnQgcmVzdGF1cmFudHMsIHRoZWlyIEhUTUwgYW5kIHJlbW92ZSB0aGVpciBtYXAgbWFya2Vycy5cclxuICovXHJcbnJlc2V0UmVzdGF1cmFudHMgPSAocmVzdGF1cmFudHMpID0+IHtcclxuICAgIC8vIFJlbW92ZSBhbGwgcmVzdGF1cmFudHNcclxuICAgIHNlbGYucmVzdGF1cmFudHMgPSBbXTtcclxuICAgIGNvbnN0IHVsID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3Jlc3RhdXJhbnRzLWxpc3QnKTtcclxuICAgIHVsLmlubmVySFRNTCA9ICcnO1xyXG5cclxuICAgIC8vIFJlbW92ZSBhbGwgbWFwIG1hcmtlcnNcclxuICAgIGlmIChzZWxmLm1hcmtlcnMpIHtcclxuICAgICAgICBzZWxmLm1hcmtlcnMuZm9yRWFjaChtYXJrZXIgPT4gbWFya2VyLnJlbW92ZSgpKTtcclxuICAgIH1cclxuICAgIHNlbGYubWFya2VycyA9IFtdO1xyXG4gICAgc2VsZi5yZXN0YXVyYW50cyA9IHJlc3RhdXJhbnRzO1xyXG59XHJcblxyXG4vKipcclxuICogQ3JlYXRlIGFsbCByZXN0YXVyYW50cyBIVE1MIGFuZCBhZGQgdGhlbSB0byB0aGUgd2VicGFnZS5cclxuICovXHJcbmZpbGxSZXN0YXVyYW50c0hUTUwgPSAocmVzdGF1cmFudHMgPSBzZWxmLnJlc3RhdXJhbnRzKSA9PiB7XHJcbiAgICBjb25zdCB1bCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyZXN0YXVyYW50cy1saXN0Jyk7XHJcbiAgICByZXN0YXVyYW50cy5mb3JFYWNoKHJlc3RhdXJhbnQgPT4ge1xyXG4gICAgICAgIHVsLmFwcGVuZChjcmVhdGVSZXN0YXVyYW50SFRNTChyZXN0YXVyYW50KSk7XHJcbiAgICB9KTtcclxuICAgIGFkZE1hcmtlcnNUb01hcCgpO1xyXG59XHJcblxyXG4vKipcclxuICogQ3JlYXRlIHJlc3RhdXJhbnQgSFRNTC5cclxuICovXHJcbmNyZWF0ZVJlc3RhdXJhbnRIVE1MID0gKHJlc3RhdXJhbnQpID0+IHtcclxuICAgIGNvbnN0IGxpID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnbGknKTtcclxuICAgIGxpLnNldEF0dHJpYnV0ZSgndGFiaW5kZXgnLCAwKTtcclxuXHJcbiAgICBjb25zdCBpbWFnZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2ltZycpO1xyXG4gICAgaW1hZ2Uuc3JjID0gREJIZWxwZXIuaW1hZ2VVcmxGb3JSZXN0YXVyYW50KHJlc3RhdXJhbnQpO1xyXG4gICAgaW1hZ2UuY2xhc3NOYW1lID0gJ3Jlc3RhdXJhbnQtaW1nJztcclxuICAgIGlmIChpbWFnZS5zcmMgPT0gYGh0dHA6Ly9sb2NhbGhvc3Q6ODA4MC9uby1pbWFnZWApIHtcclxuICAgICAgICBpbWFnZS5zcmMgPSAnJztcclxuICAgICAgICBpbWFnZS5jbGFzc0xpc3QuYWRkKCdmYWxsYmFjay1pbWFnZS1pY29uJyk7XHJcbiAgICB9XHJcbiAgICBpbWFnZS5hbHQgPSBgJHtyZXN0YXVyYW50Lm5hbWV9IHJlc3RhdXJhbnQgaW1hZ2VgO1xyXG4gICAgaW1hZ2Uuc2V0QXR0cmlidXRlKCd0YWJpbmRleCcsIDApO1xyXG4gICAgbGkuYXBwZW5kKGltYWdlKTtcclxuXHJcbiAgICBjb25zdCBkZXRhaWxzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XHJcbiAgICBkZXRhaWxzLmNsYXNzTmFtZSA9ICdyZXN0YXVyYW50LWRldGFpbHMnO1xyXG4gICAgbGkuYXBwZW5kKGRldGFpbHMpO1xyXG5cclxuICAgIGNvbnN0IG5hbWUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdoMicpO1xyXG4gICAgbmFtZS5pbm5lckhUTUwgPSByZXN0YXVyYW50Lm5hbWU7XHJcbiAgICBuYW1lLnNldEF0dHJpYnV0ZSgndGFiaW5kZXgnLCAwKTtcclxuICAgIGRldGFpbHMuYXBwZW5kKG5hbWUpO1xyXG5cclxuICAgIGNvbnN0IG5laWdoYm9yaG9vZCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3AnKTtcclxuICAgIG5laWdoYm9yaG9vZC5pbm5lckhUTUwgPSByZXN0YXVyYW50Lm5laWdoYm9yaG9vZDtcclxuICAgIG5laWdoYm9yaG9vZC5zZXRBdHRyaWJ1dGUoJ3RhYmluZGV4JywgMCk7XHJcbiAgICBkZXRhaWxzLmFwcGVuZChuZWlnaGJvcmhvb2QpO1xyXG5cclxuICAgIGNvbnN0IGFkZHJlc3MgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdwJyk7XHJcbiAgICBhZGRyZXNzLmNsYXNzTmFtZSA9ICdyZXN0LWFkZHJlc3MnO1xyXG4gICAgYWRkcmVzcy5pbm5lckhUTUwgPSBgPGkgY2xhc3M9J2ZhIGZhLW1hcC1tYXJrZXInPjwvaT5gICsgcmVzdGF1cmFudC5hZGRyZXNzO1xyXG4gICAgYWRkcmVzcy5zZXRBdHRyaWJ1dGUoJ3RhYmluZGV4JywgMCk7XHJcbiAgICBkZXRhaWxzLmFwcGVuZChhZGRyZXNzKTtcclxuXHJcbiAgICBjb25zdCBtb3JlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYScpO1xyXG4gICAgbW9yZS5pbm5lckhUTUwgPSAnVmlldyBEZXRhaWxzJztcclxuICAgIG1vcmUuaHJlZiA9IERCSGVscGVyLnVybEZvclJlc3RhdXJhbnQocmVzdGF1cmFudCk7XHJcbiAgICBtb3JlLnNldEF0dHJpYnV0ZSgnYXJpYS1sYWJlbCcsIGBWaWV3IGRldGFpbHMgb2YgJHtyZXN0YXVyYW50Lm5hbWV9YClcclxuICAgIGRldGFpbHMuYXBwZW5kKG1vcmUpXHJcblxyXG4gICAgcmV0dXJuIGxpXHJcbn1cclxuXHJcbi8qKlxyXG4gKiBBZGQgbWFya2VycyBmb3IgY3VycmVudCByZXN0YXVyYW50cyB0byB0aGUgbWFwLlxyXG4gKi9cclxuYWRkTWFya2Vyc1RvTWFwID0gKHJlc3RhdXJhbnRzID0gc2VsZi5yZXN0YXVyYW50cykgPT4ge1xyXG4gICAgcmVzdGF1cmFudHMuZm9yRWFjaChyZXN0YXVyYW50ID0+IHtcclxuICAgICAgICAvLyBBZGQgbWFya2VyIHRvIHRoZSBtYXBcclxuICAgICAgICBjb25zdCBtYXJrZXIgPSBEQkhlbHBlci5tYXBNYXJrZXJGb3JSZXN0YXVyYW50KHJlc3RhdXJhbnQsIHNlbGYubmV3TWFwKTtcclxuICAgICAgICBtYXJrZXIub24oXCJjbGlja1wiLCBvbkNsaWNrKTtcclxuICAgICAgICBmdW5jdGlvbiBvbkNsaWNrKCkge1xyXG4gICAgICAgICAgICB3aW5kb3cubG9jYXRpb24uaHJlZiA9IG1hcmtlci5vcHRpb25zLnVybDtcclxuICAgICAgICB9XHJcbiAgICAgICAgc2VsZi5tYXJrZXJzLnB1c2gobWFya2VyKTtcclxuICAgIH0pO1xyXG5cclxufVxyXG4vKiBhZGRNYXJrZXJzVG9NYXAgPSAocmVzdGF1cmFudHMgPSBzZWxmLnJlc3RhdXJhbnRzKSA9PiB7XHJcbiAgcmVzdGF1cmFudHMuZm9yRWFjaChyZXN0YXVyYW50ID0+IHtcclxuICAgIC8vIEFkZCBtYXJrZXIgdG8gdGhlIG1hcFxyXG4gICAgY29uc3QgbWFya2VyID0gREJIZWxwZXIubWFwTWFya2VyRm9yUmVzdGF1cmFudChyZXN0YXVyYW50LCBzZWxmLm1hcCk7XHJcbiAgICBnb29nbGUubWFwcy5ldmVudC5hZGRMaXN0ZW5lcihtYXJrZXIsICdjbGljaycsICgpID0+IHtcclxuICAgICAgd2luZG93LmxvY2F0aW9uLmhyZWYgPSBtYXJrZXIudXJsXHJcbiAgICB9KTtcclxuICAgIHNlbGYubWFya2Vycy5wdXNoKG1hcmtlcik7XHJcbiAgfSk7XHJcbn0gKi9cclxuXHJcblxyXG4vKiBNYW5hZ2UgZm9jdXMgYW5kIHRhYmluZGV4IG9uIGZpbHRlciBvcHRpb25zICovXHJcblxyXG5cclxuXHJcbiIsImxldCByZXN0YXVyYW50O1xudmFyIG5ld01hcDtcblxuLyoqXG4gKiBJbml0aWFsaXplIG1hcCBhcyBzb29uIGFzIHRoZSBwYWdlIGlzIGxvYWRlZC5cbiAqL1xuZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignRE9NQ29udGVudExvYWRlZCcsIChldmVudCkgPT4ge1xuICAgIGluaXRNYXAoKTtcbn0pO1xuXG4vKipcbiAqIEluaXRpYWxpemUgbGVhZmxldCBtYXBcbiAqL1xuaW5pdE1hcCA9ICgpID0+IHtcbiAgICBmZXRjaFJlc3RhdXJhbnRGcm9tVVJMKChlcnJvciwgcmVzdGF1cmFudCkgPT4ge1xuICAgICAgICBpZiAoZXJyb3IpIHsgLy8gR290IGFuIGVycm9yIVxuICAgICAgICAgICAgY29uc29sZS5lcnJvcihlcnJvcik7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBzZWxmLm5ld01hcCA9IEwubWFwKCdtYXAnLCB7XG4gICAgICAgICAgICAgICAgY2VudGVyOiBbcmVzdGF1cmFudC5sYXRsbmcubGF0LCByZXN0YXVyYW50LmxhdGxuZy5sbmddLFxuICAgICAgICAgICAgICAgIHpvb206IDE2LFxuICAgICAgICAgICAgICAgIHNjcm9sbFdoZWVsWm9vbTogZmFsc2VcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgTC50aWxlTGF5ZXIoJ2h0dHBzOi8vYXBpLnRpbGVzLm1hcGJveC5jb20vdjQve2lkfS97en0ve3h9L3t5fS5qcGc3MD9hY2Nlc3NfdG9rZW49e21hcGJveFRva2VufScsIHtcbiAgICAgICAgICAgICAgICBtYXBib3hUb2tlbjogJ3BrLmV5SjFJam9pYVcxMmNHNHlNaUlzSW1FaU9pSmphbWwyYm5seWNHRXhNM0Z1TTNGeGJUYzBlV00yTkhWMkluMC5FU3MzNzR4TjNndUZBR09fMUVQZG1RJyxcbiAgICAgICAgICAgICAgICBtYXhab29tOiAxOCxcbiAgICAgICAgICAgICAgICBhdHRyaWJ1dGlvbjogJ01hcCBkYXRhICZjb3B5OyA8YSBocmVmPVwiaHR0cHM6Ly93d3cub3BlbnN0cmVldG1hcC5vcmcvXCI+T3BlblN0cmVldE1hcDwvYT4gY29udHJpYnV0b3JzLCAnICtcbiAgICAgICAgICAgICAgICAnPGEgaHJlZj1cImh0dHBzOi8vY3JlYXRpdmVjb21tb25zLm9yZy9saWNlbnNlcy9ieS1zYS8yLjAvXCI+Q0MtQlktU0E8L2E+LCAnICtcbiAgICAgICAgICAgICAgICAnSW1hZ2VyeSDCqSA8YSBocmVmPVwiaHR0cHM6Ly93d3cubWFwYm94LmNvbS9cIj5NYXBib3g8L2E+JyxcbiAgICAgICAgICAgICAgICBpZDogJ21hcGJveC5zdHJlZXRzJ1xuICAgICAgICAgICAgfSkuYWRkVG8obmV3TWFwKTtcbiAgICAgICAgICAgIGZpbGxCcmVhZGNydW1iKCk7XG4gICAgICAgICAgICBEQkhlbHBlci5tYXBNYXJrZXJGb3JSZXN0YXVyYW50KHNlbGYucmVzdGF1cmFudCwgc2VsZi5uZXdNYXApO1xuICAgICAgICB9XG4gICAgfSk7XG59XG5cbi8qIHdpbmRvdy5pbml0TWFwID0gKCkgPT4ge1xuICBmZXRjaFJlc3RhdXJhbnRGcm9tVVJMKChlcnJvciwgcmVzdGF1cmFudCkgPT4ge1xuICAgIGlmIChlcnJvcikgeyAvLyBHb3QgYW4gZXJyb3IhXG4gICAgICBjb25zb2xlLmVycm9yKGVycm9yKTtcbiAgICB9IGVsc2Uge1xuICAgICAgc2VsZi5tYXAgPSBuZXcgZ29vZ2xlLm1hcHMuTWFwKGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdtYXAnKSwge1xuICAgICAgICB6b29tOiAxNixcbiAgICAgICAgY2VudGVyOiByZXN0YXVyYW50LmxhdGxuZyxcbiAgICAgICAgc2Nyb2xsd2hlZWw6IGZhbHNlXG4gICAgICB9KTtcbiAgICAgIGZpbGxCcmVhZGNydW1iKCk7XG4gICAgICBEQkhlbHBlci5tYXBNYXJrZXJGb3JSZXN0YXVyYW50KHNlbGYucmVzdGF1cmFudCwgc2VsZi5tYXApO1xuICAgIH1cbiAgfSk7XG59ICovXG5cbi8qKlxuICogR2V0IGN1cnJlbnQgcmVzdGF1cmFudCBmcm9tIHBhZ2UgVVJMLlxuICovXG5mZXRjaFJlc3RhdXJhbnRGcm9tVVJMID0gKGNhbGxiYWNrKSA9PiB7XG4gICAgaWYgKHNlbGYucmVzdGF1cmFudCkgeyAvLyByZXN0YXVyYW50IGFscmVhZHkgZmV0Y2hlZCFcbiAgICAgICAgY2FsbGJhY2sobnVsbCwgc2VsZi5yZXN0YXVyYW50KVxuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIGNvbnN0IGlkID0gZ2V0UGFyYW1ldGVyQnlOYW1lKCdpZCcpO1xuICAgIGlmICghaWQpIHsgLy8gbm8gaWQgZm91bmQgaW4gVVJMXG4gICAgICAgIGVycm9yID0gJ05vIHJlc3RhdXJhbnQgaWQgaW4gVVJMJ1xuICAgICAgICBjYWxsYmFjayhlcnJvciwgbnVsbCk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgREJIZWxwZXIuZmV0Y2hSZXN0YXVyYW50QnlJZChpZCwgKGVycm9yLCByZXN0YXVyYW50KSA9PiB7XG4gICAgICAgICAgICBzZWxmLnJlc3RhdXJhbnQgPSByZXN0YXVyYW50O1xuICAgICAgICAgICAgaWYgKCFyZXN0YXVyYW50KSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihlcnJvcik7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZmlsbFJlc3RhdXJhbnRIVE1MKCk7XG4gICAgICAgICAgICBjYWxsYmFjayhudWxsLCByZXN0YXVyYW50KVxuICAgICAgICB9KTtcbiAgICB9XG59XG5cbi8qKlxuICogQ3JlYXRlIHJlc3RhdXJhbnQgSFRNTCBhbmQgYWRkIGl0IHRvIHRoZSB3ZWJwYWdlXG4gKi9cbmZpbGxSZXN0YXVyYW50SFRNTCA9IChyZXN0YXVyYW50ID0gc2VsZi5yZXN0YXVyYW50KSA9PiB7XG4gICAgY29uc3QgbmFtZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyZXN0YXVyYW50LW5hbWUnKTtcbiAgICBuYW1lLmlubmVySFRNTCA9IHJlc3RhdXJhbnQubmFtZTtcblxuICAgIGNvbnN0IGFkZHJlc3MgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncmVzdGF1cmFudC1hZGRyZXNzJyk7XG4gICAgYWRkcmVzcy5pbm5lckhUTUwgPSBgPGkgY2xhc3M9J2ZhIGZhLW1hcC1tYXJrZXInPjwvaT5gICsgcmVzdGF1cmFudC5hZGRyZXNzO1xuXG4gICAgY29uc3QgaW1hZ2UgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncmVzdGF1cmFudC1pbWcnKTtcbiAgICBpbWFnZS5jbGFzc05hbWUgPSAncmVzdGF1cmFudC1pbWcnXG4gICAgaW1hZ2Uuc3JjID0gREJIZWxwZXIuaW1hZ2VVcmxGb3JSZXN0YXVyYW50KHJlc3RhdXJhbnQpO1xuICAgIGlmIChpbWFnZS5zcmMgPT0gYGh0dHA6Ly9sb2NhbGhvc3Q6ODA4MC9uby1pbWFnZWApIHtcbiAgICAgICAgaW1hZ2UuY2xhc3NMaXN0LmFkZCgnZmFsbGJhY2staW1hZ2UtaWNvbicpO1xuICAgIH1cbiAgICBpbWFnZS5hbHQgPSBgJHtyZXN0YXVyYW50Lm5hbWV9IHJlc3RhdXJhbnQgaW1hZ2VgO1xuXG4gICAgY29uc3QgY3Vpc2luZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyZXN0YXVyYW50LWN1aXNpbmUnKTtcbiAgICBjdWlzaW5lLmlubmVySFRNTCA9IHJlc3RhdXJhbnQuY3Vpc2luZV90eXBlO1xuXG4gICAgLy8gZmlsbCBvcGVyYXRpbmcgaG91cnNcbiAgICBpZiAocmVzdGF1cmFudC5vcGVyYXRpbmdfaG91cnMpIHtcbiAgICAgICAgZmlsbFJlc3RhdXJhbnRIb3Vyc0hUTUwoKTtcbiAgICB9XG4gICAgLy8gZmlsbCByZXZpZXdzXG4gICAgZmlsbFJldmlld3NIVE1MKCk7XG59XG5cbi8qKlxuICogQ3JlYXRlIHJlc3RhdXJhbnQgb3BlcmF0aW5nIGhvdXJzIEhUTUwgdGFibGUgYW5kIGFkZCBpdCB0byB0aGUgd2VicGFnZS5cbiAqL1xuZmlsbFJlc3RhdXJhbnRIb3Vyc0hUTUwgPSAob3BlcmF0aW5nSG91cnMgPSBzZWxmLnJlc3RhdXJhbnQub3BlcmF0aW5nX2hvdXJzKSA9PiB7XG4gICAgY29uc3QgaG91cnMgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncmVzdGF1cmFudC1ob3VycycpO1xuICAgIGZvciAobGV0IGtleSBpbiBvcGVyYXRpbmdIb3Vycykge1xuICAgICAgICBjb25zdCByb3cgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCd0cicpO1xuXG4gICAgICAgIGNvbnN0IGRheSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3RkJyk7XG4gICAgICAgIGRheS5pbm5lckhUTUwgPSBrZXk7XG4gICAgICAgIHJvdy5hcHBlbmRDaGlsZChkYXkpO1xuXG4gICAgICAgIGNvbnN0IHRpbWUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCd0ZCcpO1xuICAgICAgICB0aW1lLmlubmVySFRNTCA9IG9wZXJhdGluZ0hvdXJzW2tleV07XG4gICAgICAgIHJvdy5hcHBlbmRDaGlsZCh0aW1lKTtcblxuICAgICAgICBob3Vycy5hcHBlbmRDaGlsZChyb3cpO1xuICAgIH1cbn1cblxuLyoqXG4gKiBDcmVhdGUgYWxsIHJldmlld3MgSFRNTCBhbmQgYWRkIHRoZW0gdG8gdGhlIHdlYnBhZ2UuXG4gKi9cbmZpbGxSZXZpZXdzSFRNTCA9IChyZXZpZXdzID0gc2VsZi5yZXN0YXVyYW50LnJldmlld3MpID0+IHtcbiAgICBjb25zdCBjb250YWluZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncmV2aWV3cy1jb250YWluZXInKTtcbiAgICBjb25zdCB0aXRsZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2gyJyk7XG4gICAgdGl0bGUuaW5uZXJIVE1MID0gJ1Jldmlld3MnO1xuICAgIHRpdGxlLnNldEF0dHJpYnV0ZSgndGFiaW5kZXgnLCAwKTtcbiAgICBjb250YWluZXIuYXBwZW5kQ2hpbGQodGl0bGUpO1xuXG4gICAgaWYgKCFyZXZpZXdzKSB7XG4gICAgICAgIGNvbnN0IG5vUmV2aWV3cyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3AnKTtcbiAgICAgICAgbm9SZXZpZXdzLmlubmVySFRNTCA9ICdObyByZXZpZXdzIHlldCEnO1xuICAgICAgICBub1Jldmlld3Muc2V0QXR0cmlidXRlKCd0YWJpbmRleCcsIDApO1xuICAgICAgICBjb250YWluZXIuYXBwZW5kQ2hpbGQobm9SZXZpZXdzKTtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBjb25zdCB1bCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyZXZpZXdzLWxpc3QnKTtcbiAgICByZXZpZXdzLmZvckVhY2gocmV2aWV3ID0+IHtcbiAgICAgICAgdWwuYXBwZW5kQ2hpbGQoY3JlYXRlUmV2aWV3SFRNTChyZXZpZXcpKTtcbiAgICB9KTtcbiAgICBjb250YWluZXIuYXBwZW5kQ2hpbGQodWwpO1xufVxuXG4vKipcbiAqIENyZWF0ZSByZXZpZXcgSFRNTCBhbmQgYWRkIGl0IHRvIHRoZSB3ZWJwYWdlLlxuICovXG5jcmVhdGVSZXZpZXdIVE1MID0gKHJldmlldykgPT4ge1xuICAgIGNvbnN0IGxpID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnbGknKTtcbiAgICBsaS5zZXRBdHRyaWJ1dGUoJ3RhYmluZGV4JywgMCk7XG4gICAgY29uc3QgbmFtZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3AnKTtcbiAgICBuYW1lLmNsYXNzTmFtZSA9ICdyZXZpZXctdXNlcic7XG4gICAgbmFtZS5pbm5lckhUTUwgPSBgPGkgY2xhc3M9J2ZhIGZhLXVzZXInPjwvaT5gICsgcmV2aWV3Lm5hbWU7XG4gICAgbmFtZS5zZXRBdHRyaWJ1dGUoJ3RhYmluZGV4JywgMCk7XG4gICAgbGkuYXBwZW5kQ2hpbGQobmFtZSk7XG5cbiAgICBjb25zdCBkYXRlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgncCcpO1xuICAgIGRhdGUuY2xhc3NOYW1lID0gJ3Jldmlldy1kYXRlJztcbiAgICBkYXRlLmlubmVySFRNTCA9IGA8aSBjbGFzcz0nZmEgZmEtY2FsZW5kYXInPjwvaT5gICsgcmV2aWV3LmRhdGU7XG4gICAgZGF0ZS5zZXRBdHRyaWJ1dGUoJ3RhYmluZGV4JywgMCk7XG4gICAgbGkuYXBwZW5kQ2hpbGQoZGF0ZSk7XG5cbiAgICBjb25zdCByYXRpbmcgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdwJyk7XG4gICAgcmF0aW5nLmNsYXNzTmFtZSA9ICdyZXZpZXctcmF0aW5nJztcbiAgICAvLyByYXRpbmcuaW5uZXJIVE1MID0gYDxpIGNsYXNzPSdmYSBmYS1zdGFyJz48L2k+UmF0aW5nOiAke3Jldmlldy5yYXRpbmd9YDtcbiAgICByYXRpbmcuaW5uZXJIVE1MID0gJyc7XG4gICAgcmF0aW5nLnNldEF0dHJpYnV0ZSgndGFiaW5kZXgnLCAwKTtcbiAgICByYXRpbmcuc2V0QXR0cmlidXRlKCdhcmlhLWxhYmVsJywgYFJhdGluZzogJHtyZXZpZXcucmF0aW5nfSBvdXQgb2YgNSBzdGFyc2ApO1xuXG4gICAgLy8gRmlsbGVkIHN0YXIgZm9yIHJhdGluZ1xuICAgIGZvciAoaT0wOyBpPHJldmlldy5yYXRpbmc7IGkrKykge1xuICAgICAgICBsZXQgc3RhciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2knKTtcbiAgICAgICAgc3Rhci5jbGFzc05hbWUgPSAnZmEgZmEtc3Rhcic7XG4gICAgICAgIHJhdGluZy5hcHBlbmRDaGlsZChzdGFyKTtcbiAgICB9XG4gICAgZm9yIChpPXJldmlldy5yYXRpbmc7IGk8NTsgaSsrKSB7XG4gICAgICAgIGxldCBzdGFyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaScpO1xuICAgICAgICBzdGFyLmNsYXNzTmFtZSA9ICdmYXIgZmEtc3Rhcic7XG4gICAgICAgIHJhdGluZy5hcHBlbmRDaGlsZChzdGFyKTtcbiAgICB9XG4gICAgbGkuYXBwZW5kQ2hpbGQocmF0aW5nKTtcblxuICAgIGNvbnN0IGNvbW1lbnRzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgncCcpO1xuICAgIGNvbW1lbnRzLmNsYXNzTmFtZSA9ICdyZXZpZXctY29tbWVudHMnO1xuICAgIGNvbW1lbnRzLmlubmVySFRNTCA9IHJldmlldy5jb21tZW50cztcbiAgICBjb21tZW50cy5zZXRBdHRyaWJ1dGUoJ3RhYmluZGV4JywgMCk7XG4gICAgbGkuYXBwZW5kQ2hpbGQoY29tbWVudHMpO1xuXG4gICAgcmV0dXJuIGxpO1xufVxuXG4vKipcbiAqIEFkZCByZXN0YXVyYW50IG5hbWUgdG8gdGhlIGJyZWFkY3J1bWIgbmF2aWdhdGlvbiBtZW51XG4gKi9cbmZpbGxCcmVhZGNydW1iID0gKHJlc3RhdXJhbnQ9c2VsZi5yZXN0YXVyYW50KSA9PiB7XG4gICAgY29uc3QgYnJlYWRjcnVtYiA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdicmVhZGNydW1iJyk7XG4gICAgY29uc3QgbGkgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdsaScpO1xuICAgIGxpLmlubmVySFRNTCA9IHJlc3RhdXJhbnQubmFtZTtcbiAgICBicmVhZGNydW1iLmFwcGVuZENoaWxkKGxpKTtcbn1cblxuLyoqXG4gKiBHZXQgYSBwYXJhbWV0ZXIgYnkgbmFtZSBmcm9tIHBhZ2UgVVJMLlxuICovXG5nZXRQYXJhbWV0ZXJCeU5hbWUgPSAobmFtZSwgdXJsKSA9PiB7XG4gICAgaWYgKCF1cmwpXG4gICAgICAgIHVybCA9IHdpbmRvdy5sb2NhdGlvbi5ocmVmO1xuICAgIG5hbWUgPSBuYW1lLnJlcGxhY2UoL1tcXFtcXF1dL2csICdcXFxcJCYnKTtcbiAgICBjb25zdCByZWdleCA9IG5ldyBSZWdFeHAoYFs/Jl0ke25hbWV9KD0oW14mI10qKXwmfCN8JClgKSxcbiAgICAgICAgcmVzdWx0cyA9IHJlZ2V4LmV4ZWModXJsKTtcbiAgICBpZiAoIXJlc3VsdHMpXG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIGlmICghcmVzdWx0c1syXSlcbiAgICAgICAgcmV0dXJuICcnO1xuICAgIHJldHVybiBkZWNvZGVVUklDb21wb25lbnQocmVzdWx0c1syXS5yZXBsYWNlKC9cXCsvZywgJyAnKSk7XG59XG4iXX0=
