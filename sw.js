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
 * Fetch from network and save in indexed DB
 */
function fetchFromNetworkAndCacheRestaurantsInIndexedDB(request) {

  var pathSlices = request.url.split("/");
  var restaurantId = parseInt(pathSlices[pathSlices.length - 1]) || 0;

  return fetch(request).then(function (networkResponse) {

    networkResponse.clone().json().then(function (json) {

      if (!dbPromise) return;

      dbPromise.then(function (db) {

        if (!db) return;

        var tx = db.transaction('restaurants', 'readwrite');
        var store = tx.objectStore('restaurants');

        // if we refer to all data
        if (!restaurantId) {

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
 * Search in indexed DB and if no result fetch from network 
 */
function getData(request) {

  var pathSlices = request.clone().url.split("/");
  var restaurantId = parseInt(pathSlices[pathSlices.length - 1]) || 0;
  var dataPromise;

  // if not indexed db functionality fetch from network
  if (!dbPromise) return fetchFromNetworkAndCacheRestaurantsInIndexedDB(request.clone());

  return dbPromise.then(function (db) {

    if (!db) return;

    var store = db.transaction('restaurants').objectStore('restaurants');

    // if all data are requested
    if (!restaurantId) {

      dataPromise = store.getAll();
    } else {
      // if per restaurant data are requested

      dataPromise = store.get(restaurantId);
    }

    if (dataPromise) {

      return dataPromise.then(function (data) {

        // if data found in indexed db return them
        if (JSON.stringify(data) !== JSON.stringify([]) && data !== undefined) {

          console.log('Found cached');
          return new Response(JSON.stringify(data));
        }

        console.log('Fetch from network');
        // if data not cached then fetch from network
        return fetchFromNetworkAndCacheRestaurantsInIndexedDB(request);
      });
    }
  });
}

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
  event.waitUntil(dbPromise);
});

/** 
 * Handle fetch 
 */
self.addEventListener('fetch', function (event) {
  // handle request according to its type
  if (event.request.url.endsWith('.jpg')) {
    event.respondWith(cacheImages(event.request));
    return;
  } else if (event.request.url.includes('restaurants')) {
    event.respondWith(getData(event.request));
    return;
  } else {
    event.respondWith(cacheStaticContent(event.request));
    return;
  }
});

},{"idb":1}]},{},[2])
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvaWRiL2xpYi9pZGIuanMiLCIvaG9tZS92aWNraWUvVWRhY2l0eS9td3MtcmVzdGF1cmFudC1zdGFnZS0xL3NyYy9zdy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7OzttQkN0VGdCLEtBQUs7Ozs7Ozs7QUFLckIsSUFBSSxZQUFZLEdBQUcsOEJBQThCLENBQUM7QUFDbEQsSUFB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QkFBZ0IsQ0FBQyxPQUFPLEVBQUUsVUFBQSxLQUFLLEVBQUk7O0FBRXRDLE1BQUcsS0FBSyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxFQUFFO0FBQ3JDLFNBQUssQ0FBQyxXQUFXLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO0FBQzlDLFdBQU87R0FDUixNQUFNLElBQUksS0FBSyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLGFBQWEsQ0FBQyxFQUFFO0FBQ3BELFNBQUssQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO0FBQzFDLFdBQU87R0FDUixNQUFNO0FBQ0wsU0FBSyxDQUFDLFdBQVcsQ0FBQyxrQkFBa0IsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQztBQUNyRCxXQUFPO0dBQ1I7Q0FDRixDQUFDLENBQUMiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiJ3VzZSBzdHJpY3QnO1xuXG4oZnVuY3Rpb24oKSB7XG4gIGZ1bmN0aW9uIHRvQXJyYXkoYXJyKSB7XG4gICAgcmV0dXJuIEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFycik7XG4gIH1cblxuICBmdW5jdGlvbiBwcm9taXNpZnlSZXF1ZXN0KHJlcXVlc3QpIHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24ocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICByZXF1ZXN0Lm9uc3VjY2VzcyA9IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXNvbHZlKHJlcXVlc3QucmVzdWx0KTtcbiAgICAgIH07XG5cbiAgICAgIHJlcXVlc3Qub25lcnJvciA9IGZ1bmN0aW9uKCkge1xuICAgICAgICByZWplY3QocmVxdWVzdC5lcnJvcik7XG4gICAgICB9O1xuICAgIH0pO1xuICB9XG5cbiAgZnVuY3Rpb24gcHJvbWlzaWZ5UmVxdWVzdENhbGwob2JqLCBtZXRob2QsIGFyZ3MpIHtcbiAgICB2YXIgcmVxdWVzdDtcbiAgICB2YXIgcCA9IG5ldyBQcm9taXNlKGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgcmVxdWVzdCA9IG9ialttZXRob2RdLmFwcGx5KG9iaiwgYXJncyk7XG4gICAgICBwcm9taXNpZnlSZXF1ZXN0KHJlcXVlc3QpLnRoZW4ocmVzb2x2ZSwgcmVqZWN0KTtcbiAgICB9KTtcblxuICAgIHAucmVxdWVzdCA9IHJlcXVlc3Q7XG4gICAgcmV0dXJuIHA7XG4gIH1cbiAgXG4gIGZ1bmN0aW9uIHByb21pc2lmeUN1cnNvclJlcXVlc3RDYWxsKG9iaiwgbWV0aG9kLCBhcmdzKSB7XG4gICAgdmFyIHAgPSBwcm9taXNpZnlSZXF1ZXN0Q2FsbChvYmosIG1ldGhvZCwgYXJncyk7XG4gICAgcmV0dXJuIHAudGhlbihmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgaWYgKCF2YWx1ZSkgcmV0dXJuO1xuICAgICAgcmV0dXJuIG5ldyBDdXJzb3IodmFsdWUsIHAucmVxdWVzdCk7XG4gICAgfSk7XG4gIH1cblxuICBmdW5jdGlvbiBwcm94eVByb3BlcnRpZXMoUHJveHlDbGFzcywgdGFyZ2V0UHJvcCwgcHJvcGVydGllcykge1xuICAgIHByb3BlcnRpZXMuZm9yRWFjaChmdW5jdGlvbihwcm9wKSB7XG4gICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoUHJveHlDbGFzcy5wcm90b3R5cGUsIHByb3AsIHtcbiAgICAgICAgZ2V0OiBmdW5jdGlvbigpIHtcbiAgICAgICAgICByZXR1cm4gdGhpc1t0YXJnZXRQcm9wXVtwcm9wXTtcbiAgICAgICAgfSxcbiAgICAgICAgc2V0OiBmdW5jdGlvbih2YWwpIHtcbiAgICAgICAgICB0aGlzW3RhcmdldFByb3BdW3Byb3BdID0gdmFsO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHByb3h5UmVxdWVzdE1ldGhvZHMoUHJveHlDbGFzcywgdGFyZ2V0UHJvcCwgQ29uc3RydWN0b3IsIHByb3BlcnRpZXMpIHtcbiAgICBwcm9wZXJ0aWVzLmZvckVhY2goZnVuY3Rpb24ocHJvcCkge1xuICAgICAgaWYgKCEocHJvcCBpbiBDb25zdHJ1Y3Rvci5wcm90b3R5cGUpKSByZXR1cm47XG4gICAgICBQcm94eUNsYXNzLnByb3RvdHlwZVtwcm9wXSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gcHJvbWlzaWZ5UmVxdWVzdENhbGwodGhpc1t0YXJnZXRQcm9wXSwgcHJvcCwgYXJndW1lbnRzKTtcbiAgICAgIH07XG4gICAgfSk7XG4gIH1cblxuICBmdW5jdGlvbiBwcm94eU1ldGhvZHMoUHJveHlDbGFzcywgdGFyZ2V0UHJvcCwgQ29uc3RydWN0b3IsIHByb3BlcnRpZXMpIHtcbiAgICBwcm9wZXJ0aWVzLmZvckVhY2goZnVuY3Rpb24ocHJvcCkge1xuICAgICAgaWYgKCEocHJvcCBpbiBDb25zdHJ1Y3Rvci5wcm90b3R5cGUpKSByZXR1cm47XG4gICAgICBQcm94eUNsYXNzLnByb3RvdHlwZVtwcm9wXSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gdGhpc1t0YXJnZXRQcm9wXVtwcm9wXS5hcHBseSh0aGlzW3RhcmdldFByb3BdLCBhcmd1bWVudHMpO1xuICAgICAgfTtcbiAgICB9KTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHByb3h5Q3Vyc29yUmVxdWVzdE1ldGhvZHMoUHJveHlDbGFzcywgdGFyZ2V0UHJvcCwgQ29uc3RydWN0b3IsIHByb3BlcnRpZXMpIHtcbiAgICBwcm9wZXJ0aWVzLmZvckVhY2goZnVuY3Rpb24ocHJvcCkge1xuICAgICAgaWYgKCEocHJvcCBpbiBDb25zdHJ1Y3Rvci5wcm90b3R5cGUpKSByZXR1cm47XG4gICAgICBQcm94eUNsYXNzLnByb3RvdHlwZVtwcm9wXSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gcHJvbWlzaWZ5Q3Vyc29yUmVxdWVzdENhbGwodGhpc1t0YXJnZXRQcm9wXSwgcHJvcCwgYXJndW1lbnRzKTtcbiAgICAgIH07XG4gICAgfSk7XG4gIH1cblxuICBmdW5jdGlvbiBJbmRleChpbmRleCkge1xuICAgIHRoaXMuX2luZGV4ID0gaW5kZXg7XG4gIH1cblxuICBwcm94eVByb3BlcnRpZXMoSW5kZXgsICdfaW5kZXgnLCBbXG4gICAgJ25hbWUnLFxuICAgICdrZXlQYXRoJyxcbiAgICAnbXVsdGlFbnRyeScsXG4gICAgJ3VuaXF1ZSdcbiAgXSk7XG5cbiAgcHJveHlSZXF1ZXN0TWV0aG9kcyhJbmRleCwgJ19pbmRleCcsIElEQkluZGV4LCBbXG4gICAgJ2dldCcsXG4gICAgJ2dldEtleScsXG4gICAgJ2dldEFsbCcsXG4gICAgJ2dldEFsbEtleXMnLFxuICAgICdjb3VudCdcbiAgXSk7XG5cbiAgcHJveHlDdXJzb3JSZXF1ZXN0TWV0aG9kcyhJbmRleCwgJ19pbmRleCcsIElEQkluZGV4LCBbXG4gICAgJ29wZW5DdXJzb3InLFxuICAgICdvcGVuS2V5Q3Vyc29yJ1xuICBdKTtcblxuICBmdW5jdGlvbiBDdXJzb3IoY3Vyc29yLCByZXF1ZXN0KSB7XG4gICAgdGhpcy5fY3Vyc29yID0gY3Vyc29yO1xuICAgIHRoaXMuX3JlcXVlc3QgPSByZXF1ZXN0O1xuICB9XG5cbiAgcHJveHlQcm9wZXJ0aWVzKEN1cnNvciwgJ19jdXJzb3InLCBbXG4gICAgJ2RpcmVjdGlvbicsXG4gICAgJ2tleScsXG4gICAgJ3ByaW1hcnlLZXknLFxuICAgICd2YWx1ZSdcbiAgXSk7XG5cbiAgcHJveHlSZXF1ZXN0TWV0aG9kcyhDdXJzb3IsICdfY3Vyc29yJywgSURCQ3Vyc29yLCBbXG4gICAgJ3VwZGF0ZScsXG4gICAgJ2RlbGV0ZSdcbiAgXSk7XG5cbiAgLy8gcHJveHkgJ25leHQnIG1ldGhvZHNcbiAgWydhZHZhbmNlJywgJ2NvbnRpbnVlJywgJ2NvbnRpbnVlUHJpbWFyeUtleSddLmZvckVhY2goZnVuY3Rpb24obWV0aG9kTmFtZSkge1xuICAgIGlmICghKG1ldGhvZE5hbWUgaW4gSURCQ3Vyc29yLnByb3RvdHlwZSkpIHJldHVybjtcbiAgICBDdXJzb3IucHJvdG90eXBlW21ldGhvZE5hbWVdID0gZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgY3Vyc29yID0gdGhpcztcbiAgICAgIHZhciBhcmdzID0gYXJndW1lbnRzO1xuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpLnRoZW4oZnVuY3Rpb24oKSB7XG4gICAgICAgIGN1cnNvci5fY3Vyc29yW21ldGhvZE5hbWVdLmFwcGx5KGN1cnNvci5fY3Vyc29yLCBhcmdzKTtcbiAgICAgICAgcmV0dXJuIHByb21pc2lmeVJlcXVlc3QoY3Vyc29yLl9yZXF1ZXN0KS50aGVuKGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICAgICAgaWYgKCF2YWx1ZSkgcmV0dXJuO1xuICAgICAgICAgIHJldHVybiBuZXcgQ3Vyc29yKHZhbHVlLCBjdXJzb3IuX3JlcXVlc3QpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH07XG4gIH0pO1xuXG4gIGZ1bmN0aW9uIE9iamVjdFN0b3JlKHN0b3JlKSB7XG4gICAgdGhpcy5fc3RvcmUgPSBzdG9yZTtcbiAgfVxuXG4gIE9iamVjdFN0b3JlLnByb3RvdHlwZS5jcmVhdGVJbmRleCA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBuZXcgSW5kZXgodGhpcy5fc3RvcmUuY3JlYXRlSW5kZXguYXBwbHkodGhpcy5fc3RvcmUsIGFyZ3VtZW50cykpO1xuICB9O1xuXG4gIE9iamVjdFN0b3JlLnByb3RvdHlwZS5pbmRleCA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBuZXcgSW5kZXgodGhpcy5fc3RvcmUuaW5kZXguYXBwbHkodGhpcy5fc3RvcmUsIGFyZ3VtZW50cykpO1xuICB9O1xuXG4gIHByb3h5UHJvcGVydGllcyhPYmplY3RTdG9yZSwgJ19zdG9yZScsIFtcbiAgICAnbmFtZScsXG4gICAgJ2tleVBhdGgnLFxuICAgICdpbmRleE5hbWVzJyxcbiAgICAnYXV0b0luY3JlbWVudCdcbiAgXSk7XG5cbiAgcHJveHlSZXF1ZXN0TWV0aG9kcyhPYmplY3RTdG9yZSwgJ19zdG9yZScsIElEQk9iamVjdFN0b3JlLCBbXG4gICAgJ3B1dCcsXG4gICAgJ2FkZCcsXG4gICAgJ2RlbGV0ZScsXG4gICAgJ2NsZWFyJyxcbiAgICAnZ2V0JyxcbiAgICAnZ2V0QWxsJyxcbiAgICAnZ2V0S2V5JyxcbiAgICAnZ2V0QWxsS2V5cycsXG4gICAgJ2NvdW50J1xuICBdKTtcblxuICBwcm94eUN1cnNvclJlcXVlc3RNZXRob2RzKE9iamVjdFN0b3JlLCAnX3N0b3JlJywgSURCT2JqZWN0U3RvcmUsIFtcbiAgICAnb3BlbkN1cnNvcicsXG4gICAgJ29wZW5LZXlDdXJzb3InXG4gIF0pO1xuXG4gIHByb3h5TWV0aG9kcyhPYmplY3RTdG9yZSwgJ19zdG9yZScsIElEQk9iamVjdFN0b3JlLCBbXG4gICAgJ2RlbGV0ZUluZGV4J1xuICBdKTtcblxuICBmdW5jdGlvbiBUcmFuc2FjdGlvbihpZGJUcmFuc2FjdGlvbikge1xuICAgIHRoaXMuX3R4ID0gaWRiVHJhbnNhY3Rpb247XG4gICAgdGhpcy5jb21wbGV0ZSA9IG5ldyBQcm9taXNlKGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgaWRiVHJhbnNhY3Rpb24ub25jb21wbGV0ZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXNvbHZlKCk7XG4gICAgICB9O1xuICAgICAgaWRiVHJhbnNhY3Rpb24ub25lcnJvciA9IGZ1bmN0aW9uKCkge1xuICAgICAgICByZWplY3QoaWRiVHJhbnNhY3Rpb24uZXJyb3IpO1xuICAgICAgfTtcbiAgICAgIGlkYlRyYW5zYWN0aW9uLm9uYWJvcnQgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgcmVqZWN0KGlkYlRyYW5zYWN0aW9uLmVycm9yKTtcbiAgICAgIH07XG4gICAgfSk7XG4gIH1cblxuICBUcmFuc2FjdGlvbi5wcm90b3R5cGUub2JqZWN0U3RvcmUgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gbmV3IE9iamVjdFN0b3JlKHRoaXMuX3R4Lm9iamVjdFN0b3JlLmFwcGx5KHRoaXMuX3R4LCBhcmd1bWVudHMpKTtcbiAgfTtcblxuICBwcm94eVByb3BlcnRpZXMoVHJhbnNhY3Rpb24sICdfdHgnLCBbXG4gICAgJ29iamVjdFN0b3JlTmFtZXMnLFxuICAgICdtb2RlJ1xuICBdKTtcblxuICBwcm94eU1ldGhvZHMoVHJhbnNhY3Rpb24sICdfdHgnLCBJREJUcmFuc2FjdGlvbiwgW1xuICAgICdhYm9ydCdcbiAgXSk7XG5cbiAgZnVuY3Rpb24gVXBncmFkZURCKGRiLCBvbGRWZXJzaW9uLCB0cmFuc2FjdGlvbikge1xuICAgIHRoaXMuX2RiID0gZGI7XG4gICAgdGhpcy5vbGRWZXJzaW9uID0gb2xkVmVyc2lvbjtcbiAgICB0aGlzLnRyYW5zYWN0aW9uID0gbmV3IFRyYW5zYWN0aW9uKHRyYW5zYWN0aW9uKTtcbiAgfVxuXG4gIFVwZ3JhZGVEQi5wcm90b3R5cGUuY3JlYXRlT2JqZWN0U3RvcmUgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gbmV3IE9iamVjdFN0b3JlKHRoaXMuX2RiLmNyZWF0ZU9iamVjdFN0b3JlLmFwcGx5KHRoaXMuX2RiLCBhcmd1bWVudHMpKTtcbiAgfTtcblxuICBwcm94eVByb3BlcnRpZXMoVXBncmFkZURCLCAnX2RiJywgW1xuICAgICduYW1lJyxcbiAgICAndmVyc2lvbicsXG4gICAgJ29iamVjdFN0b3JlTmFtZXMnXG4gIF0pO1xuXG4gIHByb3h5TWV0aG9kcyhVcGdyYWRlREIsICdfZGInLCBJREJEYXRhYmFzZSwgW1xuICAgICdkZWxldGVPYmplY3RTdG9yZScsXG4gICAgJ2Nsb3NlJ1xuICBdKTtcblxuICBmdW5jdGlvbiBEQihkYikge1xuICAgIHRoaXMuX2RiID0gZGI7XG4gIH1cblxuICBEQi5wcm90b3R5cGUudHJhbnNhY3Rpb24gPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gbmV3IFRyYW5zYWN0aW9uKHRoaXMuX2RiLnRyYW5zYWN0aW9uLmFwcGx5KHRoaXMuX2RiLCBhcmd1bWVudHMpKTtcbiAgfTtcblxuICBwcm94eVByb3BlcnRpZXMoREIsICdfZGInLCBbXG4gICAgJ25hbWUnLFxuICAgICd2ZXJzaW9uJyxcbiAgICAnb2JqZWN0U3RvcmVOYW1lcydcbiAgXSk7XG5cbiAgcHJveHlNZXRob2RzKERCLCAnX2RiJywgSURCRGF0YWJhc2UsIFtcbiAgICAnY2xvc2UnXG4gIF0pO1xuXG4gIC8vIEFkZCBjdXJzb3IgaXRlcmF0b3JzXG4gIC8vIFRPRE86IHJlbW92ZSB0aGlzIG9uY2UgYnJvd3NlcnMgZG8gdGhlIHJpZ2h0IHRoaW5nIHdpdGggcHJvbWlzZXNcbiAgWydvcGVuQ3Vyc29yJywgJ29wZW5LZXlDdXJzb3InXS5mb3JFYWNoKGZ1bmN0aW9uKGZ1bmNOYW1lKSB7XG4gICAgW09iamVjdFN0b3JlLCBJbmRleF0uZm9yRWFjaChmdW5jdGlvbihDb25zdHJ1Y3Rvcikge1xuICAgICAgQ29uc3RydWN0b3IucHJvdG90eXBlW2Z1bmNOYW1lLnJlcGxhY2UoJ29wZW4nLCAnaXRlcmF0ZScpXSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgYXJncyA9IHRvQXJyYXkoYXJndW1lbnRzKTtcbiAgICAgICAgdmFyIGNhbGxiYWNrID0gYXJnc1thcmdzLmxlbmd0aCAtIDFdO1xuICAgICAgICB2YXIgbmF0aXZlT2JqZWN0ID0gdGhpcy5fc3RvcmUgfHwgdGhpcy5faW5kZXg7XG4gICAgICAgIHZhciByZXF1ZXN0ID0gbmF0aXZlT2JqZWN0W2Z1bmNOYW1lXS5hcHBseShuYXRpdmVPYmplY3QsIGFyZ3Muc2xpY2UoMCwgLTEpKTtcbiAgICAgICAgcmVxdWVzdC5vbnN1Y2Nlc3MgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICBjYWxsYmFjayhyZXF1ZXN0LnJlc3VsdCk7XG4gICAgICAgIH07XG4gICAgICB9O1xuICAgIH0pO1xuICB9KTtcblxuICAvLyBwb2x5ZmlsbCBnZXRBbGxcbiAgW0luZGV4LCBPYmplY3RTdG9yZV0uZm9yRWFjaChmdW5jdGlvbihDb25zdHJ1Y3Rvcikge1xuICAgIGlmIChDb25zdHJ1Y3Rvci5wcm90b3R5cGUuZ2V0QWxsKSByZXR1cm47XG4gICAgQ29uc3RydWN0b3IucHJvdG90eXBlLmdldEFsbCA9IGZ1bmN0aW9uKHF1ZXJ5LCBjb3VudCkge1xuICAgICAgdmFyIGluc3RhbmNlID0gdGhpcztcbiAgICAgIHZhciBpdGVtcyA9IFtdO1xuXG4gICAgICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24ocmVzb2x2ZSkge1xuICAgICAgICBpbnN0YW5jZS5pdGVyYXRlQ3Vyc29yKHF1ZXJ5LCBmdW5jdGlvbihjdXJzb3IpIHtcbiAgICAgICAgICBpZiAoIWN1cnNvcikge1xuICAgICAgICAgICAgcmVzb2x2ZShpdGVtcyk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgfVxuICAgICAgICAgIGl0ZW1zLnB1c2goY3Vyc29yLnZhbHVlKTtcblxuICAgICAgICAgIGlmIChjb3VudCAhPT0gdW5kZWZpbmVkICYmIGl0ZW1zLmxlbmd0aCA9PSBjb3VudCkge1xuICAgICAgICAgICAgcmVzb2x2ZShpdGVtcyk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgfVxuICAgICAgICAgIGN1cnNvci5jb250aW51ZSgpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH07XG4gIH0pO1xuXG4gIHZhciBleHAgPSB7XG4gICAgb3BlbjogZnVuY3Rpb24obmFtZSwgdmVyc2lvbiwgdXBncmFkZUNhbGxiYWNrKSB7XG4gICAgICB2YXIgcCA9IHByb21pc2lmeVJlcXVlc3RDYWxsKGluZGV4ZWREQiwgJ29wZW4nLCBbbmFtZSwgdmVyc2lvbl0pO1xuICAgICAgdmFyIHJlcXVlc3QgPSBwLnJlcXVlc3Q7XG5cbiAgICAgIHJlcXVlc3Qub251cGdyYWRlbmVlZGVkID0gZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgaWYgKHVwZ3JhZGVDYWxsYmFjaykge1xuICAgICAgICAgIHVwZ3JhZGVDYWxsYmFjayhuZXcgVXBncmFkZURCKHJlcXVlc3QucmVzdWx0LCBldmVudC5vbGRWZXJzaW9uLCByZXF1ZXN0LnRyYW5zYWN0aW9uKSk7XG4gICAgICAgIH1cbiAgICAgIH07XG5cbiAgICAgIHJldHVybiBwLnRoZW4oZnVuY3Rpb24oZGIpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBEQihkYik7XG4gICAgICB9KTtcbiAgICB9LFxuICAgIGRlbGV0ZTogZnVuY3Rpb24obmFtZSkge1xuICAgICAgcmV0dXJuIHByb21pc2lmeVJlcXVlc3RDYWxsKGluZGV4ZWREQiwgJ2RlbGV0ZURhdGFiYXNlJywgW25hbWVdKTtcbiAgICB9XG4gIH07XG5cbiAgaWYgKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgbW9kdWxlLmV4cG9ydHMgPSBleHA7XG4gIH1cbiAgZWxzZSB7XG4gICAgc2VsZi5pZGIgPSBleHA7XG4gIH1cbn0oKSk7XG4iLCJpbXBvcnQgaWRiIGZyb20gJ2lkYic7XG5cbi8qKiBcbiAqIFNlcGFyYXRlIGNhY2hlcyBmb3IgdGhlIGpwZyBpbWFnZXMgYW5kIGFsbCB0aGUgb3RoZXIgY29udGVudCBcbiAqL1xudmFyIENBQ0hFX1NUQVRJQyA9ICdyZXN0YXVyYW50LXJldmlld3Mtc3RhdGljLXYxJztcbnZhciBDQUNIRV9JTUFHRVMgPSAncmVzdGF1cmFudC1yZXZpZXdzLWltYWdlcy12MSc7XG5jb25zdCBvZmZsaW5lUGFnZSA9ICcuLzQwNC5odG1sJztcbnZhciBkYlByb21pc2U7XG5cbi8qKiBcbiAqIEZldGNoIGFuZCBjYWNoZSBpbWFnZSByZXF1ZXN0IFxuICovXG5mdW5jdGlvbiBjYWNoZUltYWdlcyhyZXF1ZXN0KSB7XG4gIFxuICAvLyBSZW1vdmUgc2l6ZS1yZWxhdGVkIGluZm8gZnJvbSBpbWFnZSBuYW1lIFxuICB2YXIgdXJsVG9GZXRjaCA9IHJlcXVlc3QudXJsLnNsaWNlKDAsIHJlcXVlc3QudXJsLmluZGV4T2YoJy0nKSk7XG4gICBcbiAgXG4gIHJldHVybiBjYWNoZXMub3BlbihDQUNIRV9JTUFHRVMpLnRoZW4oY2FjaGUgPT4geyAgXG4gICAgcmV0dXJuIGNhY2hlLm1hdGNoKHVybFRvRmV0Y2gpLnRoZW4ocmVzcG9uc2UgPT4ge1xuICBcbiAgICAgIC8vIENhY2hlIGhpdCAtIHJldHVybiByZXNwb25zZSBlbHNlIGZldGNoXG4gICAgICAvLyBXZSBjbG9uZSB0aGUgcmVxdWVzdCBiZWNhdXNlIGl0J3MgYSBzdHJlYW0gYW5kIGNhbiBiZSBjb25zdW1lZCBvbmx5IG9uY2VcbiAgICAgIHZhciBuZXR3b3JrRmV0Y2ggPSBmZXRjaChyZXF1ZXN0LmNsb25lKCkpLnRoZW4oKG5ldHdvcmtSZXNwb25zZSkgPT4ge1xuICAgICAgICAvLyBDaGVjayBpZiB3ZSByZWNlaXZlZCBhbiBpbnZhbGlkIHJlc3BvbnNlXG4gICAgICAgIGlmKG5ldHdvcmtSZXNwb25zZS5zdGF0dXMgPT0gNDA0KSByZXR1cm47XG5cbiAgICAgICAgLy8gV2UgY2xvbmUgdGhlIHJlc3BvbnNlIGJlY2F1c2UgaXQncyBhIHN0cmVhbSBhbmQgY2FuIGJlIGNvbnN1bWVkIG9ubHkgb25jZVxuICAgICAgICBjYWNoZS5wdXQodXJsVG9GZXRjaCwgbmV0d29ya1Jlc3BvbnNlLmNsb25lKCkpO1xuXG4gICAgICAgIHJldHVybiBuZXR3b3JrUmVzcG9uc2U7XG5cbiAgICAgIH0sIChyZWplY3RlZCkgPT4ge1xuICAgICAgICByZXR1cm4gcmVzcG9uc2U7XG4gICAgICB9KS5jYXRjaCgoKSA9PiB7XG4gICAgICAgIHJldHVybiByZXNwb25zZTtcbiAgICAgIH0pO1xuXG4gICAgICAvLyAvL2lmIGFjY2VzcyB0byBuZXR3b3JrIGlzIGdvb2Qgd2Ugd2FudCB0aGUgYmVzdCBxdWFsaXR5IGltYWdlXG4gICAgICByZXR1cm4gbmV0d29ya0ZldGNoO1xuXG4gICAgfSkuY2F0Y2goKCkgPT4geyBcblxuICAgICAgcmV0dXJuIGZldGNoKHJlcXVlc3QuY2xvbmUoKSkudGhlbigobmV0d29ya1Jlc3BvbnNlKSA9PiB7XG4gICAgICAgIC8vIENoZWNrIGlmIHdlIHJlY2VpdmVkIGFuIGludmFsaWQgcmVzcG9uc2VcbiAgICAgICAgaWYobmV0d29ya1Jlc3BvbnNlLnN0YXR1cyA9PSA0MDQpIHJldHVybjtcblxuICAgICAgICAvLyBXZSBjbG9uZSB0aGUgcmVzcG9uc2UgYmVjYXVzZSBpdCdzIGEgc3RyZWFtIGFuZCBjYW4gYmUgY29uc3VtZWQgb25seSBvbmNlXG4gICAgICAgIGNhY2hlLnB1dCh1cmxUb0ZldGNoLCBuZXR3b3JrUmVzcG9uc2UuY2xvbmUoKSk7XG5cbiAgICAgICAgcmV0dXJuIG5ldHdvcmtSZXNwb25zZTtcblxuICAgICAgfSwgKHJlamVjdGVkKSA9PiB7XG4gICAgICAgIHJldHVybiBjYWNoZXMubWF0Y2gob2ZmbGluZVBhZ2UpOyBcbiAgICAgIH0pLmNhdGNoKCgpID0+IHtcbiAgICAgICAgcmV0dXJuIGNhY2hlcy5tYXRjaChvZmZsaW5lUGFnZSk7IFxuICAgICAgfSk7XG4gICAgfSlcbiAgfSk7XG59XG5cbi8qKiBcbiAqIEZldGNoIGFuZCBjYWNoZSBzdGF0aWMgY29udGVudCBhbmQgZ29vZ2xlIG1hcCByZWxhdGVkIGNvbnRlbnQgXG4gKi9cbiBmdW5jdGlvbiBjYWNoZVN0YXRpY0NvbnRlbnQocmVxdWVzdCkge1xuICAgIFxuICByZXR1cm4gY2FjaGVzLm9wZW4oQ0FDSEVfU1RBVElDKS50aGVuKGNhY2hlID0+IHtcbiAgICByZXR1cm4gY2FjaGUubWF0Y2gocmVxdWVzdCkudGhlbihyZXNwb25zZSA9PiB7XG4gICAgXG4gICAgICAgIC8vIENhY2hlIGhpdCAtIHJldHVybiByZXNwb25zZSBlbHNlIGZldGNoXG4gICAgICAgIC8vIFdlIGNsb25lIHRoZSByZXF1ZXN0IGJlY2F1c2UgaXQncyBhIHN0cmVhbSBhbmQgY2FuIGJlIGNvbnN1bWVkIG9ubHkgb25jZVxuICAgICAgcmV0dXJuIHJlc3BvbnNlIHx8IGZldGNoKHJlcXVlc3QuY2xvbmUoKSkudGhlbihuZXR3b3JrUmVzcG9uc2UgPT4ge1xuICAgICAgICAvLyBDaGVjayBpZiB3ZSByZWNlaXZlZCBhbiBpbnZhbGlkIHJlc3BvbnNlXG4gICAgICAgIGlmKG5ldHdvcmtSZXNwb25zZS5zdGF0dXMgPT0gNDA0KSByZXR1cm47XG4gICAgXG4gICAgICAgIC8vIFdlIGNsb25lIHRoZSByZXNwb25zZSBiZWNhdXNlIGl0J3MgYSBzdHJlYW0gYW5kIGNhbiBiZSBjb25zdW1lZCBvbmx5IG9uY2VcbiAgICAgICAgY2FjaGUucHV0KHJlcXVlc3QsIG5ldHdvcmtSZXNwb25zZS5jbG9uZSgpKTtcbiAgICAgICAgcmV0dXJuIG5ldHdvcmtSZXNwb25zZTtcblxuICAgICAgfSkuY2F0Y2goKCkgPT4geyBcbiAgICAgICAgcmV0dXJuIGNhY2hlcy5tYXRjaChvZmZsaW5lUGFnZSk7IFxuICAgICAgfSlcbiAgICB9KTtcbiAgfSk7XG59XG5cbi8qKlxuICogRmV0Y2ggZnJvbSBuZXR3b3JrIGFuZCBzYXZlIGluIGluZGV4ZWQgREJcbiAqL1xuZnVuY3Rpb24gZmV0Y2hGcm9tTmV0d29ya0FuZENhY2hlUmVzdGF1cmFudHNJbkluZGV4ZWREQihyZXF1ZXN0KSB7XG5cbiAgdmFyIHBhdGhTbGljZXMgPSByZXF1ZXN0LnVybC5zcGxpdChcIi9cIik7XG4gIHZhciByZXN0YXVyYW50SWQgPSBwYXJzZUludChwYXRoU2xpY2VzW3BhdGhTbGljZXMubGVuZ3RoIC0gMV0pIHx8IDA7XG5cbiAgcmV0dXJuIGZldGNoKHJlcXVlc3QpLnRoZW4obmV0d29ya1Jlc3BvbnNlID0+IHtcblxuICAgIG5ldHdvcmtSZXNwb25zZS5jbG9uZSgpLmpzb24oKS50aGVuKGpzb24gPT4ge1xuXG4gICAgICBpZighZGJQcm9taXNlKSByZXR1cm47XG5cbiAgICAgIGRiUHJvbWlzZS50aGVuKGRiID0+IHtcbiAgICAgICAgICAgIFxuICAgICAgICBpZighZGIpIHJldHVybjtcblxuICAgICAgICB2YXIgdHggPSBkYi50cmFuc2FjdGlvbigncmVzdGF1cmFudHMnLCAncmVhZHdyaXRlJyk7XG4gICAgICAgIHZhciBzdG9yZSA9IHR4Lm9iamVjdFN0b3JlKCdyZXN0YXVyYW50cycpO1xuXG4gICAgICAgIC8vIGlmIHdlIHJlZmVyIHRvIGFsbCBkYXRhXG4gICAgICAgIGlmKCFyZXN0YXVyYW50SWQpe1xuXG4gICAgICAgICAganNvbi5mb3JFYWNoKHJlc3RhdXJhbnQgPT4ge1xuICAgICAgICAgICAgc3RvcmUucHV0KHJlc3RhdXJhbnQsIHJlc3RhdXJhbnQuaWQpO1xuICAgICAgICAgIH0pO1xuICAgICAgICBcbiAgICAgICAgfSBlbHNlIHsgLy8gaWYgd2UgcmVmZXIgdG8gcGVyIHJlc3RhdXJhbnQgZGF0YSBcbiAgICAgICAgXG4gICAgICAgICAgIHN0b3JlLnB1dChqc29uLCBqc29uLmlkKTtcbiAgICAgICAgXG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH0pXG5cbiAgICByZXR1cm4gbmV0d29ya1Jlc3BvbnNlO1xuICB9KTtcbn1cblxuLyoqXG4gKiBTZWFyY2ggaW4gaW5kZXhlZCBEQiBhbmQgaWYgbm8gcmVzdWx0IGZldGNoIGZyb20gbmV0d29yayBcbiAqL1xuZnVuY3Rpb24gZ2V0RGF0YShyZXF1ZXN0KSB7XG5cbiAgdmFyIHBhdGhTbGljZXMgPSByZXF1ZXN0LmNsb25lKCkudXJsLnNwbGl0KFwiL1wiKTtcbiAgdmFyIHJlc3RhdXJhbnRJZCA9IHBhcnNlSW50KHBhdGhTbGljZXNbcGF0aFNsaWNlcy5sZW5ndGggLSAxXSkgfHwgMDtcbiAgdmFyIGRhdGFQcm9taXNlO1xuXG4gIC8vIGlmIG5vdCBpbmRleGVkIGRiIGZ1bmN0aW9uYWxpdHkgZmV0Y2ggZnJvbSBuZXR3b3JrIFxuICBpZighZGJQcm9taXNlKSByZXR1cm4gZmV0Y2hGcm9tTmV0d29ya0FuZENhY2hlUmVzdGF1cmFudHNJbkluZGV4ZWREQihyZXF1ZXN0LmNsb25lKCkpO1xuXG4gIHJldHVybiBkYlByb21pc2UudGhlbihkYiA9PiB7XG4gICAgXG4gICAgaWYoIWRiKSByZXR1cm47XG5cbiAgICB2YXIgc3RvcmUgPSBkYi50cmFuc2FjdGlvbigncmVzdGF1cmFudHMnKS5vYmplY3RTdG9yZSgncmVzdGF1cmFudHMnKTtcblxuICAgIC8vIGlmIGFsbCBkYXRhIGFyZSByZXF1ZXN0ZWRcbiAgICBpZighcmVzdGF1cmFudElkKSB7XG5cbiAgICAgIGRhdGFQcm9taXNlID0gc3RvcmUuZ2V0QWxsKCk7XG5cbiAgICB9IGVsc2UgeyAvLyBpZiBwZXIgcmVzdGF1cmFudCBkYXRhIGFyZSByZXF1ZXN0ZWRcblxuICAgICAgZGF0YVByb21pc2UgPSBzdG9yZS5nZXQocmVzdGF1cmFudElkKTtcbiAgICBcbiAgICB9XG4gICAgXG4gICAgaWYoZGF0YVByb21pc2UpIHtcblxuICAgICAgcmV0dXJuIGRhdGFQcm9taXNlLnRoZW4oZGF0YSA9PiB7ICBcbiAgICAgIFxuICAgICAgICAvLyBpZiBkYXRhIGZvdW5kIGluIGluZGV4ZWQgZGIgcmV0dXJuIHRoZW1cbiAgICAgICAgaWYoSlNPTi5zdHJpbmdpZnkoZGF0YSkgIT09IEpTT04uc3RyaW5naWZ5KFtdKSAmJiBkYXRhICE9PSB1bmRlZmluZWQpICB7IFxuXG4gICAgICAgICAgY29uc29sZS5sb2coJ0ZvdW5kIGNhY2hlZCcpO1xuICAgICAgICAgIHJldHVybiBuZXcgUmVzcG9uc2UoSlNPTi5zdHJpbmdpZnkoZGF0YSkpOyBcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnNvbGUubG9nKCdGZXRjaCBmcm9tIG5ldHdvcmsnKTtcbiAgICAgICAgLy8gaWYgZGF0YSBub3QgY2FjaGVkIHRoZW4gZmV0Y2ggZnJvbSBuZXR3b3JrIFxuICAgICAgICByZXR1cm4gZmV0Y2hGcm9tTmV0d29ya0FuZENhY2hlUmVzdGF1cmFudHNJbkluZGV4ZWREQihyZXF1ZXN0KTtcbiAgICAgICAgXG4gICAgICB9KTtcbiAgICB9ICAgIFxuICB9KTtcbn1cblxuLyoqXG4gKiBDcmVhdGUgYW4gaW5kZXhlZCBkYiBvZiBrZXl2YWwgdHlwZSBuYW1lZCBgcmVzdGF1cmFudHNgXG4gKi9cbmZ1bmN0aW9uIGNyZWF0ZURCKCkge1xuICByZXR1cm4gaWRiLm9wZW4oJ3Jlc3RhdXJhbnRzJywgMSwgdXBncmFkZURCID0+IHtcbiAgICB2YXIgc3RvcmUgPSB1cGdyYWRlREIuY3JlYXRlT2JqZWN0U3RvcmUoJ3Jlc3RhdXJhbnRzJywge1xuICAgICAga2V5cGF0aDogJ2lkJ1xuICAgIH0pO1xuICB9KTtcbn1cblxuLyoqIFxuICogT3BlbiBjYWNoZXMgb24gaW5zdGFsbCBvZiBzdyBcbiAqL1xuc2VsZi5hZGRFdmVudExpc3RlbmVyKCdpbnN0YWxsJywgZXZlbnQgPT4ge1xuICAvLyBPcGVuIGNhY2hlIGZvciBzdGF0aWMgY29udGVudCBhbmQgY2FjaGUgNDA0IHBhZ2VcblxuICAgIHZhciBvcGVuU3RhdGljQ2FjaGVQcm9taXNlID0gY2FjaGVzLm9wZW4oQ0FDSEVfU1RBVElDKS50aGVuKGNhY2hlID0+IHtcbiAgICAgIGNhY2hlLmFkZEFsbChbb2ZmbGluZVBhZ2VdKTtcbiAgICAgIGNvbnNvbGUubG9nKGBDYWNoZSAke0NBQ0hFX1NUQVRJQ30gb3BlbmVkYCk7XG4gICAgfSk7XG5cbiAgICB2YXIgb3BlbkltYWdlQ2FjaGVQcm9taXNlID0gY2FjaGVzLm9wZW4oQ0FDSEVfSU1BR0VTKS50aGVuKGNhY2hlID0+IHtcbiAgICAgIGNvbnNvbGUubG9nKGBDYWNoZSAke0NBQ0hFX0lNQUdFU30gb3BlbmVkYCk7XG4gICAgfSlcblxuICAgIGRiUHJvbWlzZSA9IGNyZWF0ZURCKCk7XG5cbiAgICBldmVudC53YWl0VW50aWwoXG4gICAgICBQcm9taXNlLmFsbChbb3BlblN0YXRpY0NhY2hlUHJvbWlzZSwgb3BlbkltYWdlQ2FjaGVQcm9taXNlXSlcbiAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgcmV0dXJuIHNlbGYuc2tpcFdhaXRpbmcoKVxuICAgICAgfSlcbiAgICApO1xufSk7XG5cblxuLyoqIFxuICogT3BlbiBpbmRleCBkYiBvbiBhY3RpdmF0ZVxuICovXG5zZWxmLmFkZEV2ZW50TGlzdGVuZXIoJ2FjdGl2YXRlJywgZXZlbnQgPT4ge1xuXG4gIGRiUHJvbWlzZSA9IGNyZWF0ZURCKCk7XG4gIGV2ZW50LndhaXRVbnRpbChkYlByb21pc2UpO1xuXG59KTtcblxuLyoqIFxuICogSGFuZGxlIGZldGNoIFxuICovXG5zZWxmLmFkZEV2ZW50TGlzdGVuZXIoJ2ZldGNoJywgZXZlbnQgPT4ge1xuICAvLyBoYW5kbGUgcmVxdWVzdCBhY2NvcmRpbmcgdG8gaXRzIHR5cGVcbiAgaWYoZXZlbnQucmVxdWVzdC51cmwuZW5kc1dpdGgoJy5qcGcnKSkge1xuICAgIGV2ZW50LnJlc3BvbmRXaXRoKGNhY2hlSW1hZ2VzKGV2ZW50LnJlcXVlc3QpKTsgIFxuICAgIHJldHVybjtcbiAgfSBlbHNlIGlmIChldmVudC5yZXF1ZXN0LnVybC5pbmNsdWRlcygncmVzdGF1cmFudHMnKSkge1xuICAgIGV2ZW50LnJlc3BvbmRXaXRoKGdldERhdGEoZXZlbnQucmVxdWVzdCkpO1xuICAgIHJldHVybjtcbiAgfSBlbHNlIHtcbiAgICBldmVudC5yZXNwb25kV2l0aChjYWNoZVN0YXRpY0NvbnRlbnQoZXZlbnQucmVxdWVzdCkpO1xuICAgIHJldHVybjtcbiAgfVxufSk7Il19
