(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
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

      request.onupgradeneeded = function(event) {
        if (upgradeCallback) {
          upgradeCallback(new UpgradeDB(request.result, event.oldVersion, request.transaction));
        }
      };

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
  }
  else {
    self.idb = exp;
  }
}());

},{}],2:[function(require,module,exports){
'use strict';

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _idb = require('idb');

var _idb2 = _interopRequireDefault(_idb);

/** 
 * Separate caches for the jpg images and all the other content 
 */
var CACHE_STATIC = 'restaurant-reviews-static-v1';
var CACHE_IMAGES = 'restaurant-reviews-images-v1';
var offlinePage = './404.html';
var dbPromise;
var reviewsDbPromise;
var tempDBPromise;
var reviewFormData;

/** 
 * Fetch and cache image request 
 */
function cacheImages(request) {

  // Remove size-related info from image name
  var urlToFetch = request.url.slice(0, request.url.indexOf('-'));

  return caches.open(CACHE_IMAGES).then(function (cache) {
    return cache.match(urlToFetch).then(function (response) {

      // Cache hit - return response else fetch
      // We clone the request because it's a stream and can be consumed only once
      var networkFetch = fetch(request.clone()).then(function (networkResponse) {
        // Check if we received an invalid response
        if (networkResponse.status == 404) return;

        // We clone the response because it's a stream and can be consumed only once
        cache.put(urlToFetch, networkResponse.clone());

        return networkResponse;
      }, function (rejected) {
        return response;
      })['catch'](function () {
        return response;
      });

      // //if access to network is good we want the best quality image
      return networkFetch;
    })['catch'](function () {

      return fetch(request.clone()).then(function (networkResponse) {
        // Check if we received an invalid response
        if (networkResponse.status == 404) return;

        // We clone the response because it's a stream and can be consumed only once
        cache.put(urlToFetch, networkResponse.clone());

        return networkResponse;
      }, function (rejected) {
        return caches.match(offlinePage);
      })['catch'](function () {
        return caches.match(offlinePage);
      });
    });
  });
}

/** 
 * Fetch and cache static content and google map related content 
 */
function cacheStaticContent(request) {

  return caches.open(CACHE_STATIC).then(function (cache) {
    return cache.match(request).then(function (response) {

      // Cache hit - return response else fetch
      // We clone the request because it's a stream and can be consumed only once
      return response || fetch(request.clone()).then(function (networkResponse) {
        // Check if we received an invalid response
        if (networkResponse.status == 404) return;

        // We clone the response because it's a stream and can be consumed only once
        cache.put(request, networkResponse.clone());
        return networkResponse;
      })['catch'](function () {
        return caches.match(offlinePage);
      });
    });
  });
}

/**
 * Fetches from network and puts in indexed db latest data
 */
function getLatestData(request) {

  var pathSlices = request.url.split("/");
  var restaurantId = parseInt(pathSlices[pathSlices.length - 1]) || 0;

  return fetch(request.clone()).then(function (networkResponse) {

    if (networkResponse.status == 404) return;

    networkResponse.clone().json().then(function (json) {

      if (!dbPromise) return;

      dbPromise.then(function (db) {

        if (!db) return;

        var tx = db.transaction('restaurants', 'readwrite');
        var store = tx.objectStore('restaurants');

        if (!restaurantId) {
          // if we refer to all data

          json.forEach(function (restaurant) {
            store.put(restaurant, restaurant.id);
          });
        } else {
          // if we refer to per restaurant data
          store.put(json, json.id);
        }
      });
    });

    return networkResponse;
  });
}

/**
 * Searches the indexed db for data and if nothing found tries the nework
 */
function searchInIDB(request) {

  var pathSlices = request.clone().url.split("/");
  var restaurantId = parseInt(pathSlices[pathSlices.length - 1]) || 0;
  var dataPromise;

  // if not indexed db functionality
  if (!dbPromise) return getLatestData(request.clone());

  return dbPromise.then(function (db) {

    if (!db) return getLatestData(request.clone());

    var store = db.transaction('restaurants').objectStore('restaurants');

    if (!restaurantId) {
      // if all data are requested
      dataPromise = store.getAll();
    } else {
      // if per restaurant data are requested
      dataPromise = store.get(restaurantId);
    }

    if (!dataPromise) return getLatestData(request.clone());

    return dataPromise.then(function (data) {

      var networkFetch = getLatestData(request.clone());

      // if data found in indexed db return them
      if (JSON.stringify(data) !== JSON.stringify([]) && data !== undefined) {

        console.log('Found cached');
        return new Response(JSON.stringify(data));
      }

      return networkFetch;
    });
  });
}

function updateRestaurantIndexedDb(request) {

  return fetch(request.clone()).then(function (networkResponse) {

    if (networkResponse.status == 404) return;

    networkResponse.clone().json().then(function (json) {

      if (!dbPromise) return;

      dbPromise.then(function (db) {

        if (!db) return;

        var tx = db.transaction('restaurants', 'readwrite');
        var store = tx.objectStore('restaurants');

        store.put(json, json.id);
      });
    });

    return networkResponse;
  });
}

/**
 * Fetches from network and puts in indexed db the latest reviews
 */
function getLatestReviews(request) {

  return fetch(request.clone()).then(function (networkResponse) {

    if (networkResponse.status == 404) return;

    networkResponse.clone().json().then(function (json) {

      if (!reviewsDbPromise) return;

      reviewsDbPromise.then(function (db) {

        if (!db) return;

        var tx = db.transaction('restaurant-reviews', 'readwrite');
        var store = tx.objectStore('restaurant-reviews');

        json.forEach(function (review) {
          review.restaurant_id = parseInt(review.restaurant_id) || 0;
          store.put(review, review.id);
        });
      });
    });

    return networkResponse;
  });
}

/**
 * Searches the indexed db for reviews and if nothing found tries the nework
 */
function searchIDBForReviews(request) {

  var pathSlices = request.clone().url.split("restaurant_id=");
  var restaurantId = parseInt(pathSlices[pathSlices.length - 1]) || 0;

  // if not indexed db functionality
  if (!reviewsDbPromise) return getLatestReviews(request.clone());

  return reviewsDbPromise.then(function (db) {

    if (!db) return getLatestReviews(request.clone());

    var store = db.transaction('restaurant-reviews').objectStore('restaurant-reviews');
    var index = store.index('by-restaurant');

    return index.getAll(restaurantId).then(function (data) {

      var networkFetch = getLatestReviews(request.clone());

      // if data found in indexed db return them
      if (JSON.stringify(data) !== JSON.stringify([]) && data !== undefined) {

        console.log('Found cached');
        return new Response(JSON.stringify(data));
      }

      return networkFetch;
    });
  })['catch'](function (error) {
    return new Response(JSON.stringify([]));
  });
}

/**
 * Searches the temp indexed db for reviews
 */
function searchTempDBForReviews() {

  if (!tempDBPromise) return;

  return tempDBPromise.then(function (db) {

    if (!db) return;

    var store = db.transaction('restaurant-reviews-temp').objectStore('restaurant-reviews-temp');
    var index = store.index('by-type');

    return index.getAll('create-review').then(function (data) {

      // if data found in indexed db return them
      if (JSON.stringify(data) !== JSON.stringify([]) && data !== undefined) {

        return new Response(JSON.stringify(data));
      }
    });
  });
}

/**
 * Gets all data stored in temp indexed db and 
 * attempts sychronization with the server
 */
function syncWithServer() {

  return tempDBPromise.then(function (db) {

    if (!db) return;

    var tx = db.transaction('restaurant-reviews-temp', 'readwrite');
    var store = tx.objectStore('restaurant-reviews-temp');

    return store.getAll().then(function (tempRequests) {

      return Promise.all(tempRequests.map(function (tempRequest) {

        return sendToServer(tempRequest).then(function (networkResponse) {

          console.log('Success syncing!');

          var tx1 = db.transaction('restaurant-reviews-temp', 'readwrite');
          var store1 = tx1.objectStore('restaurant-reviews-temp');

          store1['delete'](tempRequest.createdAt);

          return networkResponse.json();
        }).then(function (json) {

          if (tempRequest.type === 'create-review') {

            if (!reviewsDbPromise) return;

            reviewsDbPromise.then(function (db1) {

              if (!db1) return;

              var tx2 = db1.transaction('restaurant-reviews', 'readwrite');
              var store2 = tx2.objectStore('restaurant-reviews');

              json.restaurant_id = parseInt(json.restaurant_id) || 0;
              store2.put(json, json.id);
            });
          }
        });
      }));
    });
  })['catch'](function (error) {
    throw error;
  });
}

/**
 * Sends post/put request to server
 * 
 * @param {*} data 
 */
function sendToServer(data) {

  return fetch(data.url, {
    headers: {

      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8",
      "Connection": "keep-alive",
      "Content-Length": '' + serializeObject(data.formData).length,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    method: data.method,
    body: serializeObject(data.formData)
  });
}

/**
 * Saves temp post/put requests data when bad connection
 * 
 * @param {*} data 
 */
function saveInTempDB(data) {

  if (!tempDBPromise) return;

  return tempDBPromise.then(function (db) {

    if (!db) return;

    var tx = db.transaction('restaurant-reviews-temp', 'readwrite');
    var store = tx.objectStore('restaurant-reviews-temp');

    store.put(data, data.createdAt);

    return data;
  });
}

function markFavorite(restaurant_id) {}

//============================================================ INDEXED DB PROMISES

/**
 * Create an indexed db of keyval type named `restaurants`
 */
function createDB() {
  return _idb2['default'].open('restaurants', 1, function (upgradeDB) {
    var store = upgradeDB.createObjectStore('restaurants', {
      keypath: 'id'
    });
  });
}

/**
 * Create an indexed db of keyval type named `restaurant-reviews`
 */
function createReviewDB() {
  return _idb2['default'].open('restaurant-reviews', 1, function (upgradeDB) {
    var store = upgradeDB.createObjectStore('restaurant-reviews', {
      keypath: 'id'
    });

    store.createIndex('by-restaurant', 'restaurant_id');
    store.createIndex('by-date', 'createdAt');
  });
}

/**
 * Create an indexed db of keyval type named `restaurant-reviews`
 */
function createTempReviewDB() {
  return _idb2['default'].open('restaurant-reviews-temp', 1, function (upgradeDB) {
    var store = upgradeDB.createObjectStore('restaurant-reviews-temp', {
      keypath: 'createdAt'
    });

    store.createIndex('by-type', 'type');
  });
}

//============================================================ EVENTS

/** 
 * Open caches on install of sw 
 */
self.addEventListener('install', function (event) {
  // Open cache for static content and cache 404 page

  var openStaticCachePromise = caches.open(CACHE_STATIC).then(function (cache) {
    cache.addAll([offlinePage]);
    console.log('Cache ' + CACHE_STATIC + ' opened');
  });

  var openImageCachePromise = caches.open(CACHE_IMAGES).then(function (cache) {
    console.log('Cache ' + CACHE_IMAGES + ' opened');
  });

  dbPromise = createDB();

  event.waitUntil(Promise.all([openStaticCachePromise, openImageCachePromise]).then(function () {
    return self.skipWaiting();
  }));
});

/** 
 * Open index db on activate
 */
self.addEventListener('activate', function (event) {

  dbPromise = createDB();
  reviewsDbPromise = createReviewDB();
  tempDBPromise = createTempReviewDB();

  event.waitUntil(Promise.all([dbPromise, reviewsDbPromise, tempDBPromise]).then(function () {
    return self.skipWaiting();
  }));
});

/** 
 * Handle fetch event
 */
self.addEventListener('fetch', function (event) {

  // handle request according to its type

  if (event.request.method === 'PUT') {

    updateRestaurantIndexedDb(event.request);
  }

  if (event.request.method === 'GET') {

    if (event.request.url.endsWith('.jpg')) {
      event.respondWith(cacheImages(event.request));
      return;
    } else if (event.request.url.includes('reviews')) {

      var pathSlices = event.request.clone().url.split("restaurant_id=");
      var restaurantId = parseInt(pathSlices[pathSlices.length - 1]) || 0;

      /**
       * Get data from stable indexed db or the network and if data exist in temp indexed db 
       * return consolidated data for better user experience
       */
      event.respondWith(Promise.all([searchIDBForReviews(event.request), searchTempDBForReviews(event.request)]).then(function (responses) {

        return Promise.all(responses.map(function (response) {

          if (typeof response === 'undefined') return [];

          return response.json().then(function (json) {
            return json;
          });
        })).then(function (jsons) {

          var concatenatedResponse = [];

          return Promise.all(jsons.map(function (json) {

            json.forEach(function (obj) {

              if (typeof obj.formData !== 'undefined' && obj.formData.restaurant_id == restaurantId) {
                concatenatedResponse.push(obj.formData);
              } else if (typeof obj.formData === 'undefined') {
                concatenatedResponse.push(obj);
              }
            });
          })).then(function () {
            return concatenatedResponse;
          });
        });
      }).then(function (concatenatedResponse) {
        return new Response(JSON.stringify(concatenatedResponse));
      }));
      return;
    } else if (event.request.url.includes('restaurants')) {
      event.respondWith(searchInIDB(event.request));
      return;
    } else {
      event.respondWith(cacheStaticContent(event.request));
      return;
    }
  }
});

self.addEventListener('message', function (event) {

  if (event.data.type === 'create-review') {

    event.data.createdAt = Date.parse(new Date());

    return saveInTempDB(event.data).then(function (jsonSaved) {

      self.registration.sync.register('submit-review');
    });
  }
});

self.addEventListener('sync', function (event) {

  if (!tempDBPromise) return;

  if (event.tag == 'submit-review') {
    event.waitUntil(syncWithServer());
  }

  // if (event.tag == 'mark-favorite') {
  //   event.waitUntil(markFavorite(restaurant_id));
  // }
});

function serializeObject(params) {

  return Object.keys(params).map(function (key) {
    return key + '=' + params[key];
  }).join('&');
}

},{"idb":1}]},{},[2])
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvaWRiL2xpYi9pZGIuanMiLCJDOi91ZGFjaXR5L2ZpcnN0L213cy1yZXN0YXVyYW50LXN0YWdlLTEvc3JjL3N3LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7O21CQ3RUZ0IsS0FBSzs7Ozs7OztBQUtyQixJQUFJLFlBQVksR0FBRyw4QkFBOEIsQ0FBQztBQUNsRCxJQUFJLFlB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LFVBQUMsU0FBUyxFQUFHOztBQUVoRCxVQUFJLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsZUFBZSxDQUFDLENBQUM7S0FDbEQsQ0FBQyxDQUFDO0dBQ0o7Q0FDRixDQUFDLENBQUM7O0FBRUgsSUFBSSxDQUFDLGdCQUFnQixDQUFDLE1BQU0sRUFBRSxVQUFBLEtBQUssRUFBSTs7QUFFckMsTUFBRyxDQUFDLGFBQWEsRUFBRSxPQUFPOztBQUUxQixNQUFJLEtBQUssQ0FBQyxHQUFHLElBQUksZUFBZSxFQUFFO0FBQ2hDLFNBQUssQ0FBQyxTQUFTLENBQUMsY0FBYyxFQUFFLENBQUMsQ0FBQztHQUNuQzs7Ozs7Q0FNRixDQUFDLENBQUM7O0FBRUgsU0FBUyxlQUFlLENBQUMsTUFBTSxFQUFFOztBQUUvQixTQUFPLE1BQU0sQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsR0FBRyxDQUFDLFVBQUEsR0FBRztXQUFJLEdBQUcsR0FBRyxHQUFHLEdBQUcsTUFBTSxDQUFDLEdBQUcsQ0FBQztHQUFBLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7Q0FDMUUiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiJ3VzZSBzdHJpY3QnO1xyXG5cclxuKGZ1bmN0aW9uKCkge1xyXG4gIGZ1bmN0aW9uIHRvQXJyYXkoYXJyKSB7XHJcbiAgICByZXR1cm4gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJyKTtcclxuICB9XHJcblxyXG4gIGZ1bmN0aW9uIHByb21pc2lmeVJlcXVlc3QocmVxdWVzdCkge1xyXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCkge1xyXG4gICAgICByZXF1ZXN0Lm9uc3VjY2VzcyA9IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHJlc29sdmUocmVxdWVzdC5yZXN1bHQpO1xyXG4gICAgICB9O1xyXG5cclxuICAgICAgcmVxdWVzdC5vbmVycm9yID0gZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgcmVqZWN0KHJlcXVlc3QuZXJyb3IpO1xyXG4gICAgICB9O1xyXG4gICAgfSk7XHJcbiAgfVxyXG5cclxuICBmdW5jdGlvbiBwcm9taXNpZnlSZXF1ZXN0Q2FsbChvYmosIG1ldGhvZCwgYXJncykge1xyXG4gICAgdmFyIHJlcXVlc3Q7XHJcbiAgICB2YXIgcCA9IG5ldyBQcm9taXNlKGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCkge1xyXG4gICAgICByZXF1ZXN0ID0gb2JqW21ldGhvZF0uYXBwbHkob2JqLCBhcmdzKTtcclxuICAgICAgcHJvbWlzaWZ5UmVxdWVzdChyZXF1ZXN0KS50aGVuKHJlc29sdmUsIHJlamVjdCk7XHJcbiAgICB9KTtcclxuXHJcbiAgICBwLnJlcXVlc3QgPSByZXF1ZXN0O1xyXG4gICAgcmV0dXJuIHA7XHJcbiAgfVxyXG4gIFxyXG4gIGZ1bmN0aW9uIHByb21pc2lmeUN1cnNvclJlcXVlc3RDYWxsKG9iaiwgbWV0aG9kLCBhcmdzKSB7XHJcbiAgICB2YXIgcCA9IHByb21pc2lmeVJlcXVlc3RDYWxsKG9iaiwgbWV0aG9kLCBhcmdzKTtcclxuICAgIHJldHVybiBwLnRoZW4oZnVuY3Rpb24odmFsdWUpIHtcclxuICAgICAgaWYgKCF2YWx1ZSkgcmV0dXJuO1xyXG4gICAgICByZXR1cm4gbmV3IEN1cnNvcih2YWx1ZSwgcC5yZXF1ZXN0KTtcclxuICAgIH0pO1xyXG4gIH1cclxuXHJcbiAgZnVuY3Rpb24gcHJveHlQcm9wZXJ0aWVzKFByb3h5Q2xhc3MsIHRhcmdldFByb3AsIHByb3BlcnRpZXMpIHtcclxuICAgIHByb3BlcnRpZXMuZm9yRWFjaChmdW5jdGlvbihwcm9wKSB7XHJcbiAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShQcm94eUNsYXNzLnByb3RvdHlwZSwgcHJvcCwge1xyXG4gICAgICAgIGdldDogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICByZXR1cm4gdGhpc1t0YXJnZXRQcm9wXVtwcm9wXTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIHNldDogZnVuY3Rpb24odmFsKSB7XHJcbiAgICAgICAgICB0aGlzW3RhcmdldFByb3BdW3Byb3BdID0gdmFsO1xyXG4gICAgICAgIH1cclxuICAgICAgfSk7XHJcbiAgICB9KTtcclxuICB9XHJcblxyXG4gIGZ1bmN0aW9uIHByb3h5UmVxdWVzdE1ldGhvZHMoUHJveHlDbGFzcywgdGFyZ2V0UHJvcCwgQ29uc3RydWN0b3IsIHByb3BlcnRpZXMpIHtcclxuICAgIHByb3BlcnRpZXMuZm9yRWFjaChmdW5jdGlvbihwcm9wKSB7XHJcbiAgICAgIGlmICghKHByb3AgaW4gQ29uc3RydWN0b3IucHJvdG90eXBlKSkgcmV0dXJuO1xyXG4gICAgICBQcm94eUNsYXNzLnByb3RvdHlwZVtwcm9wXSA9IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHJldHVybiBwcm9taXNpZnlSZXF1ZXN0Q2FsbCh0aGlzW3RhcmdldFByb3BdLCBwcm9wLCBhcmd1bWVudHMpO1xyXG4gICAgICB9O1xyXG4gICAgfSk7XHJcbiAgfVxyXG5cclxuICBmdW5jdGlvbiBwcm94eU1ldGhvZHMoUHJveHlDbGFzcywgdGFyZ2V0UHJvcCwgQ29uc3RydWN0b3IsIHByb3BlcnRpZXMpIHtcclxuICAgIHByb3BlcnRpZXMuZm9yRWFjaChmdW5jdGlvbihwcm9wKSB7XHJcbiAgICAgIGlmICghKHByb3AgaW4gQ29uc3RydWN0b3IucHJvdG90eXBlKSkgcmV0dXJuO1xyXG4gICAgICBQcm94eUNsYXNzLnByb3RvdHlwZVtwcm9wXSA9IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzW3RhcmdldFByb3BdW3Byb3BdLmFwcGx5KHRoaXNbdGFyZ2V0UHJvcF0sIGFyZ3VtZW50cyk7XHJcbiAgICAgIH07XHJcbiAgICB9KTtcclxuICB9XHJcblxyXG4gIGZ1bmN0aW9uIHByb3h5Q3Vyc29yUmVxdWVzdE1ldGhvZHMoUHJveHlDbGFzcywgdGFyZ2V0UHJvcCwgQ29uc3RydWN0b3IsIHByb3BlcnRpZXMpIHtcclxuICAgIHByb3BlcnRpZXMuZm9yRWFjaChmdW5jdGlvbihwcm9wKSB7XHJcbiAgICAgIGlmICghKHByb3AgaW4gQ29uc3RydWN0b3IucHJvdG90eXBlKSkgcmV0dXJuO1xyXG4gICAgICBQcm94eUNsYXNzLnByb3RvdHlwZVtwcm9wXSA9IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHJldHVybiBwcm9taXNpZnlDdXJzb3JSZXF1ZXN0Q2FsbCh0aGlzW3RhcmdldFByb3BdLCBwcm9wLCBhcmd1bWVudHMpO1xyXG4gICAgICB9O1xyXG4gICAgfSk7XHJcbiAgfVxyXG5cclxuICBmdW5jdGlvbiBJbmRleChpbmRleCkge1xyXG4gICAgdGhpcy5faW5kZXggPSBpbmRleDtcclxuICB9XHJcblxyXG4gIHByb3h5UHJvcGVydGllcyhJbmRleCwgJ19pbmRleCcsIFtcclxuICAgICduYW1lJyxcclxuICAgICdrZXlQYXRoJyxcclxuICAgICdtdWx0aUVudHJ5JyxcclxuICAgICd1bmlxdWUnXHJcbiAgXSk7XHJcblxyXG4gIHByb3h5UmVxdWVzdE1ldGhvZHMoSW5kZXgsICdfaW5kZXgnLCBJREJJbmRleCwgW1xyXG4gICAgJ2dldCcsXHJcbiAgICAnZ2V0S2V5JyxcclxuICAgICdnZXRBbGwnLFxyXG4gICAgJ2dldEFsbEtleXMnLFxyXG4gICAgJ2NvdW50J1xyXG4gIF0pO1xyXG5cclxuICBwcm94eUN1cnNvclJlcXVlc3RNZXRob2RzKEluZGV4LCAnX2luZGV4JywgSURCSW5kZXgsIFtcclxuICAgICdvcGVuQ3Vyc29yJyxcclxuICAgICdvcGVuS2V5Q3Vyc29yJ1xyXG4gIF0pO1xyXG5cclxuICBmdW5jdGlvbiBDdXJzb3IoY3Vyc29yLCByZXF1ZXN0KSB7XHJcbiAgICB0aGlzLl9jdXJzb3IgPSBjdXJzb3I7XHJcbiAgICB0aGlzLl9yZXF1ZXN0ID0gcmVxdWVzdDtcclxuICB9XHJcblxyXG4gIHByb3h5UHJvcGVydGllcyhDdXJzb3IsICdfY3Vyc29yJywgW1xyXG4gICAgJ2RpcmVjdGlvbicsXHJcbiAgICAna2V5JyxcclxuICAgICdwcmltYXJ5S2V5JyxcclxuICAgICd2YWx1ZSdcclxuICBdKTtcclxuXHJcbiAgcHJveHlSZXF1ZXN0TWV0aG9kcyhDdXJzb3IsICdfY3Vyc29yJywgSURCQ3Vyc29yLCBbXHJcbiAgICAndXBkYXRlJyxcclxuICAgICdkZWxldGUnXHJcbiAgXSk7XHJcblxyXG4gIC8vIHByb3h5ICduZXh0JyBtZXRob2RzXHJcbiAgWydhZHZhbmNlJywgJ2NvbnRpbnVlJywgJ2NvbnRpbnVlUHJpbWFyeUtleSddLmZvckVhY2goZnVuY3Rpb24obWV0aG9kTmFtZSkge1xyXG4gICAgaWYgKCEobWV0aG9kTmFtZSBpbiBJREJDdXJzb3IucHJvdG90eXBlKSkgcmV0dXJuO1xyXG4gICAgQ3Vyc29yLnByb3RvdHlwZVttZXRob2ROYW1lXSA9IGZ1bmN0aW9uKCkge1xyXG4gICAgICB2YXIgY3Vyc29yID0gdGhpcztcclxuICAgICAgdmFyIGFyZ3MgPSBhcmd1bWVudHM7XHJcbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKS50aGVuKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIGN1cnNvci5fY3Vyc29yW21ldGhvZE5hbWVdLmFwcGx5KGN1cnNvci5fY3Vyc29yLCBhcmdzKTtcclxuICAgICAgICByZXR1cm4gcHJvbWlzaWZ5UmVxdWVzdChjdXJzb3IuX3JlcXVlc3QpLnRoZW4oZnVuY3Rpb24odmFsdWUpIHtcclxuICAgICAgICAgIGlmICghdmFsdWUpIHJldHVybjtcclxuICAgICAgICAgIHJldHVybiBuZXcgQ3Vyc29yKHZhbHVlLCBjdXJzb3IuX3JlcXVlc3QpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICB9KTtcclxuICAgIH07XHJcbiAgfSk7XHJcblxyXG4gIGZ1bmN0aW9uIE9iamVjdFN0b3JlKHN0b3JlKSB7XHJcbiAgICB0aGlzLl9zdG9yZSA9IHN0b3JlO1xyXG4gIH1cclxuXHJcbiAgT2JqZWN0U3RvcmUucHJvdG90eXBlLmNyZWF0ZUluZGV4ID0gZnVuY3Rpb24oKSB7XHJcbiAgICByZXR1cm4gbmV3IEluZGV4KHRoaXMuX3N0b3JlLmNyZWF0ZUluZGV4LmFwcGx5KHRoaXMuX3N0b3JlLCBhcmd1bWVudHMpKTtcclxuICB9O1xyXG5cclxuICBPYmplY3RTdG9yZS5wcm90b3R5cGUuaW5kZXggPSBmdW5jdGlvbigpIHtcclxuICAgIHJldHVybiBuZXcgSW5kZXgodGhpcy5fc3RvcmUuaW5kZXguYXBwbHkodGhpcy5fc3RvcmUsIGFyZ3VtZW50cykpO1xyXG4gIH07XHJcblxyXG4gIHByb3h5UHJvcGVydGllcyhPYmplY3RTdG9yZSwgJ19zdG9yZScsIFtcclxuICAgICduYW1lJyxcclxuICAgICdrZXlQYXRoJyxcclxuICAgICdpbmRleE5hbWVzJyxcclxuICAgICdhdXRvSW5jcmVtZW50J1xyXG4gIF0pO1xyXG5cclxuICBwcm94eVJlcXVlc3RNZXRob2RzKE9iamVjdFN0b3JlLCAnX3N0b3JlJywgSURCT2JqZWN0U3RvcmUsIFtcclxuICAgICdwdXQnLFxyXG4gICAgJ2FkZCcsXHJcbiAgICAnZGVsZXRlJyxcclxuICAgICdjbGVhcicsXHJcbiAgICAnZ2V0JyxcclxuICAgICdnZXRBbGwnLFxyXG4gICAgJ2dldEtleScsXHJcbiAgICAnZ2V0QWxsS2V5cycsXHJcbiAgICAnY291bnQnXHJcbiAgXSk7XHJcblxyXG4gIHByb3h5Q3Vyc29yUmVxdWVzdE1ldGhvZHMoT2JqZWN0U3RvcmUsICdfc3RvcmUnLCBJREJPYmplY3RTdG9yZSwgW1xyXG4gICAgJ29wZW5DdXJzb3InLFxyXG4gICAgJ29wZW5LZXlDdXJzb3InXHJcbiAgXSk7XHJcblxyXG4gIHByb3h5TWV0aG9kcyhPYmplY3RTdG9yZSwgJ19zdG9yZScsIElEQk9iamVjdFN0b3JlLCBbXHJcbiAgICAnZGVsZXRlSW5kZXgnXHJcbiAgXSk7XHJcblxyXG4gIGZ1bmN0aW9uIFRyYW5zYWN0aW9uKGlkYlRyYW5zYWN0aW9uKSB7XHJcbiAgICB0aGlzLl90eCA9IGlkYlRyYW5zYWN0aW9uO1xyXG4gICAgdGhpcy5jb21wbGV0ZSA9IG5ldyBQcm9taXNlKGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCkge1xyXG4gICAgICBpZGJUcmFuc2FjdGlvbi5vbmNvbXBsZXRlID0gZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgcmVzb2x2ZSgpO1xyXG4gICAgICB9O1xyXG4gICAgICBpZGJUcmFuc2FjdGlvbi5vbmVycm9yID0gZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgcmVqZWN0KGlkYlRyYW5zYWN0aW9uLmVycm9yKTtcclxuICAgICAgfTtcclxuICAgICAgaWRiVHJhbnNhY3Rpb24ub25hYm9ydCA9IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHJlamVjdChpZGJUcmFuc2FjdGlvbi5lcnJvcik7XHJcbiAgICAgIH07XHJcbiAgICB9KTtcclxuICB9XHJcblxyXG4gIFRyYW5zYWN0aW9uLnByb3RvdHlwZS5vYmplY3RTdG9yZSA9IGZ1bmN0aW9uKCkge1xyXG4gICAgcmV0dXJuIG5ldyBPYmplY3RTdG9yZSh0aGlzLl90eC5vYmplY3RTdG9yZS5hcHBseSh0aGlzLl90eCwgYXJndW1lbnRzKSk7XHJcbiAgfTtcclxuXHJcbiAgcHJveHlQcm9wZXJ0aWVzKFRyYW5zYWN0aW9uLCAnX3R4JywgW1xyXG4gICAgJ29iamVjdFN0b3JlTmFtZXMnLFxyXG4gICAgJ21vZGUnXHJcbiAgXSk7XHJcblxyXG4gIHByb3h5TWV0aG9kcyhUcmFuc2FjdGlvbiwgJ190eCcsIElEQlRyYW5zYWN0aW9uLCBbXHJcbiAgICAnYWJvcnQnXHJcbiAgXSk7XHJcblxyXG4gIGZ1bmN0aW9uIFVwZ3JhZGVEQihkYiwgb2xkVmVyc2lvbiwgdHJhbnNhY3Rpb24pIHtcclxuICAgIHRoaXMuX2RiID0gZGI7XHJcbiAgICB0aGlzLm9sZFZlcnNpb24gPSBvbGRWZXJzaW9uO1xyXG4gICAgdGhpcy50cmFuc2FjdGlvbiA9IG5ldyBUcmFuc2FjdGlvbih0cmFuc2FjdGlvbik7XHJcbiAgfVxyXG5cclxuICBVcGdyYWRlREIucHJvdG90eXBlLmNyZWF0ZU9iamVjdFN0b3JlID0gZnVuY3Rpb24oKSB7XHJcbiAgICByZXR1cm4gbmV3IE9iamVjdFN0b3JlKHRoaXMuX2RiLmNyZWF0ZU9iamVjdFN0b3JlLmFwcGx5KHRoaXMuX2RiLCBhcmd1bWVudHMpKTtcclxuICB9O1xyXG5cclxuICBwcm94eVByb3BlcnRpZXMoVXBncmFkZURCLCAnX2RiJywgW1xyXG4gICAgJ25hbWUnLFxyXG4gICAgJ3ZlcnNpb24nLFxyXG4gICAgJ29iamVjdFN0b3JlTmFtZXMnXHJcbiAgXSk7XHJcblxyXG4gIHByb3h5TWV0aG9kcyhVcGdyYWRlREIsICdfZGInLCBJREJEYXRhYmFzZSwgW1xyXG4gICAgJ2RlbGV0ZU9iamVjdFN0b3JlJyxcclxuICAgICdjbG9zZSdcclxuICBdKTtcclxuXHJcbiAgZnVuY3Rpb24gREIoZGIpIHtcclxuICAgIHRoaXMuX2RiID0gZGI7XHJcbiAgfVxyXG5cclxuICBEQi5wcm90b3R5cGUudHJhbnNhY3Rpb24gPSBmdW5jdGlvbigpIHtcclxuICAgIHJldHVybiBuZXcgVHJhbnNhY3Rpb24odGhpcy5fZGIudHJhbnNhY3Rpb24uYXBwbHkodGhpcy5fZGIsIGFyZ3VtZW50cykpO1xyXG4gIH07XHJcblxyXG4gIHByb3h5UHJvcGVydGllcyhEQiwgJ19kYicsIFtcclxuICAgICduYW1lJyxcclxuICAgICd2ZXJzaW9uJyxcclxuICAgICdvYmplY3RTdG9yZU5hbWVzJ1xyXG4gIF0pO1xyXG5cclxuICBwcm94eU1ldGhvZHMoREIsICdfZGInLCBJREJEYXRhYmFzZSwgW1xyXG4gICAgJ2Nsb3NlJ1xyXG4gIF0pO1xyXG5cclxuICAvLyBBZGQgY3Vyc29yIGl0ZXJhdG9yc1xyXG4gIC8vIFRPRE86IHJlbW92ZSB0aGlzIG9uY2UgYnJvd3NlcnMgZG8gdGhlIHJpZ2h0IHRoaW5nIHdpdGggcHJvbWlzZXNcclxuICBbJ29wZW5DdXJzb3InLCAnb3BlbktleUN1cnNvciddLmZvckVhY2goZnVuY3Rpb24oZnVuY05hbWUpIHtcclxuICAgIFtPYmplY3RTdG9yZSwgSW5kZXhdLmZvckVhY2goZnVuY3Rpb24oQ29uc3RydWN0b3IpIHtcclxuICAgICAgQ29uc3RydWN0b3IucHJvdG90eXBlW2Z1bmNOYW1lLnJlcGxhY2UoJ29wZW4nLCAnaXRlcmF0ZScpXSA9IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHZhciBhcmdzID0gdG9BcnJheShhcmd1bWVudHMpO1xyXG4gICAgICAgIHZhciBjYWxsYmFjayA9IGFyZ3NbYXJncy5sZW5ndGggLSAxXTtcclxuICAgICAgICB2YXIgbmF0aXZlT2JqZWN0ID0gdGhpcy5fc3RvcmUgfHwgdGhpcy5faW5kZXg7XHJcbiAgICAgICAgdmFyIHJlcXVlc3QgPSBuYXRpdmVPYmplY3RbZnVuY05hbWVdLmFwcGx5KG5hdGl2ZU9iamVjdCwgYXJncy5zbGljZSgwLCAtMSkpO1xyXG4gICAgICAgIHJlcXVlc3Qub25zdWNjZXNzID0gZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICBjYWxsYmFjayhyZXF1ZXN0LnJlc3VsdCk7XHJcbiAgICAgICAgfTtcclxuICAgICAgfTtcclxuICAgIH0pO1xyXG4gIH0pO1xyXG5cclxuICAvLyBwb2x5ZmlsbCBnZXRBbGxcclxuICBbSW5kZXgsIE9iamVjdFN0b3JlXS5mb3JFYWNoKGZ1bmN0aW9uKENvbnN0cnVjdG9yKSB7XHJcbiAgICBpZiAoQ29uc3RydWN0b3IucHJvdG90eXBlLmdldEFsbCkgcmV0dXJuO1xyXG4gICAgQ29uc3RydWN0b3IucHJvdG90eXBlLmdldEFsbCA9IGZ1bmN0aW9uKHF1ZXJ5LCBjb3VudCkge1xyXG4gICAgICB2YXIgaW5zdGFuY2UgPSB0aGlzO1xyXG4gICAgICB2YXIgaXRlbXMgPSBbXTtcclxuXHJcbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbihyZXNvbHZlKSB7XHJcbiAgICAgICAgaW5zdGFuY2UuaXRlcmF0ZUN1cnNvcihxdWVyeSwgZnVuY3Rpb24oY3Vyc29yKSB7XHJcbiAgICAgICAgICBpZiAoIWN1cnNvcikge1xyXG4gICAgICAgICAgICByZXNvbHZlKGl0ZW1zKTtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgaXRlbXMucHVzaChjdXJzb3IudmFsdWUpO1xyXG5cclxuICAgICAgICAgIGlmIChjb3VudCAhPT0gdW5kZWZpbmVkICYmIGl0ZW1zLmxlbmd0aCA9PSBjb3VudCkge1xyXG4gICAgICAgICAgICByZXNvbHZlKGl0ZW1zKTtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgY3Vyc29yLmNvbnRpbnVlKCk7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgIH0pO1xyXG4gICAgfTtcclxuICB9KTtcclxuXHJcbiAgdmFyIGV4cCA9IHtcclxuICAgIG9wZW46IGZ1bmN0aW9uKG5hbWUsIHZlcnNpb24sIHVwZ3JhZGVDYWxsYmFjaykge1xyXG4gICAgICB2YXIgcCA9IHByb21pc2lmeVJlcXVlc3RDYWxsKGluZGV4ZWREQiwgJ29wZW4nLCBbbmFtZSwgdmVyc2lvbl0pO1xyXG4gICAgICB2YXIgcmVxdWVzdCA9IHAucmVxdWVzdDtcclxuXHJcbiAgICAgIHJlcXVlc3Qub251cGdyYWRlbmVlZGVkID0gZnVuY3Rpb24oZXZlbnQpIHtcclxuICAgICAgICBpZiAodXBncmFkZUNhbGxiYWNrKSB7XHJcbiAgICAgICAgICB1cGdyYWRlQ2FsbGJhY2sobmV3IFVwZ3JhZGVEQihyZXF1ZXN0LnJlc3VsdCwgZXZlbnQub2xkVmVyc2lvbiwgcmVxdWVzdC50cmFuc2FjdGlvbikpO1xyXG4gICAgICAgIH1cclxuICAgICAgfTtcclxuXHJcbiAgICAgIHJldHVybiBwLnRoZW4oZnVuY3Rpb24oZGIpIHtcclxuICAgICAgICByZXR1cm4gbmV3IERCKGRiKTtcclxuICAgICAgfSk7XHJcbiAgICB9LFxyXG4gICAgZGVsZXRlOiBmdW5jdGlvbihuYW1lKSB7XHJcbiAgICAgIHJldHVybiBwcm9taXNpZnlSZXF1ZXN0Q2FsbChpbmRleGVkREIsICdkZWxldGVEYXRhYmFzZScsIFtuYW1lXSk7XHJcbiAgICB9XHJcbiAgfTtcclxuXHJcbiAgaWYgKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnKSB7XHJcbiAgICBtb2R1bGUuZXhwb3J0cyA9IGV4cDtcclxuICB9XHJcbiAgZWxzZSB7XHJcbiAgICBzZWxmLmlkYiA9IGV4cDtcclxuICB9XHJcbn0oKSk7XHJcbiIsImltcG9ydCBpZGIgZnJvbSAnaWRiJztcclxuXHJcbi8qKiBcclxuICogU2VwYXJhdGUgY2FjaGVzIGZvciB0aGUganBnIGltYWdlcyBhbmQgYWxsIHRoZSBvdGhlciBjb250ZW50IFxyXG4gKi9cclxudmFyIENBQ0hFX1NUQVRJQyA9ICdyZXN0YXVyYW50LXJldmlld3Mtc3RhdGljLXYxJztcclxudmFyIENBQ0hFX0lNQUdFUyA9ICdyZXN0YXVyYW50LXJldmlld3MtaW1hZ2VzLXYxJztcclxuY29uc3Qgb2ZmbGluZVBhZ2UgPSAnLi80MDQuaHRtbCc7XHJcbnZhciBkYlByb21pc2U7XHJcbnZhciByZXZpZXdzRGJQcm9taXNlO1xyXG52YXIgdGVtcERCUHJvbWlzZTtcclxudmFyIHJldmlld0Zvcm1EYXRhO1xyXG5cclxuXHJcbi8qKiBcclxuICogRmV0Y2ggYW5kIGNhY2hlIGltYWdlIHJlcXVlc3QgXHJcbiAqL1xyXG5mdW5jdGlvbiBjYWNoZUltYWdlcyhyZXF1ZXN0KSB7XHJcbiAgXHJcbiAgLy8gUmVtb3ZlIHNpemUtcmVsYXRlZCBpbmZvIGZyb20gaW1hZ2UgbmFtZSBcclxuICB2YXIgdXJsVG9GZXRjaCA9IHJlcXVlc3QudXJsLnNsaWNlKDAsIHJlcXVlc3QudXJsLmluZGV4T2YoJy0nKSk7XHJcbiAgIFxyXG4gIHJldHVybiBjYWNoZXMub3BlbihDQUNIRV9JTUFHRVMpLnRoZW4oY2FjaGUgPT4geyAgXHJcbiAgICByZXR1cm4gY2FjaGUubWF0Y2godXJsVG9GZXRjaCkudGhlbihyZXNwb25zZSA9PiB7XHJcbiAgXHJcbiAgICAgIC8vIENhY2hlIGhpdCAtIHJldHVybiByZXNwb25zZSBlbHNlIGZldGNoXHJcbiAgICAgIC8vIFdlIGNsb25lIHRoZSByZXF1ZXN0IGJlY2F1c2UgaXQncyBhIHN0cmVhbSBhbmQgY2FuIGJlIGNvbnN1bWVkIG9ubHkgb25jZVxyXG4gICAgICB2YXIgbmV0d29ya0ZldGNoID0gZmV0Y2gocmVxdWVzdC5jbG9uZSgpKS50aGVuKChuZXR3b3JrUmVzcG9uc2UpID0+IHtcclxuICAgICAgICAvLyBDaGVjayBpZiB3ZSByZWNlaXZlZCBhbiBpbnZhbGlkIHJlc3BvbnNlXHJcbiAgICAgICAgaWYobmV0d29ya1Jlc3BvbnNlLnN0YXR1cyA9PSA0MDQpIHJldHVybjtcclxuXHJcbiAgICAgICAgLy8gV2UgY2xvbmUgdGhlIHJlc3BvbnNlIGJlY2F1c2UgaXQncyBhIHN0cmVhbSBhbmQgY2FuIGJlIGNvbnN1bWVkIG9ubHkgb25jZVxyXG4gICAgICAgIGNhY2hlLnB1dCh1cmxUb0ZldGNoLCBuZXR3b3JrUmVzcG9uc2UuY2xvbmUoKSk7XHJcblxyXG4gICAgICAgIHJldHVybiBuZXR3b3JrUmVzcG9uc2U7XHJcblxyXG4gICAgICB9LCAocmVqZWN0ZWQpID0+IHtcclxuICAgICAgICByZXR1cm4gcmVzcG9uc2U7XHJcbiAgICAgIH0pLmNhdGNoKCgpID0+IHtcclxuICAgICAgICByZXR1cm4gcmVzcG9uc2U7XHJcbiAgICAgIH0pO1xyXG5cclxuICAgICAgLy8gLy9pZiBhY2Nlc3MgdG8gbmV0d29yayBpcyBnb29kIHdlIHdhbnQgdGhlIGJlc3QgcXVhbGl0eSBpbWFnZVxyXG4gICAgICByZXR1cm4gbmV0d29ya0ZldGNoO1xyXG5cclxuICAgIH0pLmNhdGNoKCgpID0+IHsgXHJcblxyXG4gICAgICByZXR1cm4gZmV0Y2gocmVxdWVzdC5jbG9uZSgpKS50aGVuKChuZXR3b3JrUmVzcG9uc2UpID0+IHtcclxuICAgICAgICAvLyBDaGVjayBpZiB3ZSByZWNlaXZlZCBhbiBpbnZhbGlkIHJlc3BvbnNlXHJcbiAgICAgICAgaWYobmV0d29ya1Jlc3BvbnNlLnN0YXR1cyA9PSA0MDQpIHJldHVybjtcclxuXHJcbiAgICAgICAgLy8gV2UgY2xvbmUgdGhlIHJlc3BvbnNlIGJlY2F1c2UgaXQncyBhIHN0cmVhbSBhbmQgY2FuIGJlIGNvbnN1bWVkIG9ubHkgb25jZVxyXG4gICAgICAgIGNhY2hlLnB1dCh1cmxUb0ZldGNoLCBuZXR3b3JrUmVzcG9uc2UuY2xvbmUoKSk7XHJcblxyXG4gICAgICAgIHJldHVybiBuZXR3b3JrUmVzcG9uc2U7XHJcblxyXG4gICAgICB9LCAocmVqZWN0ZWQpID0+IHtcclxuICAgICAgICByZXR1cm4gY2FjaGVzLm1hdGNoKG9mZmxpbmVQYWdlKTsgXHJcbiAgICAgIH0pLmNhdGNoKCgpID0+IHtcclxuICAgICAgICByZXR1cm4gY2FjaGVzLm1hdGNoKG9mZmxpbmVQYWdlKTsgXHJcbiAgICAgIH0pO1xyXG4gICAgfSlcclxuICB9KTtcclxufVxyXG5cclxuLyoqIFxyXG4gKiBGZXRjaCBhbmQgY2FjaGUgc3RhdGljIGNvbnRlbnQgYW5kIGdvb2dsZSBtYXAgcmVsYXRlZCBjb250ZW50IFxyXG4gKi9cclxuIGZ1bmN0aW9uIGNhY2hlU3RhdGljQ29udGVudChyZXF1ZXN0KSB7XHJcbiAgICBcclxuICByZXR1cm4gY2FjaGVzLm9wZW4oQ0FDSEVfU1RBVElDKS50aGVuKGNhY2hlID0+IHtcclxuICAgIHJldHVybiBjYWNoZS5tYXRjaChyZXF1ZXN0KS50aGVuKHJlc3BvbnNlID0+IHtcclxuICAgIFxyXG4gICAgICAgIC8vIENhY2hlIGhpdCAtIHJldHVybiByZXNwb25zZSBlbHNlIGZldGNoXHJcbiAgICAgICAgLy8gV2UgY2xvbmUgdGhlIHJlcXVlc3QgYmVjYXVzZSBpdCdzIGEgc3RyZWFtIGFuZCBjYW4gYmUgY29uc3VtZWQgb25seSBvbmNlXHJcbiAgICAgIHJldHVybiByZXNwb25zZSB8fCBmZXRjaChyZXF1ZXN0LmNsb25lKCkpLnRoZW4obmV0d29ya1Jlc3BvbnNlID0+IHtcclxuICAgICAgICAvLyBDaGVjayBpZiB3ZSByZWNlaXZlZCBhbiBpbnZhbGlkIHJlc3BvbnNlXHJcbiAgICAgICAgaWYobmV0d29ya1Jlc3BvbnNlLnN0YXR1cyA9PSA0MDQpIHJldHVybjtcclxuICAgIFxyXG4gICAgICAgIC8vIFdlIGNsb25lIHRoZSByZXNwb25zZSBiZWNhdXNlIGl0J3MgYSBzdHJlYW0gYW5kIGNhbiBiZSBjb25zdW1lZCBvbmx5IG9uY2VcclxuICAgICAgICBjYWNoZS5wdXQocmVxdWVzdCwgbmV0d29ya1Jlc3BvbnNlLmNsb25lKCkpO1xyXG4gICAgICAgIHJldHVybiBuZXR3b3JrUmVzcG9uc2U7XHJcblxyXG4gICAgICB9KS5jYXRjaCgoKSA9PiB7IFxyXG4gICAgICAgIHJldHVybiBjYWNoZXMubWF0Y2gob2ZmbGluZVBhZ2UpOyBcclxuICAgICAgfSlcclxuICAgIH0pO1xyXG4gIH0pO1xyXG59XHJcblxyXG4vKipcclxuICogRmV0Y2hlcyBmcm9tIG5ldHdvcmsgYW5kIHB1dHMgaW4gaW5kZXhlZCBkYiBsYXRlc3QgZGF0YVxyXG4gKi9cclxuZnVuY3Rpb24gZ2V0TGF0ZXN0RGF0YShyZXF1ZXN0KSB7XHJcblxyXG4gIHZhciBwYXRoU2xpY2VzID0gcmVxdWVzdC51cmwuc3BsaXQoXCIvXCIpO1xyXG4gIHZhciByZXN0YXVyYW50SWQgPSBwYXJzZUludChwYXRoU2xpY2VzW3BhdGhTbGljZXMubGVuZ3RoIC0gMV0pIHx8IDA7XHJcblxyXG4gIHJldHVybiBmZXRjaChyZXF1ZXN0LmNsb25lKCkpLnRoZW4obmV0d29ya1Jlc3BvbnNlID0+IHtcclxuXHJcbiAgICBpZihuZXR3b3JrUmVzcG9uc2Uuc3RhdHVzID09IDQwNCkgcmV0dXJuO1xyXG5cclxuICAgIG5ldHdvcmtSZXNwb25zZS5jbG9uZSgpLmpzb24oKS50aGVuKGpzb24gPT4ge1xyXG5cclxuICAgICAgaWYoIWRiUHJvbWlzZSkgcmV0dXJuO1xyXG5cclxuICAgICAgZGJQcm9taXNlLnRoZW4oZGIgPT4ge1xyXG4gICAgICAgICAgICBcclxuICAgICAgICBpZighZGIpIHJldHVybjtcclxuXHJcbiAgICAgICAgdmFyIHR4ID0gZGIudHJhbnNhY3Rpb24oJ3Jlc3RhdXJhbnRzJywgJ3JlYWR3cml0ZScpO1xyXG4gICAgICAgIHZhciBzdG9yZSA9IHR4Lm9iamVjdFN0b3JlKCdyZXN0YXVyYW50cycpO1xyXG5cclxuICAgICAgICBpZighcmVzdGF1cmFudElkKXsgLy8gaWYgd2UgcmVmZXIgdG8gYWxsIGRhdGFcclxuXHJcbiAgICAgICAgICBqc29uLmZvckVhY2gocmVzdGF1cmFudCA9PiB7XHJcbiAgICAgICAgICAgIHN0b3JlLnB1dChyZXN0YXVyYW50LCByZXN0YXVyYW50LmlkKTtcclxuICAgICAgICAgIH0pO1xyXG4gICAgICAgIFxyXG4gICAgICAgIH0gZWxzZSB7IC8vIGlmIHdlIHJlZmVyIHRvIHBlciByZXN0YXVyYW50IGRhdGEgXHJcbiAgICAgICAgICAgc3RvcmUucHV0KGpzb24sIGpzb24uaWQpO1xyXG4gICAgICAgIH1cclxuICAgICAgfSk7XHJcbiAgICB9KTtcclxuXHJcbiAgICByZXR1cm4gbmV0d29ya1Jlc3BvbnNlO1xyXG5cclxuICB9KTtcclxufVxyXG5cclxuLyoqXHJcbiAqIFNlYXJjaGVzIHRoZSBpbmRleGVkIGRiIGZvciBkYXRhIGFuZCBpZiBub3RoaW5nIGZvdW5kIHRyaWVzIHRoZSBuZXdvcmtcclxuICovXHJcbmZ1bmN0aW9uIHNlYXJjaEluSURCKHJlcXVlc3QpIHtcclxuXHJcbiAgdmFyIHBhdGhTbGljZXMgPSByZXF1ZXN0LmNsb25lKCkudXJsLnNwbGl0KFwiL1wiKTtcclxuICB2YXIgcmVzdGF1cmFudElkID0gcGFyc2VJbnQocGF0aFNsaWNlc1twYXRoU2xpY2VzLmxlbmd0aCAtIDFdKSB8fCAwO1xyXG4gIHZhciBkYXRhUHJvbWlzZTtcclxuXHJcbiAgLy8gaWYgbm90IGluZGV4ZWQgZGIgZnVuY3Rpb25hbGl0eVxyXG4gIGlmKCFkYlByb21pc2UpIHJldHVybiBnZXRMYXRlc3REYXRhKHJlcXVlc3QuY2xvbmUoKSk7XHJcblxyXG4gIHJldHVybiBkYlByb21pc2UudGhlbihkYiA9PiB7XHJcbiAgICBcclxuICAgIGlmKCFkYikgcmV0dXJuIGdldExhdGVzdERhdGEocmVxdWVzdC5jbG9uZSgpKTtcclxuXHJcbiAgICB2YXIgc3RvcmUgPSBkYi50cmFuc2FjdGlvbigncmVzdGF1cmFudHMnKS5vYmplY3RTdG9yZSgncmVzdGF1cmFudHMnKTtcclxuXHJcbiAgICBpZighcmVzdGF1cmFudElkKSB7IC8vIGlmIGFsbCBkYXRhIGFyZSByZXF1ZXN0ZWRcclxuICAgICAgZGF0YVByb21pc2UgPSBzdG9yZS5nZXRBbGwoKTtcclxuICAgIH0gZWxzZSB7IC8vIGlmIHBlciByZXN0YXVyYW50IGRhdGEgYXJlIHJlcXVlc3RlZFxyXG4gICAgICBkYXRhUHJvbWlzZSA9IHN0b3JlLmdldChyZXN0YXVyYW50SWQpO1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICBpZighZGF0YVByb21pc2UpIHJldHVybiBnZXRMYXRlc3REYXRhKHJlcXVlc3QuY2xvbmUoKSk7XHJcblxyXG4gICAgcmV0dXJuIGRhdGFQcm9taXNlLnRoZW4oZGF0YSA9PiB7ICBcclxuXHJcbiAgICAgIHZhciBuZXR3b3JrRmV0Y2ggPSBnZXRMYXRlc3REYXRhKHJlcXVlc3QuY2xvbmUoKSk7XHJcblxyXG4gICAgICAvLyBpZiBkYXRhIGZvdW5kIGluIGluZGV4ZWQgZGIgcmV0dXJuIHRoZW1cclxuICAgICAgaWYoSlNPTi5zdHJpbmdpZnkoZGF0YSkgIT09IEpTT04uc3RyaW5naWZ5KFtdKSAmJiBkYXRhICE9PSB1bmRlZmluZWQpICB7IFxyXG5cclxuICAgICAgICBjb25zb2xlLmxvZygnRm91bmQgY2FjaGVkJyk7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBSZXNwb25zZShKU09OLnN0cmluZ2lmeShkYXRhKSk7IFxyXG4gICAgICB9XHJcblxyXG4gICAgICByZXR1cm4gbmV0d29ya0ZldGNoO1xyXG4gICAgfSk7XHJcbiAgfSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHVwZGF0ZVJlc3RhdXJhbnRJbmRleGVkRGIocmVxdWVzdCl7XHJcbiAgXHJcbiAgcmV0dXJuIGZldGNoKHJlcXVlc3QuY2xvbmUoKSkudGhlbihuZXR3b3JrUmVzcG9uc2UgPT4ge1xyXG5cclxuICAgIGlmKG5ldHdvcmtSZXNwb25zZS5zdGF0dXMgPT0gNDA0KSByZXR1cm47XHJcbiAgXHJcbiAgICBuZXR3b3JrUmVzcG9uc2UuY2xvbmUoKS5qc29uKCkudGhlbihqc29uID0+IHtcclxuICBcclxuICAgICAgaWYoIWRiUHJvbWlzZSkgcmV0dXJuO1xyXG4gIFxyXG4gICAgICBkYlByb21pc2UudGhlbihkYiA9PiB7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgIGlmKCFkYikgcmV0dXJuO1xyXG4gIFxyXG4gICAgICAgIHZhciB0eCA9IGRiLnRyYW5zYWN0aW9uKCdyZXN0YXVyYW50cycsICdyZWFkd3JpdGUnKTtcclxuICAgICAgICB2YXIgc3RvcmUgPSB0eC5vYmplY3RTdG9yZSgncmVzdGF1cmFudHMnKTtcclxuICBcclxuICAgICAgICBzdG9yZS5wdXQoanNvbiwganNvbi5pZCk7XHJcbiAgICAgICAgXHJcbiAgICAgIH0pO1xyXG4gICAgfSk7XHJcbiAgXHJcbiAgICByZXR1cm4gbmV0d29ya1Jlc3BvbnNlO1xyXG4gIFxyXG4gIH0pO1xyXG59XHJcblxyXG4vKipcclxuICogRmV0Y2hlcyBmcm9tIG5ldHdvcmsgYW5kIHB1dHMgaW4gaW5kZXhlZCBkYiB0aGUgbGF0ZXN0IHJldmlld3NcclxuICovXHJcbmZ1bmN0aW9uIGdldExhdGVzdFJldmlld3MocmVxdWVzdCkge1xyXG4gIFxyXG4gIHJldHVybiBmZXRjaChyZXF1ZXN0LmNsb25lKCkpLnRoZW4obmV0d29ya1Jlc3BvbnNlID0+IHtcclxuXHJcbiAgICBpZihuZXR3b3JrUmVzcG9uc2Uuc3RhdHVzID09IDQwNCkgcmV0dXJuO1xyXG5cclxuICAgIG5ldHdvcmtSZXNwb25zZS5jbG9uZSgpLmpzb24oKS50aGVuKGpzb24gPT4ge1xyXG5cclxuICAgICAgaWYoIXJldmlld3NEYlByb21pc2UpIHJldHVybjtcclxuXHJcbiAgICAgIHJldmlld3NEYlByb21pc2UudGhlbihkYiA9PiB7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgIGlmKCFkYikgcmV0dXJuO1xyXG5cclxuICAgICAgICB2YXIgdHggPSBkYi50cmFuc2FjdGlvbigncmVzdGF1cmFudC1yZXZpZXdzJywgJ3JlYWR3cml0ZScpO1xyXG4gICAgICAgIHZhciBzdG9yZSA9IHR4Lm9iamVjdFN0b3JlKCdyZXN0YXVyYW50LXJldmlld3MnKTtcclxuXHJcbiAgICAgICAganNvbi5mb3JFYWNoKHJldmlldyA9PiB7XHJcbiAgICAgICAgICByZXZpZXcucmVzdGF1cmFudF9pZCA9ICBwYXJzZUludChyZXZpZXcucmVzdGF1cmFudF9pZCkgfHwgMDtcclxuICAgICAgICAgIHN0b3JlLnB1dChyZXZpZXcsIHJldmlldy5pZCk7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgIH0pO1xyXG4gICAgfSk7XHJcblxyXG4gICAgcmV0dXJuIG5ldHdvcmtSZXNwb25zZTtcclxuXHJcbiAgfSk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBTZWFyY2hlcyB0aGUgaW5kZXhlZCBkYiBmb3IgcmV2aWV3cyBhbmQgaWYgbm90aGluZyBmb3VuZCB0cmllcyB0aGUgbmV3b3JrXHJcbiAqL1xyXG5mdW5jdGlvbiBzZWFyY2hJREJGb3JSZXZpZXdzKHJlcXVlc3QpIHtcclxuXHJcbiAgdmFyIHBhdGhTbGljZXMgPSByZXF1ZXN0LmNsb25lKCkudXJsLnNwbGl0KFwicmVzdGF1cmFudF9pZD1cIik7XHJcbiAgdmFyIHJlc3RhdXJhbnRJZCA9IHBhcnNlSW50KHBhdGhTbGljZXNbcGF0aFNsaWNlcy5sZW5ndGggLSAxXSkgfHwgMDtcclxuXHJcbiAgLy8gaWYgbm90IGluZGV4ZWQgZGIgZnVuY3Rpb25hbGl0eVxyXG4gIGlmKCFyZXZpZXdzRGJQcm9taXNlKSByZXR1cm4gZ2V0TGF0ZXN0UmV2aWV3cyhyZXF1ZXN0LmNsb25lKCkpO1xyXG5cclxuICByZXR1cm4gcmV2aWV3c0RiUHJvbWlzZS50aGVuKGRiID0+IHtcclxuICAgIFxyXG4gICAgaWYoIWRiKSByZXR1cm4gZ2V0TGF0ZXN0UmV2aWV3cyhyZXF1ZXN0LmNsb25lKCkpO1xyXG5cclxuICAgIHZhciBzdG9yZSA9IGRiLnRyYW5zYWN0aW9uKCdyZXN0YXVyYW50LXJldmlld3MnKS5vYmplY3RTdG9yZSgncmVzdGF1cmFudC1yZXZpZXdzJyk7XHJcbiAgICB2YXIgaW5kZXggPSBzdG9yZS5pbmRleCgnYnktcmVzdGF1cmFudCcpO1xyXG4gIFxyXG4gICAgcmV0dXJuIGluZGV4LmdldEFsbChyZXN0YXVyYW50SWQpLnRoZW4oZGF0YSA9PiB7ICBcclxuXHJcbiAgICAgIHZhciBuZXR3b3JrRmV0Y2ggPSBnZXRMYXRlc3RSZXZpZXdzKHJlcXVlc3QuY2xvbmUoKSk7XHJcblxyXG4gICAgICAvLyBpZiBkYXRhIGZvdW5kIGluIGluZGV4ZWQgZGIgcmV0dXJuIHRoZW1cclxuICAgICAgaWYoSlNPTi5zdHJpbmdpZnkoZGF0YSkgIT09IEpTT04uc3RyaW5naWZ5KFtdKSAmJiBkYXRhICE9PSB1bmRlZmluZWQpICB7IFxyXG5cclxuICAgICAgICBjb25zb2xlLmxvZygnRm91bmQgY2FjaGVkJyk7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBSZXNwb25zZShKU09OLnN0cmluZ2lmeShkYXRhKSk7IFxyXG4gICAgICB9XHJcblxyXG4gICAgICByZXR1cm4gbmV0d29ya0ZldGNoO1xyXG4gICAgfSk7XHJcblxyXG4gIH0pLmNhdGNoKGVycm9yID0+IHtcclxuICAgIHJldHVybiBuZXcgUmVzcG9uc2UoSlNPTi5zdHJpbmdpZnkoW10pKTsgXHJcbiAgfSk7XHJcbn1cclxuXHJcblxyXG4vKipcclxuICogU2VhcmNoZXMgdGhlIHRlbXAgaW5kZXhlZCBkYiBmb3IgcmV2aWV3c1xyXG4gKi9cclxuZnVuY3Rpb24gc2VhcmNoVGVtcERCRm9yUmV2aWV3cygpIHtcclxuXHJcbiAgaWYoIXRlbXBEQlByb21pc2UpIHJldHVybjtcclxuXHJcbiAgcmV0dXJuIHRlbXBEQlByb21pc2UudGhlbihkYiA9PiB7XHJcbiAgICBcclxuICAgIGlmKCFkYikgcmV0dXJuO1xyXG5cclxuICAgIHZhciBzdG9yZSA9IGRiLnRyYW5zYWN0aW9uKCdyZXN0YXVyYW50LXJldmlld3MtdGVtcCcpLm9iamVjdFN0b3JlKCdyZXN0YXVyYW50LXJldmlld3MtdGVtcCcpO1xyXG4gICAgdmFyIGluZGV4ID0gc3RvcmUuaW5kZXgoJ2J5LXR5cGUnKTtcclxuICBcclxuICAgIHJldHVybiBpbmRleC5nZXRBbGwoJ2NyZWF0ZS1yZXZpZXcnKS50aGVuKGRhdGEgPT4geyAgXHJcblxyXG4gICAgICAvLyBpZiBkYXRhIGZvdW5kIGluIGluZGV4ZWQgZGIgcmV0dXJuIHRoZW1cclxuICAgICAgaWYoSlNPTi5zdHJpbmdpZnkoZGF0YSkgIT09IEpTT04uc3RyaW5naWZ5KFtdKSAmJiBkYXRhICE9PSB1bmRlZmluZWQpICB7IFxyXG5cclxuICAgICAgICByZXR1cm4gbmV3IFJlc3BvbnNlKEpTT04uc3RyaW5naWZ5KGRhdGEpKTsgXHJcbiAgICAgIH1cclxuICAgIH0pO1xyXG4gIH0pO1xyXG59XHJcblxyXG4vKipcclxuICogR2V0cyBhbGwgZGF0YSBzdG9yZWQgaW4gdGVtcCBpbmRleGVkIGRiIGFuZCBcclxuICogYXR0ZW1wdHMgc3ljaHJvbml6YXRpb24gd2l0aCB0aGUgc2VydmVyXHJcbiAqL1xyXG5mdW5jdGlvbiBzeW5jV2l0aFNlcnZlcigpIHtcclxuXHJcbiAgcmV0dXJuIHRlbXBEQlByb21pc2UudGhlbihkYiA9PiB7XHJcbiAgICAgICAgICAgIFxyXG4gICAgaWYoIWRiKSByZXR1cm47XHJcblxyXG4gICAgdmFyIHR4ID0gZGIudHJhbnNhY3Rpb24oJ3Jlc3RhdXJhbnQtcmV2aWV3cy10ZW1wJywgJ3JlYWR3cml0ZScpO1xyXG4gICAgdmFyIHN0b3JlID0gdHgub2JqZWN0U3RvcmUoJ3Jlc3RhdXJhbnQtcmV2aWV3cy10ZW1wJyk7XHJcblxyXG4gICAgcmV0dXJuIHN0b3JlLmdldEFsbCgpLnRoZW4odGVtcFJlcXVlc3RzID0+IHtcclxuXHJcbiAgICAgIHJldHVybiBQcm9taXNlLmFsbCh0ZW1wUmVxdWVzdHMubWFwKGZ1bmN0aW9uKHRlbXBSZXF1ZXN0KSB7XHJcbiAgICAgICAgXHJcbiAgICAgICAgcmV0dXJuIHNlbmRUb1NlcnZlcih0ZW1wUmVxdWVzdClcclxuICAgICAgICAudGhlbigobmV0d29ya1Jlc3BvbnNlKSA9PiB7XHJcbiAgICAgICAgICBcclxuICAgICAgICAgIGNvbnNvbGUubG9nKCdTdWNjZXNzIHN5bmNpbmchJyk7XHJcblxyXG4gICAgICAgICAgdmFyIHR4MSA9IGRiLnRyYW5zYWN0aW9uKCdyZXN0YXVyYW50LXJldmlld3MtdGVtcCcsICdyZWFkd3JpdGUnKTtcclxuICAgICAgICAgIHZhciBzdG9yZTEgPSB0eDEub2JqZWN0U3RvcmUoJ3Jlc3RhdXJhbnQtcmV2aWV3cy10ZW1wJyk7XHJcblxyXG4gICAgICAgICAgc3RvcmUxLmRlbGV0ZSh0ZW1wUmVxdWVzdC5jcmVhdGVkQXQpO1xyXG4gICAgICAgICAgXHJcbiAgICAgICAgICByZXR1cm4gbmV0d29ya1Jlc3BvbnNlLmpzb24oKTtcclxuICAgICAgXHJcbiAgICAgICAgfSkudGhlbihqc29uID0+IHtcclxuXHJcbiAgICAgICAgICBpZih0ZW1wUmVxdWVzdC50eXBlID09PSAnY3JlYXRlLXJldmlldycpIHtcclxuXHJcbiAgICAgICAgICAgIGlmKCFyZXZpZXdzRGJQcm9taXNlKSByZXR1cm47XHJcblxyXG4gICAgICAgICAgICByZXZpZXdzRGJQcm9taXNlLnRoZW4oZGIxID0+IHtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgaWYoIWRiMSkgcmV0dXJuO1xyXG4gICAgICBcclxuICAgICAgICAgICAgICB2YXIgdHgyID0gZGIxLnRyYW5zYWN0aW9uKCdyZXN0YXVyYW50LXJldmlld3MnLCAncmVhZHdyaXRlJyk7XHJcbiAgICAgICAgICAgICAgdmFyIHN0b3JlMiA9IHR4Mi5vYmplY3RTdG9yZSgncmVzdGF1cmFudC1yZXZpZXdzJyk7XHJcbiAgICBcclxuICAgICAgICAgICAgICBqc29uLnJlc3RhdXJhbnRfaWQgPSBwYXJzZUludChqc29uLnJlc3RhdXJhbnRfaWQpIHx8IDA7XHJcbiAgICAgICAgICAgICAgc3RvcmUyLnB1dChqc29uLCBqc29uLmlkKTtcclxuICAgICAgICAgICAgfSk7ICBcclxuICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgICAgfSkpO1xyXG4gICAgfSk7XHJcbiAgfSkuY2F0Y2goZXJyb3IgPT4ge1xyXG4gICAgdGhyb3cgZXJyb3I7XHJcbiAgfSkgXHJcbn1cclxuXHJcbi8qKlxyXG4gKiBTZW5kcyBwb3N0L3B1dCByZXF1ZXN0IHRvIHNlcnZlclxyXG4gKiBcclxuICogQHBhcmFtIHsqfSBkYXRhIFxyXG4gKi9cclxuZnVuY3Rpb24gc2VuZFRvU2VydmVyKGRhdGEpIHtcclxuXHJcbiAgcmV0dXJuIGZldGNoKGRhdGEudXJsLCB7XHJcbiAgICBoZWFkZXJzOiB7XHJcblxyXG4gICAgICBcIkFjY2VwdFwiOiBcInRleHQvaHRtbCxhcHBsaWNhdGlvbi94aHRtbCt4bWwsYXBwbGljYXRpb24veG1sO3E9MC45LGltYWdlL3dlYnAsaW1hZ2UvYXBuZywqLyo7cT0wLjhcIixcclxuICAgICAgXCJDb25uZWN0aW9uXCI6IFwia2VlcC1hbGl2ZVwiLFxyXG4gICAgICBcIkNvbnRlbnQtTGVuZ3RoXCI6IGAke3NlcmlhbGl6ZU9iamVjdChkYXRhLmZvcm1EYXRhKS5sZW5ndGh9YCxcclxuICAgICAgXCJDb250ZW50LVR5cGVcIjogXCJhcHBsaWNhdGlvbi94LXd3dy1mb3JtLXVybGVuY29kZWRcIlxyXG4gICAgfSxcclxuICAgIG1ldGhvZDogZGF0YS5tZXRob2QsXHJcbiAgICBib2R5OiBzZXJpYWxpemVPYmplY3QoZGF0YS5mb3JtRGF0YSksXHJcbiAgfSk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBTYXZlcyB0ZW1wIHBvc3QvcHV0IHJlcXVlc3RzIGRhdGEgd2hlbiBiYWQgY29ubmVjdGlvblxyXG4gKiBcclxuICogQHBhcmFtIHsqfSBkYXRhIFxyXG4gKi9cclxuZnVuY3Rpb24gc2F2ZUluVGVtcERCKGRhdGEpIHtcclxuICBcclxuICBpZighdGVtcERCUHJvbWlzZSkgcmV0dXJuO1xyXG5cclxuICByZXR1cm4gdGVtcERCUHJvbWlzZS50aGVuKGRiID0+IHtcclxuICAgICAgICAgICAgXHJcbiAgICBpZighZGIpIHJldHVybjtcclxuXHJcbiAgICB2YXIgdHggPSBkYi50cmFuc2FjdGlvbigncmVzdGF1cmFudC1yZXZpZXdzLXRlbXAnLCAncmVhZHdyaXRlJyk7XHJcbiAgICB2YXIgc3RvcmUgPSB0eC5vYmplY3RTdG9yZSgncmVzdGF1cmFudC1yZXZpZXdzLXRlbXAnKTtcclxuXHJcbiAgICBzdG9yZS5wdXQoZGF0YSwgZGF0YS5jcmVhdGVkQXQpO1xyXG5cclxuICAgIHJldHVybiBkYXRhO1xyXG5cclxuICB9KTtcclxufVxyXG5cclxuZnVuY3Rpb24gbWFya0Zhdm9yaXRlKHJlc3RhdXJhbnRfaWQpIHtcclxuICAgIFxyXG59XHJcblxyXG4vLz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSBJTkRFWEVEIERCIFBST01JU0VTXHJcblxyXG4vKipcclxuICogQ3JlYXRlIGFuIGluZGV4ZWQgZGIgb2Yga2V5dmFsIHR5cGUgbmFtZWQgYHJlc3RhdXJhbnRzYFxyXG4gKi9cclxuZnVuY3Rpb24gY3JlYXRlREIoKSB7XHJcbiAgcmV0dXJuIGlkYi5vcGVuKCdyZXN0YXVyYW50cycsIDEsIHVwZ3JhZGVEQiA9PiB7XHJcbiAgICB2YXIgc3RvcmUgPSB1cGdyYWRlREIuY3JlYXRlT2JqZWN0U3RvcmUoJ3Jlc3RhdXJhbnRzJywge1xyXG4gICAgICBrZXlwYXRoOiAnaWQnXHJcbiAgICB9KTtcclxuICB9KTtcclxufVxyXG5cclxuLyoqXHJcbiAqIENyZWF0ZSBhbiBpbmRleGVkIGRiIG9mIGtleXZhbCB0eXBlIG5hbWVkIGByZXN0YXVyYW50LXJldmlld3NgXHJcbiAqL1xyXG5mdW5jdGlvbiBjcmVhdGVSZXZpZXdEQigpIHtcclxuICByZXR1cm4gaWRiLm9wZW4oJ3Jlc3RhdXJhbnQtcmV2aWV3cycsIDEsIHVwZ3JhZGVEQiA9PiB7XHJcbiAgICB2YXIgc3RvcmUgPSB1cGdyYWRlREIuY3JlYXRlT2JqZWN0U3RvcmUoJ3Jlc3RhdXJhbnQtcmV2aWV3cycsIHtcclxuICAgICAga2V5cGF0aDogJ2lkJ1xyXG4gICAgfSk7XHJcblxyXG4gICAgc3RvcmUuY3JlYXRlSW5kZXgoJ2J5LXJlc3RhdXJhbnQnLCAncmVzdGF1cmFudF9pZCcpO1xyXG4gICAgc3RvcmUuY3JlYXRlSW5kZXgoJ2J5LWRhdGUnLCAnY3JlYXRlZEF0Jyk7XHJcbiAgfSk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBDcmVhdGUgYW4gaW5kZXhlZCBkYiBvZiBrZXl2YWwgdHlwZSBuYW1lZCBgcmVzdGF1cmFudC1yZXZpZXdzYFxyXG4gKi9cclxuZnVuY3Rpb24gY3JlYXRlVGVtcFJldmlld0RCKCkge1xyXG4gIHJldHVybiBpZGIub3BlbigncmVzdGF1cmFudC1yZXZpZXdzLXRlbXAnLCAxLCB1cGdyYWRlREIgPT4ge1xyXG4gICAgdmFyIHN0b3JlID0gdXBncmFkZURCLmNyZWF0ZU9iamVjdFN0b3JlKCdyZXN0YXVyYW50LXJldmlld3MtdGVtcCcsIHtcclxuICAgICAga2V5cGF0aDogJ2NyZWF0ZWRBdCdcclxuICAgIH0pO1xyXG5cclxuICAgIHN0b3JlLmNyZWF0ZUluZGV4KCdieS10eXBlJywgJ3R5cGUnKTtcclxuICB9KTtcclxufVxyXG5cclxuLy89PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0gRVZFTlRTXHJcblxyXG4vKiogXHJcbiAqIE9wZW4gY2FjaGVzIG9uIGluc3RhbGwgb2Ygc3cgXHJcbiAqL1xyXG5zZWxmLmFkZEV2ZW50TGlzdGVuZXIoJ2luc3RhbGwnLCBldmVudCA9PiB7XHJcbiAgLy8gT3BlbiBjYWNoZSBmb3Igc3RhdGljIGNvbnRlbnQgYW5kIGNhY2hlIDQwNCBwYWdlXHJcblxyXG4gICAgdmFyIG9wZW5TdGF0aWNDYWNoZVByb21pc2UgPSBjYWNoZXMub3BlbihDQUNIRV9TVEFUSUMpLnRoZW4oY2FjaGUgPT4ge1xyXG4gICAgICBjYWNoZS5hZGRBbGwoW29mZmxpbmVQYWdlXSk7XHJcbiAgICAgIGNvbnNvbGUubG9nKGBDYWNoZSAke0NBQ0hFX1NUQVRJQ30gb3BlbmVkYCk7XHJcbiAgICB9KTtcclxuXHJcbiAgICB2YXIgb3BlbkltYWdlQ2FjaGVQcm9taXNlID0gY2FjaGVzLm9wZW4oQ0FDSEVfSU1BR0VTKS50aGVuKGNhY2hlID0+IHtcclxuICAgICAgY29uc29sZS5sb2coYENhY2hlICR7Q0FDSEVfSU1BR0VTfSBvcGVuZWRgKTtcclxuICAgIH0pXHJcblxyXG4gICAgZGJQcm9taXNlID0gY3JlYXRlREIoKTtcclxuXHJcbiAgICBldmVudC53YWl0VW50aWwoXHJcbiAgICAgIFByb21pc2UuYWxsKFtvcGVuU3RhdGljQ2FjaGVQcm9taXNlLCBvcGVuSW1hZ2VDYWNoZVByb21pc2VdKVxyXG4gICAgICAudGhlbigoKSA9PiB7XHJcbiAgICAgICAgcmV0dXJuIHNlbGYuc2tpcFdhaXRpbmcoKVxyXG4gICAgICB9KVxyXG4gICAgKTtcclxufSk7XHJcblxyXG4vKiogXHJcbiAqIE9wZW4gaW5kZXggZGIgb24gYWN0aXZhdGVcclxuICovXHJcbnNlbGYuYWRkRXZlbnRMaXN0ZW5lcignYWN0aXZhdGUnLCBldmVudCA9PiB7XHJcblxyXG4gIGRiUHJvbWlzZSA9IGNyZWF0ZURCKCk7XHJcbiAgcmV2aWV3c0RiUHJvbWlzZSA9IGNyZWF0ZVJldmlld0RCKCk7XHJcbiAgdGVtcERCUHJvbWlzZSA9IGNyZWF0ZVRlbXBSZXZpZXdEQigpO1xyXG5cclxuICBldmVudC53YWl0VW50aWwoXHJcbiAgICBQcm9taXNlLmFsbChbZGJQcm9taXNlLCByZXZpZXdzRGJQcm9taXNlLHRlbXBEQlByb21pc2VdKVxyXG4gICAgLnRoZW4oKCkgPT4ge1xyXG4gICAgICByZXR1cm4gc2VsZi5za2lwV2FpdGluZygpXHJcbiAgICB9KVxyXG4gICk7XHJcbn0pO1xyXG5cclxuLyoqIFxyXG4gKiBIYW5kbGUgZmV0Y2ggZXZlbnRcclxuICovXHJcbnNlbGYuYWRkRXZlbnRMaXN0ZW5lcignZmV0Y2gnLCBldmVudCA9PiB7XHJcblxyXG4gIC8vIGhhbmRsZSByZXF1ZXN0IGFjY29yZGluZyB0byBpdHMgdHlwZVxyXG5cclxuICBpZihldmVudC5yZXF1ZXN0Lm1ldGhvZCA9PT0gJ1BVVCcpIHtcclxuXHJcbiAgICB1cGRhdGVSZXN0YXVyYW50SW5kZXhlZERiKGV2ZW50LnJlcXVlc3QpO1xyXG4gIH1cclxuXHJcbiAgaWYoZXZlbnQucmVxdWVzdC5tZXRob2QgPT09ICdHRVQnKSB7XHJcblxyXG4gICAgaWYoZXZlbnQucmVxdWVzdC51cmwuZW5kc1dpdGgoJy5qcGcnKSkge1xyXG4gICAgICBldmVudC5yZXNwb25kV2l0aChjYWNoZUltYWdlcyhldmVudC5yZXF1ZXN0KSk7ICBcclxuICAgICAgcmV0dXJuO1xyXG4gICAgfSBlbHNlIGlmIChldmVudC5yZXF1ZXN0LnVybC5pbmNsdWRlcygncmV2aWV3cycpKSB7XHJcblxyXG4gICAgICB2YXIgcGF0aFNsaWNlcyA9IGV2ZW50LnJlcXVlc3QuY2xvbmUoKS51cmwuc3BsaXQoXCJyZXN0YXVyYW50X2lkPVwiKTtcclxuICAgICAgdmFyIHJlc3RhdXJhbnRJZCA9IHBhcnNlSW50KHBhdGhTbGljZXNbcGF0aFNsaWNlcy5sZW5ndGggLSAxXSkgfHwgMDtcclxuICAgICAgXHJcbiAgICAgIC8qKlxyXG4gICAgICAgKiBHZXQgZGF0YSBmcm9tIHN0YWJsZSBpbmRleGVkIGRiIG9yIHRoZSBuZXR3b3JrIGFuZCBpZiBkYXRhIGV4aXN0IGluIHRlbXAgaW5kZXhlZCBkYiBcclxuICAgICAgICogcmV0dXJuIGNvbnNvbGlkYXRlZCBkYXRhIGZvciBiZXR0ZXIgdXNlciBleHBlcmllbmNlXHJcbiAgICAgICAqL1xyXG4gICAgICBldmVudC5yZXNwb25kV2l0aChcclxuICAgICAgICBQcm9taXNlLmFsbChbc2VhcmNoSURCRm9yUmV2aWV3cyhldmVudC5yZXF1ZXN0KSwgc2VhcmNoVGVtcERCRm9yUmV2aWV3cyhldmVudC5yZXF1ZXN0KV0pXHJcbiAgICAgICAgLnRoZW4oKHJlc3BvbnNlcykgPT4ge1xyXG5cclxuICAgICAgICAgIHJldHVybiBQcm9taXNlLmFsbChyZXNwb25zZXMubWFwKChyZXNwb25zZSkgPT4ge1xyXG5cclxuICAgICAgICAgICAgaWYodHlwZW9mKHJlc3BvbnNlKSA9PT0gJ3VuZGVmaW5lZCcpIHJldHVybiBbXTtcclxuICAgICAgICAgICBcclxuICAgICAgICAgICAgcmV0dXJuIHJlc3BvbnNlLmpzb24oKS50aGVuKChqc29uKSA9PiB7ICBcclxuICAgICAgICAgICAgICByZXR1cm4ganNvbjtcclxuICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgfSkpLnRoZW4oKGpzb25zKSA9PiB7XHJcbiAgICAgICAgICBcclxuICAgICAgICAgICAgdmFyIGNvbmNhdGVuYXRlZFJlc3BvbnNlID0gW107XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5hbGwoanNvbnMubWFwKChqc29uKSA9PiB7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgIGpzb24uZm9yRWFjaChvYmogPT4ge1xyXG5cclxuICAgICAgICAgICAgICAgIGlmKHR5cGVvZihvYmouZm9ybURhdGEpICE9PSAndW5kZWZpbmVkJyAmJiBvYmouZm9ybURhdGEucmVzdGF1cmFudF9pZCA9PSByZXN0YXVyYW50SWQpIHsgICAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgICAgY29uY2F0ZW5hdGVkUmVzcG9uc2UucHVzaChvYmouZm9ybURhdGEpO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmKHR5cGVvZihvYmouZm9ybURhdGEpID09PSAndW5kZWZpbmVkJyl7XHJcbiAgICAgICAgICAgICAgICAgIGNvbmNhdGVuYXRlZFJlc3BvbnNlLnB1c2gob2JqKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICB9KSkudGhlbigoKSA9PiB7XHJcbiAgICAgICAgICAgICAgcmV0dXJuIGNvbmNhdGVuYXRlZFJlc3BvbnNlO1xyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIH0pLnRoZW4oY29uY2F0ZW5hdGVkUmVzcG9uc2UgPT4ge1xyXG4gICAgICAgICAgcmV0dXJuIG5ldyBSZXNwb25zZShKU09OLnN0cmluZ2lmeShjb25jYXRlbmF0ZWRSZXNwb25zZSkpOyBcclxuICAgICAgICB9KVxyXG4gICAgICApO1xyXG4gICAgICByZXR1cm47XHJcbiAgICB9IGVsc2UgaWYgKGV2ZW50LnJlcXVlc3QudXJsLmluY2x1ZGVzKCdyZXN0YXVyYW50cycpKSB7XHJcbiAgICAgIGV2ZW50LnJlc3BvbmRXaXRoKHNlYXJjaEluSURCKGV2ZW50LnJlcXVlc3QpKTtcclxuICAgICAgcmV0dXJuO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgZXZlbnQucmVzcG9uZFdpdGgoY2FjaGVTdGF0aWNDb250ZW50KGV2ZW50LnJlcXVlc3QpKTtcclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG4gIH0gIFxyXG59KTtcclxuXHJcbnNlbGYuYWRkRXZlbnRMaXN0ZW5lcignbWVzc2FnZScsIGV2ZW50ID0+IHtcclxuXHJcbiAgaWYoZXZlbnQuZGF0YS50eXBlID09PSAnY3JlYXRlLXJldmlldycpIHtcclxuXHJcbiAgICBldmVudC5kYXRhLmNyZWF0ZWRBdCA9IERhdGUucGFyc2UobmV3IERhdGUoKSk7XHJcblxyXG4gICAgcmV0dXJuIHNhdmVJblRlbXBEQihldmVudC5kYXRhKS50aGVuKChqc29uU2F2ZWQpPT57XHJcblxyXG4gICAgICBzZWxmLnJlZ2lzdHJhdGlvbi5zeW5jLnJlZ2lzdGVyKCdzdWJtaXQtcmV2aWV3Jyk7XHJcbiAgICB9KTtcclxuICB9XHJcbn0pO1xyXG5cclxuc2VsZi5hZGRFdmVudExpc3RlbmVyKCdzeW5jJywgZXZlbnQgPT4ge1xyXG5cclxuICBpZighdGVtcERCUHJvbWlzZSkgcmV0dXJuO1xyXG5cclxuICBpZiAoZXZlbnQudGFnID09ICdzdWJtaXQtcmV2aWV3Jykge1xyXG4gICAgZXZlbnQud2FpdFVudGlsKHN5bmNXaXRoU2VydmVyKCkpO1xyXG4gIH1cclxuXHJcbiAgLy8gaWYgKGV2ZW50LnRhZyA9PSAnbWFyay1mYXZvcml0ZScpIHtcclxuICAvLyAgIGV2ZW50LndhaXRVbnRpbChtYXJrRmF2b3JpdGUocmVzdGF1cmFudF9pZCkpO1xyXG4gIC8vIH1cclxuICBcclxufSk7XHJcblxyXG5mdW5jdGlvbiBzZXJpYWxpemVPYmplY3QocGFyYW1zKSB7XHJcblxyXG4gIHJldHVybiBPYmplY3Qua2V5cyhwYXJhbXMpLm1hcChrZXkgPT4ga2V5ICsgJz0nICsgcGFyYW1zW2tleV0pLmpvaW4oJyYnKTtcclxufVxyXG5cclxuXHJcbiJdfQ==
