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
      });

      //if access to network is good we want the best quality image
      return networkFetch || response;
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

        // if we rrefer to all data
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
        // if not fetch from network
        return fetchFromNetworkAndCacheRestaurantsInIndexedDB(request);
      });
    }
  });
}

/**
 * Create an indexed db of keyval type named `restaurants`
 */
function createDB() {
  dbPromise = _idb2['default'].open('restaurants', 1, function (upgradeDB) {
    var store = upgradeDB.createObjectStore('restaurants', {
      keypath: 'id'
    });
  });
}

/** 
 * Open caches on install of sw 
 */
self.addEventListener('install', function (event) {
  // Open cache for static content
  event.waitUntil(caches.open(CACHE_STATIC).then(function (cache) {
    console.log('Cache ' + CACHE_STATIC + ' opened');
  }));
  // Open cache for images content
  event.waitUntil(caches.open(CACHE_IMAGES).then(function (cache) {
    console.log('Cache ' + CACHE_IMAGES + ' opened');
  }));
  //create indexed db
  event.waitUntil(createDB());
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
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvaWRiL2xpYi9pZGIuanMiLCJDOi91ZGFjaXR5L2ZpcnN0L213cy1yZXN0YXVyYW50LXN0YWdlLTEvc3JjL3N3LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7O21CQ3RUZ0IsS0FBSzs7Ozs7OztBQUtyQixJQUFJLFlBQVksR0FBRyw4QkFBOEIsQ0FBQztBQUNsRCxJQUFJLFlB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Z0IsQ0FBQyxPQUFPLEVBQUUsVUFBQSxLQUFLLEVBQUk7O0FBRXRDLE1BQUcsS0FBSyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxFQUFFO0FBQ3JDLFNBQUssQ0FBQyxXQUFXLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO0FBQzlDLFdBQU87R0FDUixNQUFNLElBQUksS0FBSyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLGFBQWEsQ0FBQyxFQUFFO0FBQ3BELFNBQUssQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO0FBQzFDLFdBQU87R0FDUixNQUNJO0FBQ0gsU0FBSyxDQUFDLFdBQVcsQ0FBQyxrQkFBa0IsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQztBQUNyRCxXQUFPO0dBQ1I7Q0FDRixDQUFDLENBQUMiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiJ3VzZSBzdHJpY3QnO1xyXG5cclxuKGZ1bmN0aW9uKCkge1xyXG4gIGZ1bmN0aW9uIHRvQXJyYXkoYXJyKSB7XHJcbiAgICByZXR1cm4gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJyKTtcclxuICB9XHJcblxyXG4gIGZ1bmN0aW9uIHByb21pc2lmeVJlcXVlc3QocmVxdWVzdCkge1xyXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCkge1xyXG4gICAgICByZXF1ZXN0Lm9uc3VjY2VzcyA9IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHJlc29sdmUocmVxdWVzdC5yZXN1bHQpO1xyXG4gICAgICB9O1xyXG5cclxuICAgICAgcmVxdWVzdC5vbmVycm9yID0gZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgcmVqZWN0KHJlcXVlc3QuZXJyb3IpO1xyXG4gICAgICB9O1xyXG4gICAgfSk7XHJcbiAgfVxyXG5cclxuICBmdW5jdGlvbiBwcm9taXNpZnlSZXF1ZXN0Q2FsbChvYmosIG1ldGhvZCwgYXJncykge1xyXG4gICAgdmFyIHJlcXVlc3Q7XHJcbiAgICB2YXIgcCA9IG5ldyBQcm9taXNlKGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCkge1xyXG4gICAgICByZXF1ZXN0ID0gb2JqW21ldGhvZF0uYXBwbHkob2JqLCBhcmdzKTtcclxuICAgICAgcHJvbWlzaWZ5UmVxdWVzdChyZXF1ZXN0KS50aGVuKHJlc29sdmUsIHJlamVjdCk7XHJcbiAgICB9KTtcclxuXHJcbiAgICBwLnJlcXVlc3QgPSByZXF1ZXN0O1xyXG4gICAgcmV0dXJuIHA7XHJcbiAgfVxyXG4gIFxyXG4gIGZ1bmN0aW9uIHByb21pc2lmeUN1cnNvclJlcXVlc3RDYWxsKG9iaiwgbWV0aG9kLCBhcmdzKSB7XHJcbiAgICB2YXIgcCA9IHByb21pc2lmeVJlcXVlc3RDYWxsKG9iaiwgbWV0aG9kLCBhcmdzKTtcclxuICAgIHJldHVybiBwLnRoZW4oZnVuY3Rpb24odmFsdWUpIHtcclxuICAgICAgaWYgKCF2YWx1ZSkgcmV0dXJuO1xyXG4gICAgICByZXR1cm4gbmV3IEN1cnNvcih2YWx1ZSwgcC5yZXF1ZXN0KTtcclxuICAgIH0pO1xyXG4gIH1cclxuXHJcbiAgZnVuY3Rpb24gcHJveHlQcm9wZXJ0aWVzKFByb3h5Q2xhc3MsIHRhcmdldFByb3AsIHByb3BlcnRpZXMpIHtcclxuICAgIHByb3BlcnRpZXMuZm9yRWFjaChmdW5jdGlvbihwcm9wKSB7XHJcbiAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShQcm94eUNsYXNzLnByb3RvdHlwZSwgcHJvcCwge1xyXG4gICAgICAgIGdldDogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICByZXR1cm4gdGhpc1t0YXJnZXRQcm9wXVtwcm9wXTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIHNldDogZnVuY3Rpb24odmFsKSB7XHJcbiAgICAgICAgICB0aGlzW3RhcmdldFByb3BdW3Byb3BdID0gdmFsO1xyXG4gICAgICAgIH1cclxuICAgICAgfSk7XHJcbiAgICB9KTtcclxuICB9XHJcblxyXG4gIGZ1bmN0aW9uIHByb3h5UmVxdWVzdE1ldGhvZHMoUHJveHlDbGFzcywgdGFyZ2V0UHJvcCwgQ29uc3RydWN0b3IsIHByb3BlcnRpZXMpIHtcclxuICAgIHByb3BlcnRpZXMuZm9yRWFjaChmdW5jdGlvbihwcm9wKSB7XHJcbiAgICAgIGlmICghKHByb3AgaW4gQ29uc3RydWN0b3IucHJvdG90eXBlKSkgcmV0dXJuO1xyXG4gICAgICBQcm94eUNsYXNzLnByb3RvdHlwZVtwcm9wXSA9IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHJldHVybiBwcm9taXNpZnlSZXF1ZXN0Q2FsbCh0aGlzW3RhcmdldFByb3BdLCBwcm9wLCBhcmd1bWVudHMpO1xyXG4gICAgICB9O1xyXG4gICAgfSk7XHJcbiAgfVxyXG5cclxuICBmdW5jdGlvbiBwcm94eU1ldGhvZHMoUHJveHlDbGFzcywgdGFyZ2V0UHJvcCwgQ29uc3RydWN0b3IsIHByb3BlcnRpZXMpIHtcclxuICAgIHByb3BlcnRpZXMuZm9yRWFjaChmdW5jdGlvbihwcm9wKSB7XHJcbiAgICAgIGlmICghKHByb3AgaW4gQ29uc3RydWN0b3IucHJvdG90eXBlKSkgcmV0dXJuO1xyXG4gICAgICBQcm94eUNsYXNzLnByb3RvdHlwZVtwcm9wXSA9IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzW3RhcmdldFByb3BdW3Byb3BdLmFwcGx5KHRoaXNbdGFyZ2V0UHJvcF0sIGFyZ3VtZW50cyk7XHJcbiAgICAgIH07XHJcbiAgICB9KTtcclxuICB9XHJcblxyXG4gIGZ1bmN0aW9uIHByb3h5Q3Vyc29yUmVxdWVzdE1ldGhvZHMoUHJveHlDbGFzcywgdGFyZ2V0UHJvcCwgQ29uc3RydWN0b3IsIHByb3BlcnRpZXMpIHtcclxuICAgIHByb3BlcnRpZXMuZm9yRWFjaChmdW5jdGlvbihwcm9wKSB7XHJcbiAgICAgIGlmICghKHByb3AgaW4gQ29uc3RydWN0b3IucHJvdG90eXBlKSkgcmV0dXJuO1xyXG4gICAgICBQcm94eUNsYXNzLnByb3RvdHlwZVtwcm9wXSA9IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHJldHVybiBwcm9taXNpZnlDdXJzb3JSZXF1ZXN0Q2FsbCh0aGlzW3RhcmdldFByb3BdLCBwcm9wLCBhcmd1bWVudHMpO1xyXG4gICAgICB9O1xyXG4gICAgfSk7XHJcbiAgfVxyXG5cclxuICBmdW5jdGlvbiBJbmRleChpbmRleCkge1xyXG4gICAgdGhpcy5faW5kZXggPSBpbmRleDtcclxuICB9XHJcblxyXG4gIHByb3h5UHJvcGVydGllcyhJbmRleCwgJ19pbmRleCcsIFtcclxuICAgICduYW1lJyxcclxuICAgICdrZXlQYXRoJyxcclxuICAgICdtdWx0aUVudHJ5JyxcclxuICAgICd1bmlxdWUnXHJcbiAgXSk7XHJcblxyXG4gIHByb3h5UmVxdWVzdE1ldGhvZHMoSW5kZXgsICdfaW5kZXgnLCBJREJJbmRleCwgW1xyXG4gICAgJ2dldCcsXHJcbiAgICAnZ2V0S2V5JyxcclxuICAgICdnZXRBbGwnLFxyXG4gICAgJ2dldEFsbEtleXMnLFxyXG4gICAgJ2NvdW50J1xyXG4gIF0pO1xyXG5cclxuICBwcm94eUN1cnNvclJlcXVlc3RNZXRob2RzKEluZGV4LCAnX2luZGV4JywgSURCSW5kZXgsIFtcclxuICAgICdvcGVuQ3Vyc29yJyxcclxuICAgICdvcGVuS2V5Q3Vyc29yJ1xyXG4gIF0pO1xyXG5cclxuICBmdW5jdGlvbiBDdXJzb3IoY3Vyc29yLCByZXF1ZXN0KSB7XHJcbiAgICB0aGlzLl9jdXJzb3IgPSBjdXJzb3I7XHJcbiAgICB0aGlzLl9yZXF1ZXN0ID0gcmVxdWVzdDtcclxuICB9XHJcblxyXG4gIHByb3h5UHJvcGVydGllcyhDdXJzb3IsICdfY3Vyc29yJywgW1xyXG4gICAgJ2RpcmVjdGlvbicsXHJcbiAgICAna2V5JyxcclxuICAgICdwcmltYXJ5S2V5JyxcclxuICAgICd2YWx1ZSdcclxuICBdKTtcclxuXHJcbiAgcHJveHlSZXF1ZXN0TWV0aG9kcyhDdXJzb3IsICdfY3Vyc29yJywgSURCQ3Vyc29yLCBbXHJcbiAgICAndXBkYXRlJyxcclxuICAgICdkZWxldGUnXHJcbiAgXSk7XHJcblxyXG4gIC8vIHByb3h5ICduZXh0JyBtZXRob2RzXHJcbiAgWydhZHZhbmNlJywgJ2NvbnRpbnVlJywgJ2NvbnRpbnVlUHJpbWFyeUtleSddLmZvckVhY2goZnVuY3Rpb24obWV0aG9kTmFtZSkge1xyXG4gICAgaWYgKCEobWV0aG9kTmFtZSBpbiBJREJDdXJzb3IucHJvdG90eXBlKSkgcmV0dXJuO1xyXG4gICAgQ3Vyc29yLnByb3RvdHlwZVttZXRob2ROYW1lXSA9IGZ1bmN0aW9uKCkge1xyXG4gICAgICB2YXIgY3Vyc29yID0gdGhpcztcclxuICAgICAgdmFyIGFyZ3MgPSBhcmd1bWVudHM7XHJcbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKS50aGVuKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIGN1cnNvci5fY3Vyc29yW21ldGhvZE5hbWVdLmFwcGx5KGN1cnNvci5fY3Vyc29yLCBhcmdzKTtcclxuICAgICAgICByZXR1cm4gcHJvbWlzaWZ5UmVxdWVzdChjdXJzb3IuX3JlcXVlc3QpLnRoZW4oZnVuY3Rpb24odmFsdWUpIHtcclxuICAgICAgICAgIGlmICghdmFsdWUpIHJldHVybjtcclxuICAgICAgICAgIHJldHVybiBuZXcgQ3Vyc29yKHZhbHVlLCBjdXJzb3IuX3JlcXVlc3QpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICB9KTtcclxuICAgIH07XHJcbiAgfSk7XHJcblxyXG4gIGZ1bmN0aW9uIE9iamVjdFN0b3JlKHN0b3JlKSB7XHJcbiAgICB0aGlzLl9zdG9yZSA9IHN0b3JlO1xyXG4gIH1cclxuXHJcbiAgT2JqZWN0U3RvcmUucHJvdG90eXBlLmNyZWF0ZUluZGV4ID0gZnVuY3Rpb24oKSB7XHJcbiAgICByZXR1cm4gbmV3IEluZGV4KHRoaXMuX3N0b3JlLmNyZWF0ZUluZGV4LmFwcGx5KHRoaXMuX3N0b3JlLCBhcmd1bWVudHMpKTtcclxuICB9O1xyXG5cclxuICBPYmplY3RTdG9yZS5wcm90b3R5cGUuaW5kZXggPSBmdW5jdGlvbigpIHtcclxuICAgIHJldHVybiBuZXcgSW5kZXgodGhpcy5fc3RvcmUuaW5kZXguYXBwbHkodGhpcy5fc3RvcmUsIGFyZ3VtZW50cykpO1xyXG4gIH07XHJcblxyXG4gIHByb3h5UHJvcGVydGllcyhPYmplY3RTdG9yZSwgJ19zdG9yZScsIFtcclxuICAgICduYW1lJyxcclxuICAgICdrZXlQYXRoJyxcclxuICAgICdpbmRleE5hbWVzJyxcclxuICAgICdhdXRvSW5jcmVtZW50J1xyXG4gIF0pO1xyXG5cclxuICBwcm94eVJlcXVlc3RNZXRob2RzKE9iamVjdFN0b3JlLCAnX3N0b3JlJywgSURCT2JqZWN0U3RvcmUsIFtcclxuICAgICdwdXQnLFxyXG4gICAgJ2FkZCcsXHJcbiAgICAnZGVsZXRlJyxcclxuICAgICdjbGVhcicsXHJcbiAgICAnZ2V0JyxcclxuICAgICdnZXRBbGwnLFxyXG4gICAgJ2dldEtleScsXHJcbiAgICAnZ2V0QWxsS2V5cycsXHJcbiAgICAnY291bnQnXHJcbiAgXSk7XHJcblxyXG4gIHByb3h5Q3Vyc29yUmVxdWVzdE1ldGhvZHMoT2JqZWN0U3RvcmUsICdfc3RvcmUnLCBJREJPYmplY3RTdG9yZSwgW1xyXG4gICAgJ29wZW5DdXJzb3InLFxyXG4gICAgJ29wZW5LZXlDdXJzb3InXHJcbiAgXSk7XHJcblxyXG4gIHByb3h5TWV0aG9kcyhPYmplY3RTdG9yZSwgJ19zdG9yZScsIElEQk9iamVjdFN0b3JlLCBbXHJcbiAgICAnZGVsZXRlSW5kZXgnXHJcbiAgXSk7XHJcblxyXG4gIGZ1bmN0aW9uIFRyYW5zYWN0aW9uKGlkYlRyYW5zYWN0aW9uKSB7XHJcbiAgICB0aGlzLl90eCA9IGlkYlRyYW5zYWN0aW9uO1xyXG4gICAgdGhpcy5jb21wbGV0ZSA9IG5ldyBQcm9taXNlKGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCkge1xyXG4gICAgICBpZGJUcmFuc2FjdGlvbi5vbmNvbXBsZXRlID0gZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgcmVzb2x2ZSgpO1xyXG4gICAgICB9O1xyXG4gICAgICBpZGJUcmFuc2FjdGlvbi5vbmVycm9yID0gZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgcmVqZWN0KGlkYlRyYW5zYWN0aW9uLmVycm9yKTtcclxuICAgICAgfTtcclxuICAgICAgaWRiVHJhbnNhY3Rpb24ub25hYm9ydCA9IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHJlamVjdChpZGJUcmFuc2FjdGlvbi5lcnJvcik7XHJcbiAgICAgIH07XHJcbiAgICB9KTtcclxuICB9XHJcblxyXG4gIFRyYW5zYWN0aW9uLnByb3RvdHlwZS5vYmplY3RTdG9yZSA9IGZ1bmN0aW9uKCkge1xyXG4gICAgcmV0dXJuIG5ldyBPYmplY3RTdG9yZSh0aGlzLl90eC5vYmplY3RTdG9yZS5hcHBseSh0aGlzLl90eCwgYXJndW1lbnRzKSk7XHJcbiAgfTtcclxuXHJcbiAgcHJveHlQcm9wZXJ0aWVzKFRyYW5zYWN0aW9uLCAnX3R4JywgW1xyXG4gICAgJ29iamVjdFN0b3JlTmFtZXMnLFxyXG4gICAgJ21vZGUnXHJcbiAgXSk7XHJcblxyXG4gIHByb3h5TWV0aG9kcyhUcmFuc2FjdGlvbiwgJ190eCcsIElEQlRyYW5zYWN0aW9uLCBbXHJcbiAgICAnYWJvcnQnXHJcbiAgXSk7XHJcblxyXG4gIGZ1bmN0aW9uIFVwZ3JhZGVEQihkYiwgb2xkVmVyc2lvbiwgdHJhbnNhY3Rpb24pIHtcclxuICAgIHRoaXMuX2RiID0gZGI7XHJcbiAgICB0aGlzLm9sZFZlcnNpb24gPSBvbGRWZXJzaW9uO1xyXG4gICAgdGhpcy50cmFuc2FjdGlvbiA9IG5ldyBUcmFuc2FjdGlvbih0cmFuc2FjdGlvbik7XHJcbiAgfVxyXG5cclxuICBVcGdyYWRlREIucHJvdG90eXBlLmNyZWF0ZU9iamVjdFN0b3JlID0gZnVuY3Rpb24oKSB7XHJcbiAgICByZXR1cm4gbmV3IE9iamVjdFN0b3JlKHRoaXMuX2RiLmNyZWF0ZU9iamVjdFN0b3JlLmFwcGx5KHRoaXMuX2RiLCBhcmd1bWVudHMpKTtcclxuICB9O1xyXG5cclxuICBwcm94eVByb3BlcnRpZXMoVXBncmFkZURCLCAnX2RiJywgW1xyXG4gICAgJ25hbWUnLFxyXG4gICAgJ3ZlcnNpb24nLFxyXG4gICAgJ29iamVjdFN0b3JlTmFtZXMnXHJcbiAgXSk7XHJcblxyXG4gIHByb3h5TWV0aG9kcyhVcGdyYWRlREIsICdfZGInLCBJREJEYXRhYmFzZSwgW1xyXG4gICAgJ2RlbGV0ZU9iamVjdFN0b3JlJyxcclxuICAgICdjbG9zZSdcclxuICBdKTtcclxuXHJcbiAgZnVuY3Rpb24gREIoZGIpIHtcclxuICAgIHRoaXMuX2RiID0gZGI7XHJcbiAgfVxyXG5cclxuICBEQi5wcm90b3R5cGUudHJhbnNhY3Rpb24gPSBmdW5jdGlvbigpIHtcclxuICAgIHJldHVybiBuZXcgVHJhbnNhY3Rpb24odGhpcy5fZGIudHJhbnNhY3Rpb24uYXBwbHkodGhpcy5fZGIsIGFyZ3VtZW50cykpO1xyXG4gIH07XHJcblxyXG4gIHByb3h5UHJvcGVydGllcyhEQiwgJ19kYicsIFtcclxuICAgICduYW1lJyxcclxuICAgICd2ZXJzaW9uJyxcclxuICAgICdvYmplY3RTdG9yZU5hbWVzJ1xyXG4gIF0pO1xyXG5cclxuICBwcm94eU1ldGhvZHMoREIsICdfZGInLCBJREJEYXRhYmFzZSwgW1xyXG4gICAgJ2Nsb3NlJ1xyXG4gIF0pO1xyXG5cclxuICAvLyBBZGQgY3Vyc29yIGl0ZXJhdG9yc1xyXG4gIC8vIFRPRE86IHJlbW92ZSB0aGlzIG9uY2UgYnJvd3NlcnMgZG8gdGhlIHJpZ2h0IHRoaW5nIHdpdGggcHJvbWlzZXNcclxuICBbJ29wZW5DdXJzb3InLCAnb3BlbktleUN1cnNvciddLmZvckVhY2goZnVuY3Rpb24oZnVuY05hbWUpIHtcclxuICAgIFtPYmplY3RTdG9yZSwgSW5kZXhdLmZvckVhY2goZnVuY3Rpb24oQ29uc3RydWN0b3IpIHtcclxuICAgICAgQ29uc3RydWN0b3IucHJvdG90eXBlW2Z1bmNOYW1lLnJlcGxhY2UoJ29wZW4nLCAnaXRlcmF0ZScpXSA9IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHZhciBhcmdzID0gdG9BcnJheShhcmd1bWVudHMpO1xyXG4gICAgICAgIHZhciBjYWxsYmFjayA9IGFyZ3NbYXJncy5sZW5ndGggLSAxXTtcclxuICAgICAgICB2YXIgbmF0aXZlT2JqZWN0ID0gdGhpcy5fc3RvcmUgfHwgdGhpcy5faW5kZXg7XHJcbiAgICAgICAgdmFyIHJlcXVlc3QgPSBuYXRpdmVPYmplY3RbZnVuY05hbWVdLmFwcGx5KG5hdGl2ZU9iamVjdCwgYXJncy5zbGljZSgwLCAtMSkpO1xyXG4gICAgICAgIHJlcXVlc3Qub25zdWNjZXNzID0gZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICBjYWxsYmFjayhyZXF1ZXN0LnJlc3VsdCk7XHJcbiAgICAgICAgfTtcclxuICAgICAgfTtcclxuICAgIH0pO1xyXG4gIH0pO1xyXG5cclxuICAvLyBwb2x5ZmlsbCBnZXRBbGxcclxuICBbSW5kZXgsIE9iamVjdFN0b3JlXS5mb3JFYWNoKGZ1bmN0aW9uKENvbnN0cnVjdG9yKSB7XHJcbiAgICBpZiAoQ29uc3RydWN0b3IucHJvdG90eXBlLmdldEFsbCkgcmV0dXJuO1xyXG4gICAgQ29uc3RydWN0b3IucHJvdG90eXBlLmdldEFsbCA9IGZ1bmN0aW9uKHF1ZXJ5LCBjb3VudCkge1xyXG4gICAgICB2YXIgaW5zdGFuY2UgPSB0aGlzO1xyXG4gICAgICB2YXIgaXRlbXMgPSBbXTtcclxuXHJcbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbihyZXNvbHZlKSB7XHJcbiAgICAgICAgaW5zdGFuY2UuaXRlcmF0ZUN1cnNvcihxdWVyeSwgZnVuY3Rpb24oY3Vyc29yKSB7XHJcbiAgICAgICAgICBpZiAoIWN1cnNvcikge1xyXG4gICAgICAgICAgICByZXNvbHZlKGl0ZW1zKTtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgaXRlbXMucHVzaChjdXJzb3IudmFsdWUpO1xyXG5cclxuICAgICAgICAgIGlmIChjb3VudCAhPT0gdW5kZWZpbmVkICYmIGl0ZW1zLmxlbmd0aCA9PSBjb3VudCkge1xyXG4gICAgICAgICAgICByZXNvbHZlKGl0ZW1zKTtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgY3Vyc29yLmNvbnRpbnVlKCk7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgIH0pO1xyXG4gICAgfTtcclxuICB9KTtcclxuXHJcbiAgdmFyIGV4cCA9IHtcclxuICAgIG9wZW46IGZ1bmN0aW9uKG5hbWUsIHZlcnNpb24sIHVwZ3JhZGVDYWxsYmFjaykge1xyXG4gICAgICB2YXIgcCA9IHByb21pc2lmeVJlcXVlc3RDYWxsKGluZGV4ZWREQiwgJ29wZW4nLCBbbmFtZSwgdmVyc2lvbl0pO1xyXG4gICAgICB2YXIgcmVxdWVzdCA9IHAucmVxdWVzdDtcclxuXHJcbiAgICAgIHJlcXVlc3Qub251cGdyYWRlbmVlZGVkID0gZnVuY3Rpb24oZXZlbnQpIHtcclxuICAgICAgICBpZiAodXBncmFkZUNhbGxiYWNrKSB7XHJcbiAgICAgICAgICB1cGdyYWRlQ2FsbGJhY2sobmV3IFVwZ3JhZGVEQihyZXF1ZXN0LnJlc3VsdCwgZXZlbnQub2xkVmVyc2lvbiwgcmVxdWVzdC50cmFuc2FjdGlvbikpO1xyXG4gICAgICAgIH1cclxuICAgICAgfTtcclxuXHJcbiAgICAgIHJldHVybiBwLnRoZW4oZnVuY3Rpb24oZGIpIHtcclxuICAgICAgICByZXR1cm4gbmV3IERCKGRiKTtcclxuICAgICAgfSk7XHJcbiAgICB9LFxyXG4gICAgZGVsZXRlOiBmdW5jdGlvbihuYW1lKSB7XHJcbiAgICAgIHJldHVybiBwcm9taXNpZnlSZXF1ZXN0Q2FsbChpbmRleGVkREIsICdkZWxldGVEYXRhYmFzZScsIFtuYW1lXSk7XHJcbiAgICB9XHJcbiAgfTtcclxuXHJcbiAgaWYgKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnKSB7XHJcbiAgICBtb2R1bGUuZXhwb3J0cyA9IGV4cDtcclxuICB9XHJcbiAgZWxzZSB7XHJcbiAgICBzZWxmLmlkYiA9IGV4cDtcclxuICB9XHJcbn0oKSk7XHJcbiIsImltcG9ydCBpZGIgZnJvbSAnaWRiJztcclxuXHJcbi8qKiBcclxuICogU2VwYXJhdGUgY2FjaGVzIGZvciB0aGUganBnIGltYWdlcyBhbmQgYWxsIHRoZSBvdGhlciBjb250ZW50IFxyXG4gKi9cclxudmFyIENBQ0hFX1NUQVRJQyA9ICdyZXN0YXVyYW50LXJldmlld3Mtc3RhdGljLXYxJztcclxudmFyIENBQ0hFX0lNQUdFUyA9ICdyZXN0YXVyYW50LXJldmlld3MtaW1hZ2VzLXYxJztcclxudmFyIGRiUHJvbWlzZTtcclxuXHJcbi8qKiBcclxuICogRmV0Y2ggYW5kIGNhY2hlIGltYWdlIHJlcXVlc3QgXHJcbiAqL1xyXG5mdW5jdGlvbiBjYWNoZUltYWdlcyhyZXF1ZXN0KSB7XHJcbiAgXHJcbiAgLy8gUmVtb3ZlIHNpemUtcmVsYXRlZCBpbmZvIGZyb20gaW1hZ2UgbmFtZSBcclxuICB2YXIgdXJsVG9GZXRjaCA9IHJlcXVlc3QudXJsLnNsaWNlKDAsIHJlcXVlc3QudXJsLmluZGV4T2YoJy0nKSk7XHJcbiAgXHJcbiAgcmV0dXJuIGNhY2hlcy5vcGVuKENBQ0hFX0lNQUdFUykudGhlbihjYWNoZSA9PiB7ICBcclxuICAgIHJldHVybiBjYWNoZS5tYXRjaCh1cmxUb0ZldGNoKS50aGVuKHJlc3BvbnNlID0+IHtcclxuICAgXHJcbiAgICAgIC8vIENhY2hlIGhpdCAtIHJldHVybiByZXNwb25zZSBlbHNlIGZldGNoXHJcbiAgICAgIC8vIFdlIGNsb25lIHRoZSByZXF1ZXN0IGJlY2F1c2UgaXQncyBhIHN0cmVhbSBhbmQgY2FuIGJlIGNvbnN1bWVkIG9ubHkgb25jZVxyXG4gICAgICB2YXIgbmV0d29ya0ZldGNoID0gZmV0Y2gocmVxdWVzdC5jbG9uZSgpKS50aGVuKG5ldHdvcmtSZXNwb25zZSA9PiB7XHJcbiAgICAgICAgICAvLyBDaGVjayBpZiB3ZSByZWNlaXZlZCBhbiBpbnZhbGlkIHJlc3BvbnNlXHJcbiAgICAgICAgICBpZihuZXR3b3JrUmVzcG9uc2Uuc3RhdHVzID09IDQwNCkgcmV0dXJuO1xyXG4gICAgICAgXHJcbiAgICAgICAgICAvLyBXZSBjbG9uZSB0aGUgcmVzcG9uc2UgYmVjYXVzZSBpdCdzIGEgc3RyZWFtIGFuZCBjYW4gYmUgY29uc3VtZWQgb25seSBvbmNlXHJcbiAgICAgICAgICBjYWNoZS5wdXQodXJsVG9GZXRjaCwgbmV0d29ya1Jlc3BvbnNlLmNsb25lKCkpO1xyXG4gIFxyXG4gICAgICAgICAgcmV0dXJuIG5ldHdvcmtSZXNwb25zZTtcclxuICAgICAgICB9IFxyXG4gICAgICApO1xyXG4gIFxyXG4gICAgICAvL2lmIGFjY2VzcyB0byBuZXR3b3JrIGlzIGdvb2Qgd2Ugd2FudCB0aGUgYmVzdCBxdWFsaXR5IGltYWdlXHJcbiAgICAgIHJldHVybiBuZXR3b3JrRmV0Y2ggfHwgcmVzcG9uc2U7XHJcblxyXG4gICAgfSlcclxuICB9KVxyXG59XHJcblxyXG4vKiogXHJcbiAqIEZldGNoIGFuZCBjYWNoZSBzdGF0aWMgY29udGVudCBhbmQgZ29vZ2xlIG1hcCByZWxhdGVkIGNvbnRlbnQgXHJcbiAqL1xyXG4gZnVuY3Rpb24gY2FjaGVTdGF0aWNDb250ZW50KHJlcXVlc3QpIHtcclxuICAgIFxyXG4gIHJldHVybiBjYWNoZXMub3BlbihDQUNIRV9TVEFUSUMpLnRoZW4oY2FjaGUgPT4ge1xyXG4gICAgcmV0dXJuIGNhY2hlLm1hdGNoKHJlcXVlc3QpLnRoZW4ocmVzcG9uc2UgPT4ge1xyXG4gICAgXHJcbiAgICAgICAgLy8gQ2FjaGUgaGl0IC0gcmV0dXJuIHJlc3BvbnNlIGVsc2UgZmV0Y2hcclxuICAgICAgICAvLyBXZSBjbG9uZSB0aGUgcmVxdWVzdCBiZWNhdXNlIGl0J3MgYSBzdHJlYW0gYW5kIGNhbiBiZSBjb25zdW1lZCBvbmx5IG9uY2VcclxuICAgICAgcmV0dXJuIHJlc3BvbnNlIHx8IGZldGNoKHJlcXVlc3QuY2xvbmUoKSkudGhlbihuZXR3b3JrUmVzcG9uc2UgPT4ge1xyXG4gICAgICAgIC8vIENoZWNrIGlmIHdlIHJlY2VpdmVkIGFuIGludmFsaWQgcmVzcG9uc2VcclxuICAgICAgICBpZihuZXR3b3JrUmVzcG9uc2Uuc3RhdHVzID09IDQwNCkgcmV0dXJuO1xyXG4gICAgXHJcbiAgICAgICAgLy8gV2UgY2xvbmUgdGhlIHJlc3BvbnNlIGJlY2F1c2UgaXQncyBhIHN0cmVhbSBhbmQgY2FuIGJlIGNvbnN1bWVkIG9ubHkgb25jZVxyXG4gICAgICAgIGNhY2hlLnB1dChyZXF1ZXN0LCBuZXR3b3JrUmVzcG9uc2UuY2xvbmUoKSk7XHJcbiAgICAgICAgcmV0dXJuIG5ldHdvcmtSZXNwb25zZTtcclxuICAgICAgfSk7XHJcbiAgICB9KVxyXG4gIH0pXHJcbn1cclxuXHJcbi8qKlxyXG4gKiBGZXRjaCBmcm9tIG5ldHdvcmsgYW5kIHNhdmUgaW4gaW5kZXhlZCBEQlxyXG4gKi9cclxuZnVuY3Rpb24gZmV0Y2hGcm9tTmV0d29ya0FuZENhY2hlUmVzdGF1cmFudHNJbkluZGV4ZWREQihyZXF1ZXN0KSB7XHJcblxyXG4gIHZhciBwYXRoU2xpY2VzID0gcmVxdWVzdC51cmwuc3BsaXQoXCIvXCIpO1xyXG4gIHZhciByZXN0YXVyYW50SWQgPSBwYXJzZUludChwYXRoU2xpY2VzW3BhdGhTbGljZXMubGVuZ3RoIC0gMV0pIHx8IDA7XHJcblxyXG4gIHJldHVybiBmZXRjaChyZXF1ZXN0KS50aGVuKG5ldHdvcmtSZXNwb25zZSA9PiB7XHJcblxyXG4gICAgbmV0d29ya1Jlc3BvbnNlLmNsb25lKCkuanNvbigpLnRoZW4oanNvbiA9PiB7XHJcblxyXG4gICAgICBpZighZGJQcm9taXNlKSByZXR1cm47XHJcblxyXG4gICAgICBkYlByb21pc2UudGhlbihkYiA9PiB7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgIGlmKCFkYikgcmV0dXJuO1xyXG5cclxuICAgICAgICB2YXIgdHggPSBkYi50cmFuc2FjdGlvbigncmVzdGF1cmFudHMnLCAncmVhZHdyaXRlJyk7XHJcbiAgICAgICAgdmFyIHN0b3JlID0gdHgub2JqZWN0U3RvcmUoJ3Jlc3RhdXJhbnRzJyk7XHJcblxyXG4gICAgICAgIC8vIGlmIHdlIHJyZWZlciB0byBhbGwgZGF0YVxyXG4gICAgICAgIGlmKCFyZXN0YXVyYW50SWQpe1xyXG5cclxuICAgICAgICAgIGpzb24uZm9yRWFjaChyZXN0YXVyYW50ID0+IHtcclxuICAgICAgICAgICAgc3RvcmUucHV0KHJlc3RhdXJhbnQsIHJlc3RhdXJhbnQuaWQpO1xyXG4gICAgICAgICAgfSk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgfSBlbHNlIHsgLy8gaWYgd2UgcmVmZXIgdG8gcGVyIHJlc3RhdXJhbnQgZGF0YSBcclxuICAgICAgICBcclxuICAgICAgICAgICBzdG9yZS5wdXQoanNvbiwganNvbi5pZCk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgfVxyXG4gICAgICB9KTtcclxuICAgIH0pXHJcblxyXG4gICAgcmV0dXJuIG5ldHdvcmtSZXNwb25zZTtcclxuICB9KTtcclxufVxyXG5cclxuLyoqXHJcbiAqIFNlYXJjaCBpbiBpbmRleGVkIERCIGFuZCBpZiBubyByZXN1bHQgZmV0Y2ggZnJvbSBuZXR3b3JrIFxyXG4gKi9cclxuZnVuY3Rpb24gZ2V0RGF0YShyZXF1ZXN0KSB7XHJcblxyXG4gIHZhciBwYXRoU2xpY2VzID0gcmVxdWVzdC5jbG9uZSgpLnVybC5zcGxpdChcIi9cIik7XHJcbiAgdmFyIHJlc3RhdXJhbnRJZCA9IHBhcnNlSW50KHBhdGhTbGljZXNbcGF0aFNsaWNlcy5sZW5ndGggLSAxXSkgfHwgMDtcclxuICB2YXIgZGF0YVByb21pc2U7XHJcblxyXG4gIC8vIGlmIG5vdCBpbmRleGVkIGRiIGZ1bmN0aW9uYWxpdHkgZmV0Y2ggZnJvbSBuZXR3b3JrIFxyXG4gIGlmKCFkYlByb21pc2UpIHJldHVybiBmZXRjaEZyb21OZXR3b3JrQW5kQ2FjaGVSZXN0YXVyYW50c0luSW5kZXhlZERCKHJlcXVlc3QuY2xvbmUoKSk7XHJcblxyXG4gIHJldHVybiBkYlByb21pc2UudGhlbihkYiA9PiB7XHJcbiAgICBcclxuICAgIGlmKCFkYikgcmV0dXJuO1xyXG5cclxuICAgIHZhciBzdG9yZSA9IGRiLnRyYW5zYWN0aW9uKCdyZXN0YXVyYW50cycpLm9iamVjdFN0b3JlKCdyZXN0YXVyYW50cycpO1xyXG5cclxuICAgIC8vIGlmIGFsbCBkYXRhIGFyZSByZXF1ZXN0ZWRcclxuICAgIGlmKCFyZXN0YXVyYW50SWQpIHtcclxuXHJcbiAgICAgIGRhdGFQcm9taXNlID0gc3RvcmUuZ2V0QWxsKCk7XHJcblxyXG4gICAgfSBlbHNlIHsgLy8gaWYgcGVyIHJlc3RhdXJhbnQgZGF0YSBhcmUgcmVxdWVzdGVkXHJcblxyXG4gICAgICBkYXRhUHJvbWlzZSA9IHN0b3JlLmdldChyZXN0YXVyYW50SWQpO1xyXG4gICAgXHJcbiAgICB9XHJcbiAgICBcclxuICAgIGlmKGRhdGFQcm9taXNlKSB7XHJcblxyXG4gICAgICByZXR1cm4gZGF0YVByb21pc2UudGhlbihkYXRhID0+IHsgIFxyXG4gICAgICBcclxuICAgICAgICAvLyBpZiBkYXRhIGZvdW5kIGluIGluZGV4ZWQgZGIgcmV0dXJuIHRoZW1cclxuICAgICAgICBpZihKU09OLnN0cmluZ2lmeShkYXRhKSAhPT0gSlNPTi5zdHJpbmdpZnkoW10pICYmIGRhdGEgIT09IHVuZGVmaW5lZCkgIHsgXHJcblxyXG4gICAgICAgICAgY29uc29sZS5sb2coJ0ZvdW5kIGNhY2hlZCcpO1xyXG4gICAgICAgICAgcmV0dXJuIG5ldyBSZXNwb25zZShKU09OLnN0cmluZ2lmeShkYXRhKSk7IFxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY29uc29sZS5sb2coJ0ZldGNoIGZyb20gbmV0d29yaycpO1xyXG4gICAgICAgIC8vIGlmIG5vdCBmZXRjaCBmcm9tIG5ldHdvcmsgXHJcbiAgICAgICAgcmV0dXJuIGZldGNoRnJvbU5ldHdvcmtBbmRDYWNoZVJlc3RhdXJhbnRzSW5JbmRleGVkREIocmVxdWVzdCk7XHJcbiAgICAgICAgXHJcbiAgICAgIH0pO1xyXG4gICAgfSAgICBcclxuICB9KTtcclxufVxyXG5cclxuLyoqXHJcbiAqIENyZWF0ZSBhbiBpbmRleGVkIGRiIG9mIGtleXZhbCB0eXBlIG5hbWVkIGByZXN0YXVyYW50c2BcclxuICovXHJcbmZ1bmN0aW9uIGNyZWF0ZURCICgpIHtcclxuICBkYlByb21pc2UgPSBpZGIub3BlbigncmVzdGF1cmFudHMnLCAxLCB1cGdyYWRlREIgPT4ge1xyXG4gICAgdmFyIHN0b3JlID0gdXBncmFkZURCLmNyZWF0ZU9iamVjdFN0b3JlKCdyZXN0YXVyYW50cycsIHtcclxuICAgICAga2V5cGF0aDogJ2lkJ1xyXG4gICAgfSk7XHJcbiAgfSk7XHJcbn1cclxuXHJcbi8qKiBcclxuICogT3BlbiBjYWNoZXMgb24gaW5zdGFsbCBvZiBzdyBcclxuICovXHJcbnNlbGYuYWRkRXZlbnRMaXN0ZW5lcignaW5zdGFsbCcsIGV2ZW50ID0+IHtcclxuICAvLyBPcGVuIGNhY2hlIGZvciBzdGF0aWMgY29udGVudFxyXG4gIGV2ZW50LndhaXRVbnRpbChcclxuICAgIGNhY2hlcy5vcGVuKENBQ0hFX1NUQVRJQykudGhlbihjYWNoZSA9PiB7XHJcblx0ICAgIGNvbnNvbGUubG9nKGBDYWNoZSAke0NBQ0hFX1NUQVRJQ30gb3BlbmVkYCk7XHJcblx0ICB9KVxyXG4gICk7XHJcbiAgIC8vIE9wZW4gY2FjaGUgZm9yIGltYWdlcyBjb250ZW50XHJcbiAgZXZlbnQud2FpdFVudGlsKFxyXG4gICAgY2FjaGVzLm9wZW4oQ0FDSEVfSU1BR0VTKS50aGVuKGNhY2hlID0+IHtcclxuXHQgICAgY29uc29sZS5sb2coYENhY2hlICR7Q0FDSEVfSU1BR0VTfSBvcGVuZWRgKTtcclxuXHQgIH0pXHJcbiAgKTtcclxuICAvL2NyZWF0ZSBpbmRleGVkIGRiXHJcbiAgZXZlbnQud2FpdFVudGlsKFxyXG4gICAgY3JlYXRlREIoKVxyXG4gICk7XHJcbn0pO1xyXG5cclxuLyoqIFxyXG4gKiBIYW5kbGUgZmV0Y2ggXHJcbiAqL1xyXG5zZWxmLmFkZEV2ZW50TGlzdGVuZXIoJ2ZldGNoJywgZXZlbnQgPT4ge1xyXG4gIC8vIGhhbmRsZSByZXF1ZXN0IGFjY29yZGluZyB0byBpdHMgdHlwZVxyXG4gIGlmKGV2ZW50LnJlcXVlc3QudXJsLmVuZHNXaXRoKCcuanBnJykpIHtcclxuICAgIGV2ZW50LnJlc3BvbmRXaXRoKGNhY2hlSW1hZ2VzKGV2ZW50LnJlcXVlc3QpKTsgIFxyXG4gICAgcmV0dXJuO1xyXG4gIH0gZWxzZSBpZiAoZXZlbnQucmVxdWVzdC51cmwuaW5jbHVkZXMoJ3Jlc3RhdXJhbnRzJykpIHtcclxuICAgIGV2ZW50LnJlc3BvbmRXaXRoKGdldERhdGEoZXZlbnQucmVxdWVzdCkpO1xyXG4gICAgcmV0dXJuO1xyXG4gIH0gXHJcbiAgZWxzZSB7XHJcbiAgICBldmVudC5yZXNwb25kV2l0aChjYWNoZVN0YXRpY0NvbnRlbnQoZXZlbnQucmVxdWVzdCkpO1xyXG4gICAgcmV0dXJuO1xyXG4gIH1cclxufSk7XHJcblxyXG4iXX0=
