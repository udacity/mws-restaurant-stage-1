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
  })['catch'](function () {
    return caches.match(offlinePage);
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
  })['catch'](function () {
    return caches.match(offlinePage);
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
  })['catch'](function () {
    return caches.match(offlinePage);
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
  })['catch'](function () {
    return caches.match(offlinePage);
  });
}

/**
 * Searches the temp indexed db for reviews
 */
function searchTempDBForReviews(request) {

  var pathSlices = request.clone().url.split("restaurant_id=");
  var restaurantId = parseInt(pathSlices[pathSlices.length - 1]) || 0;

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

  if (event.request.method === 'GET') {

    if (event.request.url.endsWith('.jpg')) {
      event.respondWith(cacheImages(event.request));
      return;
    } else if (event.request.url.includes('reviews')) {

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

              if (typeof obj.formData !== 'undefined') {
                concatenatedResponse.push(obj.formData);
              } else {
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
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvaWRiL2xpYi9pZGIuanMiLCJDOi9Vc2Vycy92aWNraWUvRGVza3RvcC91ZGFjaXR5L213cy1yZXN0YXVyYW50LXN0YWdlLTEvc3JjL3N3LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7O21CQ3RUZ0IsS0FBSzs7Ozs7OztBQUtyQixJQUFJLFlBQVksR0FBRyw4QkFBOEIsQ0FB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a0IsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQztBQUNyRCxhQUFPO0tBQ1I7R0FDRjtDQUNGLENBQUMsQ0FBQzs7QUFFSCxJQUFJLENBQUMsZ0JBQWdCLENBQUMsU0FBUyxFQUFFLFVBQUEsS0FBSyxFQUFJOztBQUV4QyxNQUFHLEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBSSxLQUFLLGVBQWUsRUFBRTs7QUFFdEMsU0FBSyxDQUFDLElBQUksQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLElBQUksRUFBRSxDQUFDLENBQUM7O0FBRTlDLFdBQU8sWUFBWSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQyxJQUFJLENBQUMsVUFBQyxTQUFTLEVBQUc7O0FBRWhELFVBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxlQUFlLENBQUMsQ0FBQztLQUNsRCxDQUFDLENBQUM7R0FDSjtDQUNGLENBQUMsQ0FBQzs7QUFFSCxJQUFJLENBQUMsZ0JBQWdCLENBQUMsTUFBTSxFQUFFLFVBQUEsS0FBSyxFQUFJOztBQUVyQyxNQUFHLENBQUMsYUFBYSxFQUFFLE9BQU87O0FBRTFCLE1BQUksS0FBSyxDQUFDLEdBQUcsSUFBSSxlQUFlLEVBQUU7QUFDaEMsU0FBSyxDQUFDLFNBQVMsQ0FBQyxjQUFjLEVBQUUsQ0FBQyxDQUFDO0dBQ25DOzs7OztDQU1GLENBQUMsQ0FBQzs7QUFFSCxTQUFTLGVBQWUsQ0FBQyxNQUFNLEVBQUU7O0FBRS9CLFNBQU8sTUFBTSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxHQUFHLENBQUMsVUFBQSxHQUFHO1dBQUksR0FBRyxHQUFHLEdBQUcsR0FBRyxNQUFNLENBQUMsR0FBRyxDQUFDO0dBQUEsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztDQUMxRSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIndXNlIHN0cmljdCc7XG5cbihmdW5jdGlvbigpIHtcbiAgZnVuY3Rpb24gdG9BcnJheShhcnIpIHtcbiAgICByZXR1cm4gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJyKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHByb21pc2lmeVJlcXVlc3QocmVxdWVzdCkge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbihyZXNvbHZlLCByZWplY3QpIHtcbiAgICAgIHJlcXVlc3Qub25zdWNjZXNzID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHJlc29sdmUocmVxdWVzdC5yZXN1bHQpO1xuICAgICAgfTtcblxuICAgICAgcmVxdWVzdC5vbmVycm9yID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHJlamVjdChyZXF1ZXN0LmVycm9yKTtcbiAgICAgIH07XG4gICAgfSk7XG4gIH1cblxuICBmdW5jdGlvbiBwcm9taXNpZnlSZXF1ZXN0Q2FsbChvYmosIG1ldGhvZCwgYXJncykge1xuICAgIHZhciByZXF1ZXN0O1xuICAgIHZhciBwID0gbmV3IFByb21pc2UoZnVuY3Rpb24ocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICByZXF1ZXN0ID0gb2JqW21ldGhvZF0uYXBwbHkob2JqLCBhcmdzKTtcbiAgICAgIHByb21pc2lmeVJlcXVlc3QocmVxdWVzdCkudGhlbihyZXNvbHZlLCByZWplY3QpO1xuICAgIH0pO1xuXG4gICAgcC5yZXF1ZXN0ID0gcmVxdWVzdDtcbiAgICByZXR1cm4gcDtcbiAgfVxuICBcbiAgZnVuY3Rpb24gcHJvbWlzaWZ5Q3Vyc29yUmVxdWVzdENhbGwob2JqLCBtZXRob2QsIGFyZ3MpIHtcbiAgICB2YXIgcCA9IHByb21pc2lmeVJlcXVlc3RDYWxsKG9iaiwgbWV0aG9kLCBhcmdzKTtcbiAgICByZXR1cm4gcC50aGVuKGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICBpZiAoIXZhbHVlKSByZXR1cm47XG4gICAgICByZXR1cm4gbmV3IEN1cnNvcih2YWx1ZSwgcC5yZXF1ZXN0KTtcbiAgICB9KTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHByb3h5UHJvcGVydGllcyhQcm94eUNsYXNzLCB0YXJnZXRQcm9wLCBwcm9wZXJ0aWVzKSB7XG4gICAgcHJvcGVydGllcy5mb3JFYWNoKGZ1bmN0aW9uKHByb3ApIHtcbiAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShQcm94eUNsYXNzLnByb3RvdHlwZSwgcHJvcCwge1xuICAgICAgICBnZXQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgIHJldHVybiB0aGlzW3RhcmdldFByb3BdW3Byb3BdO1xuICAgICAgICB9LFxuICAgICAgICBzZXQ6IGZ1bmN0aW9uKHZhbCkge1xuICAgICAgICAgIHRoaXNbdGFyZ2V0UHJvcF1bcHJvcF0gPSB2YWw7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG5cbiAgZnVuY3Rpb24gcHJveHlSZXF1ZXN0TWV0aG9kcyhQcm94eUNsYXNzLCB0YXJnZXRQcm9wLCBDb25zdHJ1Y3RvciwgcHJvcGVydGllcykge1xuICAgIHByb3BlcnRpZXMuZm9yRWFjaChmdW5jdGlvbihwcm9wKSB7XG4gICAgICBpZiAoIShwcm9wIGluIENvbnN0cnVjdG9yLnByb3RvdHlwZSkpIHJldHVybjtcbiAgICAgIFByb3h5Q2xhc3MucHJvdG90eXBlW3Byb3BdID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiBwcm9taXNpZnlSZXF1ZXN0Q2FsbCh0aGlzW3RhcmdldFByb3BdLCBwcm9wLCBhcmd1bWVudHMpO1xuICAgICAgfTtcbiAgICB9KTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHByb3h5TWV0aG9kcyhQcm94eUNsYXNzLCB0YXJnZXRQcm9wLCBDb25zdHJ1Y3RvciwgcHJvcGVydGllcykge1xuICAgIHByb3BlcnRpZXMuZm9yRWFjaChmdW5jdGlvbihwcm9wKSB7XG4gICAgICBpZiAoIShwcm9wIGluIENvbnN0cnVjdG9yLnByb3RvdHlwZSkpIHJldHVybjtcbiAgICAgIFByb3h5Q2xhc3MucHJvdG90eXBlW3Byb3BdID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB0aGlzW3RhcmdldFByb3BdW3Byb3BdLmFwcGx5KHRoaXNbdGFyZ2V0UHJvcF0sIGFyZ3VtZW50cyk7XG4gICAgICB9O1xuICAgIH0pO1xuICB9XG5cbiAgZnVuY3Rpb24gcHJveHlDdXJzb3JSZXF1ZXN0TWV0aG9kcyhQcm94eUNsYXNzLCB0YXJnZXRQcm9wLCBDb25zdHJ1Y3RvciwgcHJvcGVydGllcykge1xuICAgIHByb3BlcnRpZXMuZm9yRWFjaChmdW5jdGlvbihwcm9wKSB7XG4gICAgICBpZiAoIShwcm9wIGluIENvbnN0cnVjdG9yLnByb3RvdHlwZSkpIHJldHVybjtcbiAgICAgIFByb3h5Q2xhc3MucHJvdG90eXBlW3Byb3BdID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiBwcm9taXNpZnlDdXJzb3JSZXF1ZXN0Q2FsbCh0aGlzW3RhcmdldFByb3BdLCBwcm9wLCBhcmd1bWVudHMpO1xuICAgICAgfTtcbiAgICB9KTtcbiAgfVxuXG4gIGZ1bmN0aW9uIEluZGV4KGluZGV4KSB7XG4gICAgdGhpcy5faW5kZXggPSBpbmRleDtcbiAgfVxuXG4gIHByb3h5UHJvcGVydGllcyhJbmRleCwgJ19pbmRleCcsIFtcbiAgICAnbmFtZScsXG4gICAgJ2tleVBhdGgnLFxuICAgICdtdWx0aUVudHJ5JyxcbiAgICAndW5pcXVlJ1xuICBdKTtcblxuICBwcm94eVJlcXVlc3RNZXRob2RzKEluZGV4LCAnX2luZGV4JywgSURCSW5kZXgsIFtcbiAgICAnZ2V0JyxcbiAgICAnZ2V0S2V5JyxcbiAgICAnZ2V0QWxsJyxcbiAgICAnZ2V0QWxsS2V5cycsXG4gICAgJ2NvdW50J1xuICBdKTtcblxuICBwcm94eUN1cnNvclJlcXVlc3RNZXRob2RzKEluZGV4LCAnX2luZGV4JywgSURCSW5kZXgsIFtcbiAgICAnb3BlbkN1cnNvcicsXG4gICAgJ29wZW5LZXlDdXJzb3InXG4gIF0pO1xuXG4gIGZ1bmN0aW9uIEN1cnNvcihjdXJzb3IsIHJlcXVlc3QpIHtcbiAgICB0aGlzLl9jdXJzb3IgPSBjdXJzb3I7XG4gICAgdGhpcy5fcmVxdWVzdCA9IHJlcXVlc3Q7XG4gIH1cblxuICBwcm94eVByb3BlcnRpZXMoQ3Vyc29yLCAnX2N1cnNvcicsIFtcbiAgICAnZGlyZWN0aW9uJyxcbiAgICAna2V5JyxcbiAgICAncHJpbWFyeUtleScsXG4gICAgJ3ZhbHVlJ1xuICBdKTtcblxuICBwcm94eVJlcXVlc3RNZXRob2RzKEN1cnNvciwgJ19jdXJzb3InLCBJREJDdXJzb3IsIFtcbiAgICAndXBkYXRlJyxcbiAgICAnZGVsZXRlJ1xuICBdKTtcblxuICAvLyBwcm94eSAnbmV4dCcgbWV0aG9kc1xuICBbJ2FkdmFuY2UnLCAnY29udGludWUnLCAnY29udGludWVQcmltYXJ5S2V5J10uZm9yRWFjaChmdW5jdGlvbihtZXRob2ROYW1lKSB7XG4gICAgaWYgKCEobWV0aG9kTmFtZSBpbiBJREJDdXJzb3IucHJvdG90eXBlKSkgcmV0dXJuO1xuICAgIEN1cnNvci5wcm90b3R5cGVbbWV0aG9kTmFtZV0gPSBmdW5jdGlvbigpIHtcbiAgICAgIHZhciBjdXJzb3IgPSB0aGlzO1xuICAgICAgdmFyIGFyZ3MgPSBhcmd1bWVudHM7XG4gICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCkudGhlbihmdW5jdGlvbigpIHtcbiAgICAgICAgY3Vyc29yLl9jdXJzb3JbbWV0aG9kTmFtZV0uYXBwbHkoY3Vyc29yLl9jdXJzb3IsIGFyZ3MpO1xuICAgICAgICByZXR1cm4gcHJvbWlzaWZ5UmVxdWVzdChjdXJzb3IuX3JlcXVlc3QpLnRoZW4oZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgICAgICBpZiAoIXZhbHVlKSByZXR1cm47XG4gICAgICAgICAgcmV0dXJuIG5ldyBDdXJzb3IodmFsdWUsIGN1cnNvci5fcmVxdWVzdCk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfTtcbiAgfSk7XG5cbiAgZnVuY3Rpb24gT2JqZWN0U3RvcmUoc3RvcmUpIHtcbiAgICB0aGlzLl9zdG9yZSA9IHN0b3JlO1xuICB9XG5cbiAgT2JqZWN0U3RvcmUucHJvdG90eXBlLmNyZWF0ZUluZGV4ID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIG5ldyBJbmRleCh0aGlzLl9zdG9yZS5jcmVhdGVJbmRleC5hcHBseSh0aGlzLl9zdG9yZSwgYXJndW1lbnRzKSk7XG4gIH07XG5cbiAgT2JqZWN0U3RvcmUucHJvdG90eXBlLmluZGV4ID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIG5ldyBJbmRleCh0aGlzLl9zdG9yZS5pbmRleC5hcHBseSh0aGlzLl9zdG9yZSwgYXJndW1lbnRzKSk7XG4gIH07XG5cbiAgcHJveHlQcm9wZXJ0aWVzKE9iamVjdFN0b3JlLCAnX3N0b3JlJywgW1xuICAgICduYW1lJyxcbiAgICAna2V5UGF0aCcsXG4gICAgJ2luZGV4TmFtZXMnLFxuICAgICdhdXRvSW5jcmVtZW50J1xuICBdKTtcblxuICBwcm94eVJlcXVlc3RNZXRob2RzKE9iamVjdFN0b3JlLCAnX3N0b3JlJywgSURCT2JqZWN0U3RvcmUsIFtcbiAgICAncHV0JyxcbiAgICAnYWRkJyxcbiAgICAnZGVsZXRlJyxcbiAgICAnY2xlYXInLFxuICAgICdnZXQnLFxuICAgICdnZXRBbGwnLFxuICAgICdnZXRLZXknLFxuICAgICdnZXRBbGxLZXlzJyxcbiAgICAnY291bnQnXG4gIF0pO1xuXG4gIHByb3h5Q3Vyc29yUmVxdWVzdE1ldGhvZHMoT2JqZWN0U3RvcmUsICdfc3RvcmUnLCBJREJPYmplY3RTdG9yZSwgW1xuICAgICdvcGVuQ3Vyc29yJyxcbiAgICAnb3BlbktleUN1cnNvcidcbiAgXSk7XG5cbiAgcHJveHlNZXRob2RzKE9iamVjdFN0b3JlLCAnX3N0b3JlJywgSURCT2JqZWN0U3RvcmUsIFtcbiAgICAnZGVsZXRlSW5kZXgnXG4gIF0pO1xuXG4gIGZ1bmN0aW9uIFRyYW5zYWN0aW9uKGlkYlRyYW5zYWN0aW9uKSB7XG4gICAgdGhpcy5fdHggPSBpZGJUcmFuc2FjdGlvbjtcbiAgICB0aGlzLmNvbXBsZXRlID0gbmV3IFByb21pc2UoZnVuY3Rpb24ocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICBpZGJUcmFuc2FjdGlvbi5vbmNvbXBsZXRlID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHJlc29sdmUoKTtcbiAgICAgIH07XG4gICAgICBpZGJUcmFuc2FjdGlvbi5vbmVycm9yID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHJlamVjdChpZGJUcmFuc2FjdGlvbi5lcnJvcik7XG4gICAgICB9O1xuICAgICAgaWRiVHJhbnNhY3Rpb24ub25hYm9ydCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICByZWplY3QoaWRiVHJhbnNhY3Rpb24uZXJyb3IpO1xuICAgICAgfTtcbiAgICB9KTtcbiAgfVxuXG4gIFRyYW5zYWN0aW9uLnByb3RvdHlwZS5vYmplY3RTdG9yZSA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBuZXcgT2JqZWN0U3RvcmUodGhpcy5fdHgub2JqZWN0U3RvcmUuYXBwbHkodGhpcy5fdHgsIGFyZ3VtZW50cykpO1xuICB9O1xuXG4gIHByb3h5UHJvcGVydGllcyhUcmFuc2FjdGlvbiwgJ190eCcsIFtcbiAgICAnb2JqZWN0U3RvcmVOYW1lcycsXG4gICAgJ21vZGUnXG4gIF0pO1xuXG4gIHByb3h5TWV0aG9kcyhUcmFuc2FjdGlvbiwgJ190eCcsIElEQlRyYW5zYWN0aW9uLCBbXG4gICAgJ2Fib3J0J1xuICBdKTtcblxuICBmdW5jdGlvbiBVcGdyYWRlREIoZGIsIG9sZFZlcnNpb24sIHRyYW5zYWN0aW9uKSB7XG4gICAgdGhpcy5fZGIgPSBkYjtcbiAgICB0aGlzLm9sZFZlcnNpb24gPSBvbGRWZXJzaW9uO1xuICAgIHRoaXMudHJhbnNhY3Rpb24gPSBuZXcgVHJhbnNhY3Rpb24odHJhbnNhY3Rpb24pO1xuICB9XG5cbiAgVXBncmFkZURCLnByb3RvdHlwZS5jcmVhdGVPYmplY3RTdG9yZSA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBuZXcgT2JqZWN0U3RvcmUodGhpcy5fZGIuY3JlYXRlT2JqZWN0U3RvcmUuYXBwbHkodGhpcy5fZGIsIGFyZ3VtZW50cykpO1xuICB9O1xuXG4gIHByb3h5UHJvcGVydGllcyhVcGdyYWRlREIsICdfZGInLCBbXG4gICAgJ25hbWUnLFxuICAgICd2ZXJzaW9uJyxcbiAgICAnb2JqZWN0U3RvcmVOYW1lcydcbiAgXSk7XG5cbiAgcHJveHlNZXRob2RzKFVwZ3JhZGVEQiwgJ19kYicsIElEQkRhdGFiYXNlLCBbXG4gICAgJ2RlbGV0ZU9iamVjdFN0b3JlJyxcbiAgICAnY2xvc2UnXG4gIF0pO1xuXG4gIGZ1bmN0aW9uIERCKGRiKSB7XG4gICAgdGhpcy5fZGIgPSBkYjtcbiAgfVxuXG4gIERCLnByb3RvdHlwZS50cmFuc2FjdGlvbiA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBuZXcgVHJhbnNhY3Rpb24odGhpcy5fZGIudHJhbnNhY3Rpb24uYXBwbHkodGhpcy5fZGIsIGFyZ3VtZW50cykpO1xuICB9O1xuXG4gIHByb3h5UHJvcGVydGllcyhEQiwgJ19kYicsIFtcbiAgICAnbmFtZScsXG4gICAgJ3ZlcnNpb24nLFxuICAgICdvYmplY3RTdG9yZU5hbWVzJ1xuICBdKTtcblxuICBwcm94eU1ldGhvZHMoREIsICdfZGInLCBJREJEYXRhYmFzZSwgW1xuICAgICdjbG9zZSdcbiAgXSk7XG5cbiAgLy8gQWRkIGN1cnNvciBpdGVyYXRvcnNcbiAgLy8gVE9ETzogcmVtb3ZlIHRoaXMgb25jZSBicm93c2VycyBkbyB0aGUgcmlnaHQgdGhpbmcgd2l0aCBwcm9taXNlc1xuICBbJ29wZW5DdXJzb3InLCAnb3BlbktleUN1cnNvciddLmZvckVhY2goZnVuY3Rpb24oZnVuY05hbWUpIHtcbiAgICBbT2JqZWN0U3RvcmUsIEluZGV4XS5mb3JFYWNoKGZ1bmN0aW9uKENvbnN0cnVjdG9yKSB7XG4gICAgICBDb25zdHJ1Y3Rvci5wcm90b3R5cGVbZnVuY05hbWUucmVwbGFjZSgnb3BlbicsICdpdGVyYXRlJyldID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBhcmdzID0gdG9BcnJheShhcmd1bWVudHMpO1xuICAgICAgICB2YXIgY2FsbGJhY2sgPSBhcmdzW2FyZ3MubGVuZ3RoIC0gMV07XG4gICAgICAgIHZhciBuYXRpdmVPYmplY3QgPSB0aGlzLl9zdG9yZSB8fCB0aGlzLl9pbmRleDtcbiAgICAgICAgdmFyIHJlcXVlc3QgPSBuYXRpdmVPYmplY3RbZnVuY05hbWVdLmFwcGx5KG5hdGl2ZU9iamVjdCwgYXJncy5zbGljZSgwLCAtMSkpO1xuICAgICAgICByZXF1ZXN0Lm9uc3VjY2VzcyA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgIGNhbGxiYWNrKHJlcXVlc3QucmVzdWx0KTtcbiAgICAgICAgfTtcbiAgICAgIH07XG4gICAgfSk7XG4gIH0pO1xuXG4gIC8vIHBvbHlmaWxsIGdldEFsbFxuICBbSW5kZXgsIE9iamVjdFN0b3JlXS5mb3JFYWNoKGZ1bmN0aW9uKENvbnN0cnVjdG9yKSB7XG4gICAgaWYgKENvbnN0cnVjdG9yLnByb3RvdHlwZS5nZXRBbGwpIHJldHVybjtcbiAgICBDb25zdHJ1Y3Rvci5wcm90b3R5cGUuZ2V0QWxsID0gZnVuY3Rpb24ocXVlcnksIGNvdW50KSB7XG4gICAgICB2YXIgaW5zdGFuY2UgPSB0aGlzO1xuICAgICAgdmFyIGl0ZW1zID0gW107XG5cbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbihyZXNvbHZlKSB7XG4gICAgICAgIGluc3RhbmNlLml0ZXJhdGVDdXJzb3IocXVlcnksIGZ1bmN0aW9uKGN1cnNvcikge1xuICAgICAgICAgIGlmICghY3Vyc29yKSB7XG4gICAgICAgICAgICByZXNvbHZlKGl0ZW1zKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9XG4gICAgICAgICAgaXRlbXMucHVzaChjdXJzb3IudmFsdWUpO1xuXG4gICAgICAgICAgaWYgKGNvdW50ICE9PSB1bmRlZmluZWQgJiYgaXRlbXMubGVuZ3RoID09IGNvdW50KSB7XG4gICAgICAgICAgICByZXNvbHZlKGl0ZW1zKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9XG4gICAgICAgICAgY3Vyc29yLmNvbnRpbnVlKCk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfTtcbiAgfSk7XG5cbiAgdmFyIGV4cCA9IHtcbiAgICBvcGVuOiBmdW5jdGlvbihuYW1lLCB2ZXJzaW9uLCB1cGdyYWRlQ2FsbGJhY2spIHtcbiAgICAgIHZhciBwID0gcHJvbWlzaWZ5UmVxdWVzdENhbGwoaW5kZXhlZERCLCAnb3BlbicsIFtuYW1lLCB2ZXJzaW9uXSk7XG4gICAgICB2YXIgcmVxdWVzdCA9IHAucmVxdWVzdDtcblxuICAgICAgcmVxdWVzdC5vbnVwZ3JhZGVuZWVkZWQgPSBmdW5jdGlvbihldmVudCkge1xuICAgICAgICBpZiAodXBncmFkZUNhbGxiYWNrKSB7XG4gICAgICAgICAgdXBncmFkZUNhbGxiYWNrKG5ldyBVcGdyYWRlREIocmVxdWVzdC5yZXN1bHQsIGV2ZW50Lm9sZFZlcnNpb24sIHJlcXVlc3QudHJhbnNhY3Rpb24pKTtcbiAgICAgICAgfVxuICAgICAgfTtcblxuICAgICAgcmV0dXJuIHAudGhlbihmdW5jdGlvbihkYikge1xuICAgICAgICByZXR1cm4gbmV3IERCKGRiKTtcbiAgICAgIH0pO1xuICAgIH0sXG4gICAgZGVsZXRlOiBmdW5jdGlvbihuYW1lKSB7XG4gICAgICByZXR1cm4gcHJvbWlzaWZ5UmVxdWVzdENhbGwoaW5kZXhlZERCLCAnZGVsZXRlRGF0YWJhc2UnLCBbbmFtZV0pO1xuICAgIH1cbiAgfTtcblxuICBpZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICBtb2R1bGUuZXhwb3J0cyA9IGV4cDtcbiAgfVxuICBlbHNlIHtcbiAgICBzZWxmLmlkYiA9IGV4cDtcbiAgfVxufSgpKTtcbiIsImltcG9ydCBpZGIgZnJvbSAnaWRiJztcclxuXHJcbi8qKiBcclxuICogU2VwYXJhdGUgY2FjaGVzIGZvciB0aGUganBnIGltYWdlcyBhbmQgYWxsIHRoZSBvdGhlciBjb250ZW50IFxyXG4gKi9cclxudmFyIENBQ0hFX1NUQVRJQyA9ICdyZXN0YXVyYW50LXJldmlld3Mtc3RhdGljLXYxJztcclxudmFyIENBQ0hFX0lNQUdFUyA9ICdyZXN0YXVyYW50LXJldmlld3MtaW1hZ2VzLXYxJztcclxuY29uc3Qgb2ZmbGluZVBhZ2UgPSAnLi80MDQuaHRtbCc7XHJcbnZhciBkYlByb21pc2U7XHJcbnZhciByZXZpZXdzRGJQcm9taXNlO1xyXG52YXIgdGVtcERCUHJvbWlzZTtcclxudmFyIHJldmlld0Zvcm1EYXRhO1xyXG5cclxuXHJcbi8qKiBcclxuICogRmV0Y2ggYW5kIGNhY2hlIGltYWdlIHJlcXVlc3QgXHJcbiAqL1xyXG5mdW5jdGlvbiBjYWNoZUltYWdlcyhyZXF1ZXN0KSB7XHJcbiAgXHJcbiAgLy8gUmVtb3ZlIHNpemUtcmVsYXRlZCBpbmZvIGZyb20gaW1hZ2UgbmFtZSBcclxuICB2YXIgdXJsVG9GZXRjaCA9IHJlcXVlc3QudXJsLnNsaWNlKDAsIHJlcXVlc3QudXJsLmluZGV4T2YoJy0nKSk7XHJcbiAgIFxyXG4gIHJldHVybiBjYWNoZXMub3BlbihDQUNIRV9JTUFHRVMpLnRoZW4oY2FjaGUgPT4geyAgXHJcbiAgICByZXR1cm4gY2FjaGUubWF0Y2godXJsVG9GZXRjaCkudGhlbihyZXNwb25zZSA9PiB7XHJcbiAgXHJcbiAgICAgIC8vIENhY2hlIGhpdCAtIHJldHVybiByZXNwb25zZSBlbHNlIGZldGNoXHJcbiAgICAgIC8vIFdlIGNsb25lIHRoZSByZXF1ZXN0IGJlY2F1c2UgaXQncyBhIHN0cmVhbSBhbmQgY2FuIGJlIGNvbnN1bWVkIG9ubHkgb25jZVxyXG4gICAgICB2YXIgbmV0d29ya0ZldGNoID0gZmV0Y2gocmVxdWVzdC5jbG9uZSgpKS50aGVuKChuZXR3b3JrUmVzcG9uc2UpID0+IHtcclxuICAgICAgICAvLyBDaGVjayBpZiB3ZSByZWNlaXZlZCBhbiBpbnZhbGlkIHJlc3BvbnNlXHJcbiAgICAgICAgaWYobmV0d29ya1Jlc3BvbnNlLnN0YXR1cyA9PSA0MDQpIHJldHVybjtcclxuXHJcbiAgICAgICAgLy8gV2UgY2xvbmUgdGhlIHJlc3BvbnNlIGJlY2F1c2UgaXQncyBhIHN0cmVhbSBhbmQgY2FuIGJlIGNvbnN1bWVkIG9ubHkgb25jZVxyXG4gICAgICAgIGNhY2hlLnB1dCh1cmxUb0ZldGNoLCBuZXR3b3JrUmVzcG9uc2UuY2xvbmUoKSk7XHJcblxyXG4gICAgICAgIHJldHVybiBuZXR3b3JrUmVzcG9uc2U7XHJcblxyXG4gICAgICB9LCAocmVqZWN0ZWQpID0+IHtcclxuICAgICAgICByZXR1cm4gcmVzcG9uc2U7XHJcbiAgICAgIH0pLmNhdGNoKCgpID0+IHtcclxuICAgICAgICByZXR1cm4gcmVzcG9uc2U7XHJcbiAgICAgIH0pO1xyXG5cclxuICAgICAgLy8gLy9pZiBhY2Nlc3MgdG8gbmV0d29yayBpcyBnb29kIHdlIHdhbnQgdGhlIGJlc3QgcXVhbGl0eSBpbWFnZVxyXG4gICAgICByZXR1cm4gbmV0d29ya0ZldGNoO1xyXG5cclxuICAgIH0pLmNhdGNoKCgpID0+IHsgXHJcblxyXG4gICAgICByZXR1cm4gZmV0Y2gocmVxdWVzdC5jbG9uZSgpKS50aGVuKChuZXR3b3JrUmVzcG9uc2UpID0+IHtcclxuICAgICAgICAvLyBDaGVjayBpZiB3ZSByZWNlaXZlZCBhbiBpbnZhbGlkIHJlc3BvbnNlXHJcbiAgICAgICAgaWYobmV0d29ya1Jlc3BvbnNlLnN0YXR1cyA9PSA0MDQpIHJldHVybjtcclxuXHJcbiAgICAgICAgLy8gV2UgY2xvbmUgdGhlIHJlc3BvbnNlIGJlY2F1c2UgaXQncyBhIHN0cmVhbSBhbmQgY2FuIGJlIGNvbnN1bWVkIG9ubHkgb25jZVxyXG4gICAgICAgIGNhY2hlLnB1dCh1cmxUb0ZldGNoLCBuZXR3b3JrUmVzcG9uc2UuY2xvbmUoKSk7XHJcblxyXG4gICAgICAgIHJldHVybiBuZXR3b3JrUmVzcG9uc2U7XHJcblxyXG4gICAgICB9LCAocmVqZWN0ZWQpID0+IHtcclxuICAgICAgICByZXR1cm4gY2FjaGVzLm1hdGNoKG9mZmxpbmVQYWdlKTsgXHJcbiAgICAgIH0pLmNhdGNoKCgpID0+IHtcclxuICAgICAgICByZXR1cm4gY2FjaGVzLm1hdGNoKG9mZmxpbmVQYWdlKTsgXHJcbiAgICAgIH0pO1xyXG4gICAgfSlcclxuICB9KTtcclxufVxyXG5cclxuLyoqIFxyXG4gKiBGZXRjaCBhbmQgY2FjaGUgc3RhdGljIGNvbnRlbnQgYW5kIGdvb2dsZSBtYXAgcmVsYXRlZCBjb250ZW50IFxyXG4gKi9cclxuIGZ1bmN0aW9uIGNhY2hlU3RhdGljQ29udGVudChyZXF1ZXN0KSB7XHJcbiAgICBcclxuICByZXR1cm4gY2FjaGVzLm9wZW4oQ0FDSEVfU1RBVElDKS50aGVuKGNhY2hlID0+IHtcclxuICAgIHJldHVybiBjYWNoZS5tYXRjaChyZXF1ZXN0KS50aGVuKHJlc3BvbnNlID0+IHtcclxuICAgIFxyXG4gICAgICAgIC8vIENhY2hlIGhpdCAtIHJldHVybiByZXNwb25zZSBlbHNlIGZldGNoXHJcbiAgICAgICAgLy8gV2UgY2xvbmUgdGhlIHJlcXVlc3QgYmVjYXVzZSBpdCdzIGEgc3RyZWFtIGFuZCBjYW4gYmUgY29uc3VtZWQgb25seSBvbmNlXHJcbiAgICAgIHJldHVybiByZXNwb25zZSB8fCBmZXRjaChyZXF1ZXN0LmNsb25lKCkpLnRoZW4obmV0d29ya1Jlc3BvbnNlID0+IHtcclxuICAgICAgICAvLyBDaGVjayBpZiB3ZSByZWNlaXZlZCBhbiBpbnZhbGlkIHJlc3BvbnNlXHJcbiAgICAgICAgaWYobmV0d29ya1Jlc3BvbnNlLnN0YXR1cyA9PSA0MDQpIHJldHVybjtcclxuICAgIFxyXG4gICAgICAgIC8vIFdlIGNsb25lIHRoZSByZXNwb25zZSBiZWNhdXNlIGl0J3MgYSBzdHJlYW0gYW5kIGNhbiBiZSBjb25zdW1lZCBvbmx5IG9uY2VcclxuICAgICAgICBjYWNoZS5wdXQocmVxdWVzdCwgbmV0d29ya1Jlc3BvbnNlLmNsb25lKCkpO1xyXG4gICAgICAgIHJldHVybiBuZXR3b3JrUmVzcG9uc2U7XHJcblxyXG4gICAgICB9KS5jYXRjaCgoKSA9PiB7IFxyXG4gICAgICAgIHJldHVybiBjYWNoZXMubWF0Y2gob2ZmbGluZVBhZ2UpOyBcclxuICAgICAgfSlcclxuICAgIH0pO1xyXG4gIH0pO1xyXG59XHJcblxyXG4vKipcclxuICogRmV0Y2hlcyBmcm9tIG5ldHdvcmsgYW5kIHB1dHMgaW4gaW5kZXhlZCBkYiBsYXRlc3QgZGF0YVxyXG4gKi9cclxuZnVuY3Rpb24gZ2V0TGF0ZXN0RGF0YShyZXF1ZXN0KSB7XHJcblxyXG4gIHZhciBwYXRoU2xpY2VzID0gcmVxdWVzdC51cmwuc3BsaXQoXCIvXCIpO1xyXG4gIHZhciByZXN0YXVyYW50SWQgPSBwYXJzZUludChwYXRoU2xpY2VzW3BhdGhTbGljZXMubGVuZ3RoIC0gMV0pIHx8IDA7XHJcblxyXG4gIHJldHVybiBmZXRjaChyZXF1ZXN0LmNsb25lKCkpLnRoZW4obmV0d29ya1Jlc3BvbnNlID0+IHtcclxuXHJcbiAgICBpZihuZXR3b3JrUmVzcG9uc2Uuc3RhdHVzID09IDQwNCkgcmV0dXJuO1xyXG5cclxuICAgIG5ldHdvcmtSZXNwb25zZS5jbG9uZSgpLmpzb24oKS50aGVuKGpzb24gPT4ge1xyXG5cclxuICAgICAgaWYoIWRiUHJvbWlzZSkgcmV0dXJuO1xyXG5cclxuICAgICAgZGJQcm9taXNlLnRoZW4oZGIgPT4ge1xyXG4gICAgICAgICAgICBcclxuICAgICAgICBpZighZGIpIHJldHVybjtcclxuXHJcbiAgICAgICAgdmFyIHR4ID0gZGIudHJhbnNhY3Rpb24oJ3Jlc3RhdXJhbnRzJywgJ3JlYWR3cml0ZScpO1xyXG4gICAgICAgIHZhciBzdG9yZSA9IHR4Lm9iamVjdFN0b3JlKCdyZXN0YXVyYW50cycpO1xyXG5cclxuICAgICAgICBpZighcmVzdGF1cmFudElkKXsgLy8gaWYgd2UgcmVmZXIgdG8gYWxsIGRhdGFcclxuXHJcbiAgICAgICAgICBqc29uLmZvckVhY2gocmVzdGF1cmFudCA9PiB7XHJcbiAgICAgICAgICAgIHN0b3JlLnB1dChyZXN0YXVyYW50LCByZXN0YXVyYW50LmlkKTtcclxuICAgICAgICAgIH0pO1xyXG4gICAgICAgIFxyXG4gICAgICAgIH0gZWxzZSB7IC8vIGlmIHdlIHJlZmVyIHRvIHBlciByZXN0YXVyYW50IGRhdGEgXHJcbiAgICAgICAgICAgc3RvcmUucHV0KGpzb24sIGpzb24uaWQpO1xyXG4gICAgICAgIH1cclxuICAgICAgfSk7XHJcbiAgICB9KTtcclxuXHJcbiAgICByZXR1cm4gbmV0d29ya1Jlc3BvbnNlO1xyXG5cclxuICB9KS5jYXRjaCgoKSA9PiB7XHJcbiAgICByZXR1cm4gY2FjaGVzLm1hdGNoKG9mZmxpbmVQYWdlKTsgXHJcbiAgfSk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBTZWFyY2hlcyB0aGUgaW5kZXhlZCBkYiBmb3IgZGF0YSBhbmQgaWYgbm90aGluZyBmb3VuZCB0cmllcyB0aGUgbmV3b3JrXHJcbiAqL1xyXG5mdW5jdGlvbiBzZWFyY2hJbklEQihyZXF1ZXN0KSB7XHJcblxyXG4gIHZhciBwYXRoU2xpY2VzID0gcmVxdWVzdC5jbG9uZSgpLnVybC5zcGxpdChcIi9cIik7XHJcbiAgdmFyIHJlc3RhdXJhbnRJZCA9IHBhcnNlSW50KHBhdGhTbGljZXNbcGF0aFNsaWNlcy5sZW5ndGggLSAxXSkgfHwgMDtcclxuICB2YXIgZGF0YVByb21pc2U7XHJcblxyXG4gIC8vIGlmIG5vdCBpbmRleGVkIGRiIGZ1bmN0aW9uYWxpdHlcclxuICBpZighZGJQcm9taXNlKSByZXR1cm4gZ2V0TGF0ZXN0RGF0YShyZXF1ZXN0LmNsb25lKCkpO1xyXG5cclxuICByZXR1cm4gZGJQcm9taXNlLnRoZW4oZGIgPT4ge1xyXG4gICAgXHJcbiAgICBpZighZGIpIHJldHVybiBnZXRMYXRlc3REYXRhKHJlcXVlc3QuY2xvbmUoKSk7XHJcblxyXG4gICAgdmFyIHN0b3JlID0gZGIudHJhbnNhY3Rpb24oJ3Jlc3RhdXJhbnRzJykub2JqZWN0U3RvcmUoJ3Jlc3RhdXJhbnRzJyk7XHJcblxyXG4gICAgaWYoIXJlc3RhdXJhbnRJZCkgeyAvLyBpZiBhbGwgZGF0YSBhcmUgcmVxdWVzdGVkXHJcbiAgICAgIGRhdGFQcm9taXNlID0gc3RvcmUuZ2V0QWxsKCk7XHJcbiAgICB9IGVsc2UgeyAvLyBpZiBwZXIgcmVzdGF1cmFudCBkYXRhIGFyZSByZXF1ZXN0ZWRcclxuICAgICAgZGF0YVByb21pc2UgPSBzdG9yZS5nZXQocmVzdGF1cmFudElkKTtcclxuICAgIH1cclxuICAgIFxyXG4gICAgaWYoIWRhdGFQcm9taXNlKSByZXR1cm4gZ2V0TGF0ZXN0RGF0YShyZXF1ZXN0LmNsb25lKCkpO1xyXG5cclxuICAgIHJldHVybiBkYXRhUHJvbWlzZS50aGVuKGRhdGEgPT4geyAgXHJcblxyXG4gICAgICB2YXIgbmV0d29ya0ZldGNoID0gZ2V0TGF0ZXN0RGF0YShyZXF1ZXN0LmNsb25lKCkpO1xyXG5cclxuICAgICAgLy8gaWYgZGF0YSBmb3VuZCBpbiBpbmRleGVkIGRiIHJldHVybiB0aGVtXHJcbiAgICAgIGlmKEpTT04uc3RyaW5naWZ5KGRhdGEpICE9PSBKU09OLnN0cmluZ2lmeShbXSkgJiYgZGF0YSAhPT0gdW5kZWZpbmVkKSAgeyBcclxuXHJcbiAgICAgICAgY29uc29sZS5sb2coJ0ZvdW5kIGNhY2hlZCcpO1xyXG4gICAgICAgIHJldHVybiBuZXcgUmVzcG9uc2UoSlNPTi5zdHJpbmdpZnkoZGF0YSkpOyBcclxuICAgICAgfVxyXG5cclxuICAgICAgcmV0dXJuIG5ldHdvcmtGZXRjaDtcclxuICAgIH0pO1xyXG4gIH0pLmNhdGNoKCgpID0+IHtcclxuICAgIHJldHVybiBjYWNoZXMubWF0Y2gob2ZmbGluZVBhZ2UpOyBcclxuICB9KTtcclxufVxyXG5cclxuLyoqXHJcbiAqIEZldGNoZXMgZnJvbSBuZXR3b3JrIGFuZCBwdXRzIGluIGluZGV4ZWQgZGIgdGhlIGxhdGVzdCByZXZpZXdzXHJcbiAqL1xyXG5mdW5jdGlvbiBnZXRMYXRlc3RSZXZpZXdzKHJlcXVlc3QpIHtcclxuICBcclxuICByZXR1cm4gZmV0Y2gocmVxdWVzdC5jbG9uZSgpKS50aGVuKG5ldHdvcmtSZXNwb25zZSA9PiB7XHJcblxyXG4gICAgaWYobmV0d29ya1Jlc3BvbnNlLnN0YXR1cyA9PSA0MDQpIHJldHVybjtcclxuXHJcbiAgICBuZXR3b3JrUmVzcG9uc2UuY2xvbmUoKS5qc29uKCkudGhlbihqc29uID0+IHtcclxuXHJcbiAgICAgIGlmKCFyZXZpZXdzRGJQcm9taXNlKSByZXR1cm47XHJcblxyXG4gICAgICByZXZpZXdzRGJQcm9taXNlLnRoZW4oZGIgPT4ge1xyXG4gICAgICAgICAgICBcclxuICAgICAgICBpZighZGIpIHJldHVybjtcclxuXHJcbiAgICAgICAgdmFyIHR4ID0gZGIudHJhbnNhY3Rpb24oJ3Jlc3RhdXJhbnQtcmV2aWV3cycsICdyZWFkd3JpdGUnKTtcclxuICAgICAgICB2YXIgc3RvcmUgPSB0eC5vYmplY3RTdG9yZSgncmVzdGF1cmFudC1yZXZpZXdzJyk7XHJcblxyXG4gICAgICAgIGpzb24uZm9yRWFjaChyZXZpZXcgPT4ge1xyXG4gICAgICAgICAgcmV2aWV3LnJlc3RhdXJhbnRfaWQgPSAgcGFyc2VJbnQocmV2aWV3LnJlc3RhdXJhbnRfaWQpIHx8IDA7XHJcbiAgICAgICAgICBzdG9yZS5wdXQocmV2aWV3LCByZXZpZXcuaWQpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICB9KTtcclxuICAgIH0pO1xyXG5cclxuICAgIHJldHVybiBuZXR3b3JrUmVzcG9uc2U7XHJcblxyXG4gIH0pLmNhdGNoKCgpID0+IHtcclxuICAgIHJldHVybiBjYWNoZXMubWF0Y2gob2ZmbGluZVBhZ2UpOyBcclxuICB9KTtcclxufVxyXG5cclxuLyoqXHJcbiAqIFNlYXJjaGVzIHRoZSBpbmRleGVkIGRiIGZvciByZXZpZXdzIGFuZCBpZiBub3RoaW5nIGZvdW5kIHRyaWVzIHRoZSBuZXdvcmtcclxuICovXHJcbmZ1bmN0aW9uIHNlYXJjaElEQkZvclJldmlld3MocmVxdWVzdCkge1xyXG5cclxuICB2YXIgcGF0aFNsaWNlcyA9IHJlcXVlc3QuY2xvbmUoKS51cmwuc3BsaXQoXCJyZXN0YXVyYW50X2lkPVwiKTtcclxuICB2YXIgcmVzdGF1cmFudElkID0gcGFyc2VJbnQocGF0aFNsaWNlc1twYXRoU2xpY2VzLmxlbmd0aCAtIDFdKSB8fCAwO1xyXG5cclxuICAvLyBpZiBub3QgaW5kZXhlZCBkYiBmdW5jdGlvbmFsaXR5XHJcbiAgaWYoIXJldmlld3NEYlByb21pc2UpIHJldHVybiBnZXRMYXRlc3RSZXZpZXdzKHJlcXVlc3QuY2xvbmUoKSk7XHJcblxyXG4gIHJldHVybiByZXZpZXdzRGJQcm9taXNlLnRoZW4oZGIgPT4ge1xyXG4gICAgXHJcbiAgICBpZighZGIpIHJldHVybiBnZXRMYXRlc3RSZXZpZXdzKHJlcXVlc3QuY2xvbmUoKSk7XHJcblxyXG4gICAgdmFyIHN0b3JlID0gZGIudHJhbnNhY3Rpb24oJ3Jlc3RhdXJhbnQtcmV2aWV3cycpLm9iamVjdFN0b3JlKCdyZXN0YXVyYW50LXJldmlld3MnKTtcclxuICAgIHZhciBpbmRleCA9IHN0b3JlLmluZGV4KCdieS1yZXN0YXVyYW50Jyk7XHJcbiAgXHJcbiAgICByZXR1cm4gaW5kZXguZ2V0QWxsKHJlc3RhdXJhbnRJZCkudGhlbihkYXRhID0+IHsgIFxyXG5cclxuICAgICAgdmFyIG5ldHdvcmtGZXRjaCA9IGdldExhdGVzdFJldmlld3MocmVxdWVzdC5jbG9uZSgpKTtcclxuXHJcbiAgICAgIC8vIGlmIGRhdGEgZm91bmQgaW4gaW5kZXhlZCBkYiByZXR1cm4gdGhlbVxyXG4gICAgICBpZihKU09OLnN0cmluZ2lmeShkYXRhKSAhPT0gSlNPTi5zdHJpbmdpZnkoW10pICYmIGRhdGEgIT09IHVuZGVmaW5lZCkgIHsgXHJcblxyXG4gICAgICAgIGNvbnNvbGUubG9nKCdGb3VuZCBjYWNoZWQnKTtcclxuICAgICAgICByZXR1cm4gbmV3IFJlc3BvbnNlKEpTT04uc3RyaW5naWZ5KGRhdGEpKTsgXHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHJldHVybiBuZXR3b3JrRmV0Y2g7XHJcbiAgICB9KTtcclxuXHJcbiAgfSkuY2F0Y2goKCkgPT4ge1xyXG4gICAgcmV0dXJuIGNhY2hlcy5tYXRjaChvZmZsaW5lUGFnZSk7IFxyXG4gIH0pO1xyXG59XHJcblxyXG5cclxuLyoqXHJcbiAqIFNlYXJjaGVzIHRoZSB0ZW1wIGluZGV4ZWQgZGIgZm9yIHJldmlld3NcclxuICovXHJcbmZ1bmN0aW9uIHNlYXJjaFRlbXBEQkZvclJldmlld3MocmVxdWVzdCkge1xyXG5cclxuICB2YXIgcGF0aFNsaWNlcyA9IHJlcXVlc3QuY2xvbmUoKS51cmwuc3BsaXQoXCJyZXN0YXVyYW50X2lkPVwiKTtcclxuICB2YXIgcmVzdGF1cmFudElkID0gcGFyc2VJbnQocGF0aFNsaWNlc1twYXRoU2xpY2VzLmxlbmd0aCAtIDFdKSB8fCAwO1xyXG5cclxuICBpZighdGVtcERCUHJvbWlzZSkgcmV0dXJuO1xyXG5cclxuICByZXR1cm4gdGVtcERCUHJvbWlzZS50aGVuKGRiID0+IHtcclxuICAgIFxyXG4gICAgaWYoIWRiKSByZXR1cm47XHJcblxyXG4gICAgdmFyIHN0b3JlID0gZGIudHJhbnNhY3Rpb24oJ3Jlc3RhdXJhbnQtcmV2aWV3cy10ZW1wJykub2JqZWN0U3RvcmUoJ3Jlc3RhdXJhbnQtcmV2aWV3cy10ZW1wJyk7XHJcbiAgICB2YXIgaW5kZXggPSBzdG9yZS5pbmRleCgnYnktdHlwZScpO1xyXG4gIFxyXG4gICAgcmV0dXJuIGluZGV4LmdldEFsbCgnY3JlYXRlLXJldmlldycpLnRoZW4oZGF0YSA9PiB7ICBcclxuXHJcbiAgICAgIC8vIGlmIGRhdGEgZm91bmQgaW4gaW5kZXhlZCBkYiByZXR1cm4gdGhlbVxyXG4gICAgICBpZihKU09OLnN0cmluZ2lmeShkYXRhKSAhPT0gSlNPTi5zdHJpbmdpZnkoW10pICYmIGRhdGEgIT09IHVuZGVmaW5lZCkgIHsgXHJcblxyXG4gICAgICAgIHJldHVybiBuZXcgUmVzcG9uc2UoSlNPTi5zdHJpbmdpZnkoZGF0YSkpOyBcclxuICAgICAgfVxyXG4gICAgfSk7XHJcbiAgfSk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBHZXRzIGFsbCBkYXRhIHN0b3JlZCBpbiB0ZW1wIGluZGV4ZWQgZGIgYW5kIFxyXG4gKiBhdHRlbXB0cyBzeWNocm9uaXphdGlvbiB3aXRoIHRoZSBzZXJ2ZXJcclxuICovXHJcbmZ1bmN0aW9uIHN5bmNXaXRoU2VydmVyKCkge1xyXG5cclxuICByZXR1cm4gdGVtcERCUHJvbWlzZS50aGVuKGRiID0+IHtcclxuICAgICAgICAgICAgXHJcbiAgICBpZighZGIpIHJldHVybjtcclxuXHJcbiAgICB2YXIgdHggPSBkYi50cmFuc2FjdGlvbigncmVzdGF1cmFudC1yZXZpZXdzLXRlbXAnLCAncmVhZHdyaXRlJyk7XHJcbiAgICB2YXIgc3RvcmUgPSB0eC5vYmplY3RTdG9yZSgncmVzdGF1cmFudC1yZXZpZXdzLXRlbXAnKTtcclxuXHJcbiAgICByZXR1cm4gc3RvcmUuZ2V0QWxsKCkudGhlbih0ZW1wUmVxdWVzdHMgPT4ge1xyXG5cclxuICAgICAgcmV0dXJuIFByb21pc2UuYWxsKHRlbXBSZXF1ZXN0cy5tYXAoZnVuY3Rpb24odGVtcFJlcXVlc3QpIHtcclxuICAgICAgICBcclxuICAgICAgICByZXR1cm4gc2VuZFRvU2VydmVyKHRlbXBSZXF1ZXN0KVxyXG4gICAgICAgIC50aGVuKChuZXR3b3JrUmVzcG9uc2UpID0+IHtcclxuICAgICAgICAgIFxyXG4gICAgICAgICAgY29uc29sZS5sb2coJ1N1Y2Nlc3Mgc3luY2luZyEnKTtcclxuXHJcbiAgICAgICAgICB2YXIgdHgxID0gZGIudHJhbnNhY3Rpb24oJ3Jlc3RhdXJhbnQtcmV2aWV3cy10ZW1wJywgJ3JlYWR3cml0ZScpO1xyXG4gICAgICAgICAgdmFyIHN0b3JlMSA9IHR4MS5vYmplY3RTdG9yZSgncmVzdGF1cmFudC1yZXZpZXdzLXRlbXAnKTtcclxuXHJcbiAgICAgICAgICBzdG9yZTEuZGVsZXRlKHRlbXBSZXF1ZXN0LmNyZWF0ZWRBdCk7XHJcbiAgICAgICAgICBcclxuICAgICAgICAgIHJldHVybiBuZXR3b3JrUmVzcG9uc2UuanNvbigpO1xyXG4gICAgICBcclxuICAgICAgICB9KS50aGVuKGpzb24gPT4ge1xyXG5cclxuICAgICAgICAgIGlmKHRlbXBSZXF1ZXN0LnR5cGUgPT09ICdjcmVhdGUtcmV2aWV3Jykge1xyXG5cclxuICAgICAgICAgICAgaWYoIXJldmlld3NEYlByb21pc2UpIHJldHVybjtcclxuXHJcbiAgICAgICAgICAgIHJldmlld3NEYlByb21pc2UudGhlbihkYjEgPT4ge1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgICBpZighZGIxKSByZXR1cm47XHJcbiAgICAgIFxyXG4gICAgICAgICAgICAgIHZhciB0eDIgPSBkYjEudHJhbnNhY3Rpb24oJ3Jlc3RhdXJhbnQtcmV2aWV3cycsICdyZWFkd3JpdGUnKTtcclxuICAgICAgICAgICAgICB2YXIgc3RvcmUyID0gdHgyLm9iamVjdFN0b3JlKCdyZXN0YXVyYW50LXJldmlld3MnKTtcclxuICAgIFxyXG4gICAgICAgICAgICAgIGpzb24ucmVzdGF1cmFudF9pZCA9IHBhcnNlSW50KGpzb24ucmVzdGF1cmFudF9pZCkgfHwgMDtcclxuICAgICAgICAgICAgICBzdG9yZTIucHV0KGpzb24sIGpzb24uaWQpO1xyXG4gICAgICAgICAgICB9KTsgIFxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgICB9KSk7XHJcbiAgICB9KTtcclxuICB9KS5jYXRjaChlcnJvciA9PiB7XHJcbiAgICB0aHJvdyBlcnJvcjtcclxuICB9KSBcclxufVxyXG5cclxuLyoqXHJcbiAqIFNlbmRzIHBvc3QvcHV0IHJlcXVlc3QgdG8gc2VydmVyXHJcbiAqIFxyXG4gKiBAcGFyYW0geyp9IGRhdGEgXHJcbiAqL1xyXG5mdW5jdGlvbiBzZW5kVG9TZXJ2ZXIoZGF0YSkge1xyXG5cclxuICByZXR1cm4gZmV0Y2goZGF0YS51cmwsIHtcclxuICAgIGhlYWRlcnM6IHtcclxuXHJcbiAgICAgIFwiQWNjZXB0XCI6IFwidGV4dC9odG1sLGFwcGxpY2F0aW9uL3hodG1sK3htbCxhcHBsaWNhdGlvbi94bWw7cT0wLjksaW1hZ2Uvd2VicCxpbWFnZS9hcG5nLCovKjtxPTAuOFwiLFxyXG4gICAgICBcIkNvbm5lY3Rpb25cIjogXCJrZWVwLWFsaXZlXCIsXHJcbiAgICAgIFwiQ29udGVudC1MZW5ndGhcIjogYCR7c2VyaWFsaXplT2JqZWN0KGRhdGEuZm9ybURhdGEpLmxlbmd0aH1gLFxyXG4gICAgICBcIkNvbnRlbnQtVHlwZVwiOiBcImFwcGxpY2F0aW9uL3gtd3d3LWZvcm0tdXJsZW5jb2RlZFwiXHJcbiAgICB9LFxyXG4gICAgbWV0aG9kOiBkYXRhLm1ldGhvZCxcclxuICAgIGJvZHk6IHNlcmlhbGl6ZU9iamVjdChkYXRhLmZvcm1EYXRhKSxcclxuICB9KTtcclxufVxyXG5cclxuLyoqXHJcbiAqIFNhdmVzIHRlbXAgcG9zdC9wdXQgcmVxdWVzdHMgZGF0YSB3aGVuIGJhZCBjb25uZWN0aW9uXHJcbiAqIFxyXG4gKiBAcGFyYW0geyp9IGRhdGEgXHJcbiAqL1xyXG5mdW5jdGlvbiBzYXZlSW5UZW1wREIoZGF0YSkge1xyXG4gIFxyXG4gIGlmKCF0ZW1wREJQcm9taXNlKSByZXR1cm47XHJcblxyXG4gIHJldHVybiB0ZW1wREJQcm9taXNlLnRoZW4oZGIgPT4ge1xyXG4gICAgICAgICAgICBcclxuICAgIGlmKCFkYikgcmV0dXJuO1xyXG5cclxuICAgIHZhciB0eCA9IGRiLnRyYW5zYWN0aW9uKCdyZXN0YXVyYW50LXJldmlld3MtdGVtcCcsICdyZWFkd3JpdGUnKTtcclxuICAgIHZhciBzdG9yZSA9IHR4Lm9iamVjdFN0b3JlKCdyZXN0YXVyYW50LXJldmlld3MtdGVtcCcpO1xyXG5cclxuICAgIHN0b3JlLnB1dChkYXRhLCBkYXRhLmNyZWF0ZWRBdCk7XHJcblxyXG4gICAgcmV0dXJuIGRhdGE7XHJcblxyXG4gIH0pO1xyXG59XHJcblxyXG5mdW5jdGlvbiBtYXJrRmF2b3JpdGUocmVzdGF1cmFudF9pZCkge1xyXG4gICAgXHJcbn1cclxuXHJcbi8vPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09IElOREVYRUQgREIgUFJPTUlTRVNcclxuXHJcbi8qKlxyXG4gKiBDcmVhdGUgYW4gaW5kZXhlZCBkYiBvZiBrZXl2YWwgdHlwZSBuYW1lZCBgcmVzdGF1cmFudHNgXHJcbiAqL1xyXG5mdW5jdGlvbiBjcmVhdGVEQigpIHtcclxuICByZXR1cm4gaWRiLm9wZW4oJ3Jlc3RhdXJhbnRzJywgMSwgdXBncmFkZURCID0+IHtcclxuICAgIHZhciBzdG9yZSA9IHVwZ3JhZGVEQi5jcmVhdGVPYmplY3RTdG9yZSgncmVzdGF1cmFudHMnLCB7XHJcbiAgICAgIGtleXBhdGg6ICdpZCdcclxuICAgIH0pO1xyXG4gIH0pO1xyXG59XHJcblxyXG4vKipcclxuICogQ3JlYXRlIGFuIGluZGV4ZWQgZGIgb2Yga2V5dmFsIHR5cGUgbmFtZWQgYHJlc3RhdXJhbnQtcmV2aWV3c2BcclxuICovXHJcbmZ1bmN0aW9uIGNyZWF0ZVJldmlld0RCKCkge1xyXG4gIHJldHVybiBpZGIub3BlbigncmVzdGF1cmFudC1yZXZpZXdzJywgMSwgdXBncmFkZURCID0+IHtcclxuICAgIHZhciBzdG9yZSA9IHVwZ3JhZGVEQi5jcmVhdGVPYmplY3RTdG9yZSgncmVzdGF1cmFudC1yZXZpZXdzJywge1xyXG4gICAgICBrZXlwYXRoOiAnaWQnXHJcbiAgICB9KTtcclxuXHJcbiAgICBzdG9yZS5jcmVhdGVJbmRleCgnYnktcmVzdGF1cmFudCcsICdyZXN0YXVyYW50X2lkJyk7XHJcbiAgICBzdG9yZS5jcmVhdGVJbmRleCgnYnktZGF0ZScsICdjcmVhdGVkQXQnKTtcclxuICB9KTtcclxufVxyXG5cclxuLyoqXHJcbiAqIENyZWF0ZSBhbiBpbmRleGVkIGRiIG9mIGtleXZhbCB0eXBlIG5hbWVkIGByZXN0YXVyYW50LXJldmlld3NgXHJcbiAqL1xyXG5mdW5jdGlvbiBjcmVhdGVUZW1wUmV2aWV3REIoKSB7XHJcbiAgcmV0dXJuIGlkYi5vcGVuKCdyZXN0YXVyYW50LXJldmlld3MtdGVtcCcsIDEsIHVwZ3JhZGVEQiA9PiB7XHJcbiAgICB2YXIgc3RvcmUgPSB1cGdyYWRlREIuY3JlYXRlT2JqZWN0U3RvcmUoJ3Jlc3RhdXJhbnQtcmV2aWV3cy10ZW1wJywge1xyXG4gICAgICBrZXlwYXRoOiAnY3JlYXRlZEF0J1xyXG4gICAgfSk7XHJcblxyXG4gICAgc3RvcmUuY3JlYXRlSW5kZXgoJ2J5LXR5cGUnLCAndHlwZScpO1xyXG4gIH0pO1xyXG59XHJcblxyXG4vLz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSBFVkVOVFNcclxuXHJcbi8qKiBcclxuICogT3BlbiBjYWNoZXMgb24gaW5zdGFsbCBvZiBzdyBcclxuICovXHJcbnNlbGYuYWRkRXZlbnRMaXN0ZW5lcignaW5zdGFsbCcsIGV2ZW50ID0+IHtcclxuICAvLyBPcGVuIGNhY2hlIGZvciBzdGF0aWMgY29udGVudCBhbmQgY2FjaGUgNDA0IHBhZ2VcclxuXHJcbiAgICB2YXIgb3BlblN0YXRpY0NhY2hlUHJvbWlzZSA9IGNhY2hlcy5vcGVuKENBQ0hFX1NUQVRJQykudGhlbihjYWNoZSA9PiB7XHJcbiAgICAgIGNhY2hlLmFkZEFsbChbb2ZmbGluZVBhZ2VdKTtcclxuICAgICAgY29uc29sZS5sb2coYENhY2hlICR7Q0FDSEVfU1RBVElDfSBvcGVuZWRgKTtcclxuICAgIH0pO1xyXG5cclxuICAgIHZhciBvcGVuSW1hZ2VDYWNoZVByb21pc2UgPSBjYWNoZXMub3BlbihDQUNIRV9JTUFHRVMpLnRoZW4oY2FjaGUgPT4ge1xyXG4gICAgICBjb25zb2xlLmxvZyhgQ2FjaGUgJHtDQUNIRV9JTUFHRVN9IG9wZW5lZGApO1xyXG4gICAgfSlcclxuXHJcbiAgICBkYlByb21pc2UgPSBjcmVhdGVEQigpO1xyXG5cclxuICAgIGV2ZW50LndhaXRVbnRpbChcclxuICAgICAgUHJvbWlzZS5hbGwoW29wZW5TdGF0aWNDYWNoZVByb21pc2UsIG9wZW5JbWFnZUNhY2hlUHJvbWlzZV0pXHJcbiAgICAgIC50aGVuKCgpID0+IHtcclxuICAgICAgICByZXR1cm4gc2VsZi5za2lwV2FpdGluZygpXHJcbiAgICAgIH0pXHJcbiAgICApO1xyXG59KTtcclxuXHJcbi8qKiBcclxuICogT3BlbiBpbmRleCBkYiBvbiBhY3RpdmF0ZVxyXG4gKi9cclxuc2VsZi5hZGRFdmVudExpc3RlbmVyKCdhY3RpdmF0ZScsIGV2ZW50ID0+IHtcclxuXHJcbiAgZGJQcm9taXNlID0gY3JlYXRlREIoKTtcclxuICByZXZpZXdzRGJQcm9taXNlID0gY3JlYXRlUmV2aWV3REIoKTtcclxuICB0ZW1wREJQcm9taXNlID0gY3JlYXRlVGVtcFJldmlld0RCKCk7XHJcblxyXG4gIGV2ZW50LndhaXRVbnRpbChcclxuICAgIFByb21pc2UuYWxsKFtkYlByb21pc2UsIHJldmlld3NEYlByb21pc2UsdGVtcERCUHJvbWlzZV0pXHJcbiAgICAudGhlbigoKSA9PiB7XHJcbiAgICAgIHJldHVybiBzZWxmLnNraXBXYWl0aW5nKClcclxuICAgIH0pXHJcbiAgKTtcclxufSk7XHJcblxyXG4vKiogXHJcbiAqIEhhbmRsZSBmZXRjaCBldmVudFxyXG4gKi9cclxuc2VsZi5hZGRFdmVudExpc3RlbmVyKCdmZXRjaCcsIGV2ZW50ID0+IHtcclxuXHJcbiAgLy8gaGFuZGxlIHJlcXVlc3QgYWNjb3JkaW5nIHRvIGl0cyB0eXBlXHJcblxyXG4gIGlmKGV2ZW50LnJlcXVlc3QubWV0aG9kID09PSAnR0VUJykge1xyXG5cclxuICAgIGlmKGV2ZW50LnJlcXVlc3QudXJsLmVuZHNXaXRoKCcuanBnJykpIHtcclxuICAgICAgZXZlbnQucmVzcG9uZFdpdGgoY2FjaGVJbWFnZXMoZXZlbnQucmVxdWVzdCkpOyAgXHJcbiAgICAgIHJldHVybjtcclxuICAgIH0gZWxzZSBpZiAoZXZlbnQucmVxdWVzdC51cmwuaW5jbHVkZXMoJ3Jldmlld3MnKSkge1xyXG4gICAgICBcclxuICAgICAgLyoqXHJcbiAgICAgICAqIEdldCBkYXRhIGZyb20gc3RhYmxlIGluZGV4ZWQgZGIgb3IgdGhlIG5ldHdvcmsgYW5kIGlmIGRhdGEgZXhpc3QgaW4gdGVtcCBpbmRleGVkIGRiIFxyXG4gICAgICAgKiByZXR1cm4gY29uc29saWRhdGVkIGRhdGEgZm9yIGJldHRlciB1c2VyIGV4cGVyaWVuY2VcclxuICAgICAgICovXHJcbiAgICAgIGV2ZW50LnJlc3BvbmRXaXRoKFxyXG4gICAgICAgIFByb21pc2UuYWxsKFtzZWFyY2hJREJGb3JSZXZpZXdzKGV2ZW50LnJlcXVlc3QpLCBzZWFyY2hUZW1wREJGb3JSZXZpZXdzKGV2ZW50LnJlcXVlc3QpXSlcclxuICAgICAgICAudGhlbigocmVzcG9uc2VzKSA9PiB7XHJcblxyXG4gICAgICAgICAgcmV0dXJuIFByb21pc2UuYWxsKHJlc3BvbnNlcy5tYXAoKHJlc3BvbnNlKSA9PiB7XHJcblxyXG4gICAgICAgICAgICBpZih0eXBlb2YocmVzcG9uc2UpID09PSAndW5kZWZpbmVkJykgcmV0dXJuIFtdO1xyXG4gICAgICAgICAgIFxyXG4gICAgICAgICAgICByZXR1cm4gcmVzcG9uc2UuanNvbigpLnRoZW4oKGpzb24pID0+IHsgIFxyXG4gICAgICAgICAgICAgIHJldHVybiBqc29uO1xyXG4gICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICB9KSkudGhlbigoanNvbnMpID0+IHtcclxuICAgICAgICAgIFxyXG4gICAgICAgICAgICB2YXIgY29uY2F0ZW5hdGVkUmVzcG9uc2UgPSBbXTtcclxuXHJcbiAgICAgICAgICAgIHJldHVybiBQcm9taXNlLmFsbChqc29ucy5tYXAoKGpzb24pID0+IHtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAganNvbi5mb3JFYWNoKG9iaiA9PiB7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYodHlwZW9mKG9iai5mb3JtRGF0YSkgIT09ICd1bmRlZmluZWQnKSB7XHJcbiAgICAgICAgICAgICAgICAgIGNvbmNhdGVuYXRlZFJlc3BvbnNlLnB1c2gob2JqLmZvcm1EYXRhKTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZXtcclxuICAgICAgICAgICAgICAgICAgY29uY2F0ZW5hdGVkUmVzcG9uc2UucHVzaChvYmopO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIH0pKS50aGVuKCgpID0+IHtcclxuICAgICAgICAgICAgICByZXR1cm4gY29uY2F0ZW5hdGVkUmVzcG9uc2U7XHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgfSkudGhlbihjb25jYXRlbmF0ZWRSZXNwb25zZSA9PiB7XHJcbiAgICAgICAgICByZXR1cm4gbmV3IFJlc3BvbnNlKEpTT04uc3RyaW5naWZ5KGNvbmNhdGVuYXRlZFJlc3BvbnNlKSk7IFxyXG4gICAgICAgIH0pXHJcbiAgICAgICk7XHJcbiAgICAgIHJldHVybjtcclxuICAgIH0gZWxzZSBpZiAoZXZlbnQucmVxdWVzdC51cmwuaW5jbHVkZXMoJ3Jlc3RhdXJhbnRzJykpIHtcclxuICAgICAgZXZlbnQucmVzcG9uZFdpdGgoc2VhcmNoSW5JREIoZXZlbnQucmVxdWVzdCkpO1xyXG4gICAgICByZXR1cm47XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBldmVudC5yZXNwb25kV2l0aChjYWNoZVN0YXRpY0NvbnRlbnQoZXZlbnQucmVxdWVzdCkpO1xyXG4gICAgICByZXR1cm47XHJcbiAgICB9XHJcbiAgfSAgXHJcbn0pO1xyXG5cclxuc2VsZi5hZGRFdmVudExpc3RlbmVyKCdtZXNzYWdlJywgZXZlbnQgPT4ge1xyXG5cclxuICBpZihldmVudC5kYXRhLnR5cGUgPT09ICdjcmVhdGUtcmV2aWV3Jykge1xyXG5cclxuICAgIGV2ZW50LmRhdGEuY3JlYXRlZEF0ID0gRGF0ZS5wYXJzZShuZXcgRGF0ZSgpKTtcclxuXHJcbiAgICByZXR1cm4gc2F2ZUluVGVtcERCKGV2ZW50LmRhdGEpLnRoZW4oKGpzb25TYXZlZCk9PntcclxuXHJcbiAgICAgIHNlbGYucmVnaXN0cmF0aW9uLnN5bmMucmVnaXN0ZXIoJ3N1Ym1pdC1yZXZpZXcnKTtcclxuICAgIH0pO1xyXG4gIH1cclxufSk7XHJcblxyXG5zZWxmLmFkZEV2ZW50TGlzdGVuZXIoJ3N5bmMnLCBldmVudCA9PiB7XHJcblxyXG4gIGlmKCF0ZW1wREJQcm9taXNlKSByZXR1cm47XHJcblxyXG4gIGlmIChldmVudC50YWcgPT0gJ3N1Ym1pdC1yZXZpZXcnKSB7XHJcbiAgICBldmVudC53YWl0VW50aWwoc3luY1dpdGhTZXJ2ZXIoKSk7XHJcbiAgfVxyXG5cclxuICAvLyBpZiAoZXZlbnQudGFnID09ICdtYXJrLWZhdm9yaXRlJykge1xyXG4gIC8vICAgZXZlbnQud2FpdFVudGlsKG1hcmtGYXZvcml0ZShyZXN0YXVyYW50X2lkKSk7XHJcbiAgLy8gfVxyXG4gIFxyXG59KTtcclxuXHJcbmZ1bmN0aW9uIHNlcmlhbGl6ZU9iamVjdChwYXJhbXMpIHtcclxuXHJcbiAgcmV0dXJuIE9iamVjdC5rZXlzKHBhcmFtcykubWFwKGtleSA9PiBrZXkgKyAnPScgKyBwYXJhbXNba2V5XSkuam9pbignJicpO1xyXG59XHJcbiJdfQ==
