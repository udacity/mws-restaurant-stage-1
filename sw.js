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
        return response || caches.match(offlinePage);
      })['catch'](function () {
        return response || caches.match(offlinePage);
      });

      // //if access to network is good we want the best quality image
      return networkFetch;
    })['catch'](function () {
      caches.match(offlinePage);
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
    })['catch'](function () {
      caches.match(offlinePage);
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
  // Open cache for static content and cache 404 page
  event.waitUntil(caches.open(CACHE_STATIC).then(function (cache) {
    cache.addAll([offlinePage]);
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
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvaWRiL2xpYi9pZGIuanMiLCJDOi9Vc2Vycy92aWNraWUvRGVza3RvcC91ZGFjaXR5L213cy1yZXN0YXVyYW50LXN0YWdlLTEvc3JjL3N3LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7O21CQ3RUZ0IsS0FBSzs7Ozs7OztBQUtyQixJQUFJLFlBQVksR0FBRyw4QkFBOEIsQ0FB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LENBQUMsQ0FBQyxJQUFJLENBQUMsVUFBQSxLQUFLLEVBQUk7QUFDdEMsU0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUM7QUFDN0IsV0FBTyxDQUFDLEdBQUcsWUFBVSxZQUFZLGFBQVUsQ0FBQztHQUM3QyxDQUFDLENBQ0YsQ0FBQzs7QUFFRixPQUFLLENBQUMsU0FBUyxDQUNiLE1BQU0sQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLENBQUMsSUFBSSxDQUFDLFVBQUEsS0FBSyxFQUFJO0FBQ3ZDLFdBQU8sQ0FBQyxHQUFHLFlBQVUsWUFBWSxhQUFVLENBQUM7R0FDN0MsQ0FBQyxDQUNGLENBQUM7O0FBRUYsT0FBSyxDQUFDLFNBQVMsQ0FDYixRQUFRLEVBQUUsQ0FDWCxDQUFDO0NBQ0gsQ0FBQyxDQUFDOzs7OztBQUtILElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxPQUFPLEVBQUUsVUFBQSxLQUFLLEVBQUk7O0FBRXRDLE1BQUcsS0FBSyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxFQUFFO0FBQ3JDLFNBQUssQ0FBQyxXQUFXLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO0FBQzlDLFdBQU87R0FDUixNQUFNLElBQUksS0FBSyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLGFBQWEsQ0FBQyxFQUFFO0FBQ3BELFNBQUssQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO0FBQzFDLFdBQU87R0FDUixNQUNJO0FBQ0gsU0FBSyxDQUFDLFdBQVcsQ0FBQyxrQkFBa0IsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQztBQUNyRCxXQUFPO0dBQ1I7Q0FDRixDQUFDLENBQUMiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiJ3VzZSBzdHJpY3QnO1xuXG4oZnVuY3Rpb24oKSB7XG4gIGZ1bmN0aW9uIHRvQXJyYXkoYXJyKSB7XG4gICAgcmV0dXJuIEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFycik7XG4gIH1cblxuICBmdW5jdGlvbiBwcm9taXNpZnlSZXF1ZXN0KHJlcXVlc3QpIHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24ocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICByZXF1ZXN0Lm9uc3VjY2VzcyA9IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXNvbHZlKHJlcXVlc3QucmVzdWx0KTtcbiAgICAgIH07XG5cbiAgICAgIHJlcXVlc3Qub25lcnJvciA9IGZ1bmN0aW9uKCkge1xuICAgICAgICByZWplY3QocmVxdWVzdC5lcnJvcik7XG4gICAgICB9O1xuICAgIH0pO1xuICB9XG5cbiAgZnVuY3Rpb24gcHJvbWlzaWZ5UmVxdWVzdENhbGwob2JqLCBtZXRob2QsIGFyZ3MpIHtcbiAgICB2YXIgcmVxdWVzdDtcbiAgICB2YXIgcCA9IG5ldyBQcm9taXNlKGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgcmVxdWVzdCA9IG9ialttZXRob2RdLmFwcGx5KG9iaiwgYXJncyk7XG4gICAgICBwcm9taXNpZnlSZXF1ZXN0KHJlcXVlc3QpLnRoZW4ocmVzb2x2ZSwgcmVqZWN0KTtcbiAgICB9KTtcblxuICAgIHAucmVxdWVzdCA9IHJlcXVlc3Q7XG4gICAgcmV0dXJuIHA7XG4gIH1cbiAgXG4gIGZ1bmN0aW9uIHByb21pc2lmeUN1cnNvclJlcXVlc3RDYWxsKG9iaiwgbWV0aG9kLCBhcmdzKSB7XG4gICAgdmFyIHAgPSBwcm9taXNpZnlSZXF1ZXN0Q2FsbChvYmosIG1ldGhvZCwgYXJncyk7XG4gICAgcmV0dXJuIHAudGhlbihmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgaWYgKCF2YWx1ZSkgcmV0dXJuO1xuICAgICAgcmV0dXJuIG5ldyBDdXJzb3IodmFsdWUsIHAucmVxdWVzdCk7XG4gICAgfSk7XG4gIH1cblxuICBmdW5jdGlvbiBwcm94eVByb3BlcnRpZXMoUHJveHlDbGFzcywgdGFyZ2V0UHJvcCwgcHJvcGVydGllcykge1xuICAgIHByb3BlcnRpZXMuZm9yRWFjaChmdW5jdGlvbihwcm9wKSB7XG4gICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoUHJveHlDbGFzcy5wcm90b3R5cGUsIHByb3AsIHtcbiAgICAgICAgZ2V0OiBmdW5jdGlvbigpIHtcbiAgICAgICAgICByZXR1cm4gdGhpc1t0YXJnZXRQcm9wXVtwcm9wXTtcbiAgICAgICAgfSxcbiAgICAgICAgc2V0OiBmdW5jdGlvbih2YWwpIHtcbiAgICAgICAgICB0aGlzW3RhcmdldFByb3BdW3Byb3BdID0gdmFsO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHByb3h5UmVxdWVzdE1ldGhvZHMoUHJveHlDbGFzcywgdGFyZ2V0UHJvcCwgQ29uc3RydWN0b3IsIHByb3BlcnRpZXMpIHtcbiAgICBwcm9wZXJ0aWVzLmZvckVhY2goZnVuY3Rpb24ocHJvcCkge1xuICAgICAgaWYgKCEocHJvcCBpbiBDb25zdHJ1Y3Rvci5wcm90b3R5cGUpKSByZXR1cm47XG4gICAgICBQcm94eUNsYXNzLnByb3RvdHlwZVtwcm9wXSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gcHJvbWlzaWZ5UmVxdWVzdENhbGwodGhpc1t0YXJnZXRQcm9wXSwgcHJvcCwgYXJndW1lbnRzKTtcbiAgICAgIH07XG4gICAgfSk7XG4gIH1cblxuICBmdW5jdGlvbiBwcm94eU1ldGhvZHMoUHJveHlDbGFzcywgdGFyZ2V0UHJvcCwgQ29uc3RydWN0b3IsIHByb3BlcnRpZXMpIHtcbiAgICBwcm9wZXJ0aWVzLmZvckVhY2goZnVuY3Rpb24ocHJvcCkge1xuICAgICAgaWYgKCEocHJvcCBpbiBDb25zdHJ1Y3Rvci5wcm90b3R5cGUpKSByZXR1cm47XG4gICAgICBQcm94eUNsYXNzLnByb3RvdHlwZVtwcm9wXSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gdGhpc1t0YXJnZXRQcm9wXVtwcm9wXS5hcHBseSh0aGlzW3RhcmdldFByb3BdLCBhcmd1bWVudHMpO1xuICAgICAgfTtcbiAgICB9KTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHByb3h5Q3Vyc29yUmVxdWVzdE1ldGhvZHMoUHJveHlDbGFzcywgdGFyZ2V0UHJvcCwgQ29uc3RydWN0b3IsIHByb3BlcnRpZXMpIHtcbiAgICBwcm9wZXJ0aWVzLmZvckVhY2goZnVuY3Rpb24ocHJvcCkge1xuICAgICAgaWYgKCEocHJvcCBpbiBDb25zdHJ1Y3Rvci5wcm90b3R5cGUpKSByZXR1cm47XG4gICAgICBQcm94eUNsYXNzLnByb3RvdHlwZVtwcm9wXSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gcHJvbWlzaWZ5Q3Vyc29yUmVxdWVzdENhbGwodGhpc1t0YXJnZXRQcm9wXSwgcHJvcCwgYXJndW1lbnRzKTtcbiAgICAgIH07XG4gICAgfSk7XG4gIH1cblxuICBmdW5jdGlvbiBJbmRleChpbmRleCkge1xuICAgIHRoaXMuX2luZGV4ID0gaW5kZXg7XG4gIH1cblxuICBwcm94eVByb3BlcnRpZXMoSW5kZXgsICdfaW5kZXgnLCBbXG4gICAgJ25hbWUnLFxuICAgICdrZXlQYXRoJyxcbiAgICAnbXVsdGlFbnRyeScsXG4gICAgJ3VuaXF1ZSdcbiAgXSk7XG5cbiAgcHJveHlSZXF1ZXN0TWV0aG9kcyhJbmRleCwgJ19pbmRleCcsIElEQkluZGV4LCBbXG4gICAgJ2dldCcsXG4gICAgJ2dldEtleScsXG4gICAgJ2dldEFsbCcsXG4gICAgJ2dldEFsbEtleXMnLFxuICAgICdjb3VudCdcbiAgXSk7XG5cbiAgcHJveHlDdXJzb3JSZXF1ZXN0TWV0aG9kcyhJbmRleCwgJ19pbmRleCcsIElEQkluZGV4LCBbXG4gICAgJ29wZW5DdXJzb3InLFxuICAgICdvcGVuS2V5Q3Vyc29yJ1xuICBdKTtcblxuICBmdW5jdGlvbiBDdXJzb3IoY3Vyc29yLCByZXF1ZXN0KSB7XG4gICAgdGhpcy5fY3Vyc29yID0gY3Vyc29yO1xuICAgIHRoaXMuX3JlcXVlc3QgPSByZXF1ZXN0O1xuICB9XG5cbiAgcHJveHlQcm9wZXJ0aWVzKEN1cnNvciwgJ19jdXJzb3InLCBbXG4gICAgJ2RpcmVjdGlvbicsXG4gICAgJ2tleScsXG4gICAgJ3ByaW1hcnlLZXknLFxuICAgICd2YWx1ZSdcbiAgXSk7XG5cbiAgcHJveHlSZXF1ZXN0TWV0aG9kcyhDdXJzb3IsICdfY3Vyc29yJywgSURCQ3Vyc29yLCBbXG4gICAgJ3VwZGF0ZScsXG4gICAgJ2RlbGV0ZSdcbiAgXSk7XG5cbiAgLy8gcHJveHkgJ25leHQnIG1ldGhvZHNcbiAgWydhZHZhbmNlJywgJ2NvbnRpbnVlJywgJ2NvbnRpbnVlUHJpbWFyeUtleSddLmZvckVhY2goZnVuY3Rpb24obWV0aG9kTmFtZSkge1xuICAgIGlmICghKG1ldGhvZE5hbWUgaW4gSURCQ3Vyc29yLnByb3RvdHlwZSkpIHJldHVybjtcbiAgICBDdXJzb3IucHJvdG90eXBlW21ldGhvZE5hbWVdID0gZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgY3Vyc29yID0gdGhpcztcbiAgICAgIHZhciBhcmdzID0gYXJndW1lbnRzO1xuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpLnRoZW4oZnVuY3Rpb24oKSB7XG4gICAgICAgIGN1cnNvci5fY3Vyc29yW21ldGhvZE5hbWVdLmFwcGx5KGN1cnNvci5fY3Vyc29yLCBhcmdzKTtcbiAgICAgICAgcmV0dXJuIHByb21pc2lmeVJlcXVlc3QoY3Vyc29yLl9yZXF1ZXN0KS50aGVuKGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICAgICAgaWYgKCF2YWx1ZSkgcmV0dXJuO1xuICAgICAgICAgIHJldHVybiBuZXcgQ3Vyc29yKHZhbHVlLCBjdXJzb3IuX3JlcXVlc3QpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH07XG4gIH0pO1xuXG4gIGZ1bmN0aW9uIE9iamVjdFN0b3JlKHN0b3JlKSB7XG4gICAgdGhpcy5fc3RvcmUgPSBzdG9yZTtcbiAgfVxuXG4gIE9iamVjdFN0b3JlLnByb3RvdHlwZS5jcmVhdGVJbmRleCA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBuZXcgSW5kZXgodGhpcy5fc3RvcmUuY3JlYXRlSW5kZXguYXBwbHkodGhpcy5fc3RvcmUsIGFyZ3VtZW50cykpO1xuICB9O1xuXG4gIE9iamVjdFN0b3JlLnByb3RvdHlwZS5pbmRleCA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBuZXcgSW5kZXgodGhpcy5fc3RvcmUuaW5kZXguYXBwbHkodGhpcy5fc3RvcmUsIGFyZ3VtZW50cykpO1xuICB9O1xuXG4gIHByb3h5UHJvcGVydGllcyhPYmplY3RTdG9yZSwgJ19zdG9yZScsIFtcbiAgICAnbmFtZScsXG4gICAgJ2tleVBhdGgnLFxuICAgICdpbmRleE5hbWVzJyxcbiAgICAnYXV0b0luY3JlbWVudCdcbiAgXSk7XG5cbiAgcHJveHlSZXF1ZXN0TWV0aG9kcyhPYmplY3RTdG9yZSwgJ19zdG9yZScsIElEQk9iamVjdFN0b3JlLCBbXG4gICAgJ3B1dCcsXG4gICAgJ2FkZCcsXG4gICAgJ2RlbGV0ZScsXG4gICAgJ2NsZWFyJyxcbiAgICAnZ2V0JyxcbiAgICAnZ2V0QWxsJyxcbiAgICAnZ2V0S2V5JyxcbiAgICAnZ2V0QWxsS2V5cycsXG4gICAgJ2NvdW50J1xuICBdKTtcblxuICBwcm94eUN1cnNvclJlcXVlc3RNZXRob2RzKE9iamVjdFN0b3JlLCAnX3N0b3JlJywgSURCT2JqZWN0U3RvcmUsIFtcbiAgICAnb3BlbkN1cnNvcicsXG4gICAgJ29wZW5LZXlDdXJzb3InXG4gIF0pO1xuXG4gIHByb3h5TWV0aG9kcyhPYmplY3RTdG9yZSwgJ19zdG9yZScsIElEQk9iamVjdFN0b3JlLCBbXG4gICAgJ2RlbGV0ZUluZGV4J1xuICBdKTtcblxuICBmdW5jdGlvbiBUcmFuc2FjdGlvbihpZGJUcmFuc2FjdGlvbikge1xuICAgIHRoaXMuX3R4ID0gaWRiVHJhbnNhY3Rpb247XG4gICAgdGhpcy5jb21wbGV0ZSA9IG5ldyBQcm9taXNlKGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgaWRiVHJhbnNhY3Rpb24ub25jb21wbGV0ZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXNvbHZlKCk7XG4gICAgICB9O1xuICAgICAgaWRiVHJhbnNhY3Rpb24ub25lcnJvciA9IGZ1bmN0aW9uKCkge1xuICAgICAgICByZWplY3QoaWRiVHJhbnNhY3Rpb24uZXJyb3IpO1xuICAgICAgfTtcbiAgICAgIGlkYlRyYW5zYWN0aW9uLm9uYWJvcnQgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgcmVqZWN0KGlkYlRyYW5zYWN0aW9uLmVycm9yKTtcbiAgICAgIH07XG4gICAgfSk7XG4gIH1cblxuICBUcmFuc2FjdGlvbi5wcm90b3R5cGUub2JqZWN0U3RvcmUgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gbmV3IE9iamVjdFN0b3JlKHRoaXMuX3R4Lm9iamVjdFN0b3JlLmFwcGx5KHRoaXMuX3R4LCBhcmd1bWVudHMpKTtcbiAgfTtcblxuICBwcm94eVByb3BlcnRpZXMoVHJhbnNhY3Rpb24sICdfdHgnLCBbXG4gICAgJ29iamVjdFN0b3JlTmFtZXMnLFxuICAgICdtb2RlJ1xuICBdKTtcblxuICBwcm94eU1ldGhvZHMoVHJhbnNhY3Rpb24sICdfdHgnLCBJREJUcmFuc2FjdGlvbiwgW1xuICAgICdhYm9ydCdcbiAgXSk7XG5cbiAgZnVuY3Rpb24gVXBncmFkZURCKGRiLCBvbGRWZXJzaW9uLCB0cmFuc2FjdGlvbikge1xuICAgIHRoaXMuX2RiID0gZGI7XG4gICAgdGhpcy5vbGRWZXJzaW9uID0gb2xkVmVyc2lvbjtcbiAgICB0aGlzLnRyYW5zYWN0aW9uID0gbmV3IFRyYW5zYWN0aW9uKHRyYW5zYWN0aW9uKTtcbiAgfVxuXG4gIFVwZ3JhZGVEQi5wcm90b3R5cGUuY3JlYXRlT2JqZWN0U3RvcmUgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gbmV3IE9iamVjdFN0b3JlKHRoaXMuX2RiLmNyZWF0ZU9iamVjdFN0b3JlLmFwcGx5KHRoaXMuX2RiLCBhcmd1bWVudHMpKTtcbiAgfTtcblxuICBwcm94eVByb3BlcnRpZXMoVXBncmFkZURCLCAnX2RiJywgW1xuICAgICduYW1lJyxcbiAgICAndmVyc2lvbicsXG4gICAgJ29iamVjdFN0b3JlTmFtZXMnXG4gIF0pO1xuXG4gIHByb3h5TWV0aG9kcyhVcGdyYWRlREIsICdfZGInLCBJREJEYXRhYmFzZSwgW1xuICAgICdkZWxldGVPYmplY3RTdG9yZScsXG4gICAgJ2Nsb3NlJ1xuICBdKTtcblxuICBmdW5jdGlvbiBEQihkYikge1xuICAgIHRoaXMuX2RiID0gZGI7XG4gIH1cblxuICBEQi5wcm90b3R5cGUudHJhbnNhY3Rpb24gPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gbmV3IFRyYW5zYWN0aW9uKHRoaXMuX2RiLnRyYW5zYWN0aW9uLmFwcGx5KHRoaXMuX2RiLCBhcmd1bWVudHMpKTtcbiAgfTtcblxuICBwcm94eVByb3BlcnRpZXMoREIsICdfZGInLCBbXG4gICAgJ25hbWUnLFxuICAgICd2ZXJzaW9uJyxcbiAgICAnb2JqZWN0U3RvcmVOYW1lcydcbiAgXSk7XG5cbiAgcHJveHlNZXRob2RzKERCLCAnX2RiJywgSURCRGF0YWJhc2UsIFtcbiAgICAnY2xvc2UnXG4gIF0pO1xuXG4gIC8vIEFkZCBjdXJzb3IgaXRlcmF0b3JzXG4gIC8vIFRPRE86IHJlbW92ZSB0aGlzIG9uY2UgYnJvd3NlcnMgZG8gdGhlIHJpZ2h0IHRoaW5nIHdpdGggcHJvbWlzZXNcbiAgWydvcGVuQ3Vyc29yJywgJ29wZW5LZXlDdXJzb3InXS5mb3JFYWNoKGZ1bmN0aW9uKGZ1bmNOYW1lKSB7XG4gICAgW09iamVjdFN0b3JlLCBJbmRleF0uZm9yRWFjaChmdW5jdGlvbihDb25zdHJ1Y3Rvcikge1xuICAgICAgQ29uc3RydWN0b3IucHJvdG90eXBlW2Z1bmNOYW1lLnJlcGxhY2UoJ29wZW4nLCAnaXRlcmF0ZScpXSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgYXJncyA9IHRvQXJyYXkoYXJndW1lbnRzKTtcbiAgICAgICAgdmFyIGNhbGxiYWNrID0gYXJnc1thcmdzLmxlbmd0aCAtIDFdO1xuICAgICAgICB2YXIgbmF0aXZlT2JqZWN0ID0gdGhpcy5fc3RvcmUgfHwgdGhpcy5faW5kZXg7XG4gICAgICAgIHZhciByZXF1ZXN0ID0gbmF0aXZlT2JqZWN0W2Z1bmNOYW1lXS5hcHBseShuYXRpdmVPYmplY3QsIGFyZ3Muc2xpY2UoMCwgLTEpKTtcbiAgICAgICAgcmVxdWVzdC5vbnN1Y2Nlc3MgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICBjYWxsYmFjayhyZXF1ZXN0LnJlc3VsdCk7XG4gICAgICAgIH07XG4gICAgICB9O1xuICAgIH0pO1xuICB9KTtcblxuICAvLyBwb2x5ZmlsbCBnZXRBbGxcbiAgW0luZGV4LCBPYmplY3RTdG9yZV0uZm9yRWFjaChmdW5jdGlvbihDb25zdHJ1Y3Rvcikge1xuICAgIGlmIChDb25zdHJ1Y3Rvci5wcm90b3R5cGUuZ2V0QWxsKSByZXR1cm47XG4gICAgQ29uc3RydWN0b3IucHJvdG90eXBlLmdldEFsbCA9IGZ1bmN0aW9uKHF1ZXJ5LCBjb3VudCkge1xuICAgICAgdmFyIGluc3RhbmNlID0gdGhpcztcbiAgICAgIHZhciBpdGVtcyA9IFtdO1xuXG4gICAgICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24ocmVzb2x2ZSkge1xuICAgICAgICBpbnN0YW5jZS5pdGVyYXRlQ3Vyc29yKHF1ZXJ5LCBmdW5jdGlvbihjdXJzb3IpIHtcbiAgICAgICAgICBpZiAoIWN1cnNvcikge1xuICAgICAgICAgICAgcmVzb2x2ZShpdGVtcyk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgfVxuICAgICAgICAgIGl0ZW1zLnB1c2goY3Vyc29yLnZhbHVlKTtcblxuICAgICAgICAgIGlmIChjb3VudCAhPT0gdW5kZWZpbmVkICYmIGl0ZW1zLmxlbmd0aCA9PSBjb3VudCkge1xuICAgICAgICAgICAgcmVzb2x2ZShpdGVtcyk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgfVxuICAgICAgICAgIGN1cnNvci5jb250aW51ZSgpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH07XG4gIH0pO1xuXG4gIHZhciBleHAgPSB7XG4gICAgb3BlbjogZnVuY3Rpb24obmFtZSwgdmVyc2lvbiwgdXBncmFkZUNhbGxiYWNrKSB7XG4gICAgICB2YXIgcCA9IHByb21pc2lmeVJlcXVlc3RDYWxsKGluZGV4ZWREQiwgJ29wZW4nLCBbbmFtZSwgdmVyc2lvbl0pO1xuICAgICAgdmFyIHJlcXVlc3QgPSBwLnJlcXVlc3Q7XG5cbiAgICAgIHJlcXVlc3Qub251cGdyYWRlbmVlZGVkID0gZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgaWYgKHVwZ3JhZGVDYWxsYmFjaykge1xuICAgICAgICAgIHVwZ3JhZGVDYWxsYmFjayhuZXcgVXBncmFkZURCKHJlcXVlc3QucmVzdWx0LCBldmVudC5vbGRWZXJzaW9uLCByZXF1ZXN0LnRyYW5zYWN0aW9uKSk7XG4gICAgICAgIH1cbiAgICAgIH07XG5cbiAgICAgIHJldHVybiBwLnRoZW4oZnVuY3Rpb24oZGIpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBEQihkYik7XG4gICAgICB9KTtcbiAgICB9LFxuICAgIGRlbGV0ZTogZnVuY3Rpb24obmFtZSkge1xuICAgICAgcmV0dXJuIHByb21pc2lmeVJlcXVlc3RDYWxsKGluZGV4ZWREQiwgJ2RlbGV0ZURhdGFiYXNlJywgW25hbWVdKTtcbiAgICB9XG4gIH07XG5cbiAgaWYgKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgbW9kdWxlLmV4cG9ydHMgPSBleHA7XG4gIH1cbiAgZWxzZSB7XG4gICAgc2VsZi5pZGIgPSBleHA7XG4gIH1cbn0oKSk7XG4iLCJpbXBvcnQgaWRiIGZyb20gJ2lkYic7XHJcblxyXG4vKiogXHJcbiAqIFNlcGFyYXRlIGNhY2hlcyBmb3IgdGhlIGpwZyBpbWFnZXMgYW5kIGFsbCB0aGUgb3RoZXIgY29udGVudCBcclxuICovXHJcbnZhciBDQUNIRV9TVEFUSUMgPSAncmVzdGF1cmFudC1yZXZpZXdzLXN0YXRpYy12MSc7XHJcbnZhciBDQUNIRV9JTUFHRVMgPSAncmVzdGF1cmFudC1yZXZpZXdzLWltYWdlcy12MSc7XHJcbmNvbnN0IG9mZmxpbmVQYWdlID0gJy4vNDA0Lmh0bWwnO1xyXG52YXIgZGJQcm9taXNlO1xyXG5cclxuLyoqIFxyXG4gKiBGZXRjaCBhbmQgY2FjaGUgaW1hZ2UgcmVxdWVzdCBcclxuICovXHJcbmZ1bmN0aW9uIGNhY2hlSW1hZ2VzKHJlcXVlc3QpIHtcclxuICBcclxuICAvLyBSZW1vdmUgc2l6ZS1yZWxhdGVkIGluZm8gZnJvbSBpbWFnZSBuYW1lIFxyXG4gIHZhciB1cmxUb0ZldGNoID0gcmVxdWVzdC51cmwuc2xpY2UoMCwgcmVxdWVzdC51cmwuaW5kZXhPZignLScpKTtcclxuICAgXHJcbiAgXHJcbiAgcmV0dXJuIGNhY2hlcy5vcGVuKENBQ0hFX0lNQUdFUykudGhlbihjYWNoZSA9PiB7ICBcclxuICAgIHJldHVybiBjYWNoZS5tYXRjaCh1cmxUb0ZldGNoKS50aGVuKHJlc3BvbnNlID0+IHtcclxuICBcclxuICAgICAgLy8gQ2FjaGUgaGl0IC0gcmV0dXJuIHJlc3BvbnNlIGVsc2UgZmV0Y2hcclxuICAgICAgLy8gV2UgY2xvbmUgdGhlIHJlcXVlc3QgYmVjYXVzZSBpdCdzIGEgc3RyZWFtIGFuZCBjYW4gYmUgY29uc3VtZWQgb25seSBvbmNlXHJcbiAgICAgIHZhciBuZXR3b3JrRmV0Y2ggPSBmZXRjaChyZXF1ZXN0LmNsb25lKCkpLnRoZW4oKG5ldHdvcmtSZXNwb25zZSkgPT4ge1xyXG4gICAgICAgICAgLy8gQ2hlY2sgaWYgd2UgcmVjZWl2ZWQgYW4gaW52YWxpZCByZXNwb25zZVxyXG4gICAgICAgICAgaWYobmV0d29ya1Jlc3BvbnNlLnN0YXR1cyA9PSA0MDQpIHJldHVybjtcclxuXHJcbiAgICAgICAgICAvLyBXZSBjbG9uZSB0aGUgcmVzcG9uc2UgYmVjYXVzZSBpdCdzIGEgc3RyZWFtIGFuZCBjYW4gYmUgY29uc3VtZWQgb25seSBvbmNlXHJcbiAgICAgICAgICBjYWNoZS5wdXQodXJsVG9GZXRjaCwgbmV0d29ya1Jlc3BvbnNlLmNsb25lKCkpO1xyXG4gIFxyXG4gICAgICAgICAgcmV0dXJuIG5ldHdvcmtSZXNwb25zZTtcclxuXHJcbiAgICAgICAgfSwgKHJlamVjdGVkKSA9PiB7XHJcbiAgICAgICAgICByZXR1cm4gcmVzcG9uc2UgfHwgY2FjaGVzLm1hdGNoKG9mZmxpbmVQYWdlKTtcclxuICAgICAgICB9KS5jYXRjaCgoKSA9PiB7XHJcbiAgICAgICAgICByZXR1cm4gcmVzcG9uc2UgfHwgY2FjaGVzLm1hdGNoKG9mZmxpbmVQYWdlKTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgIC8vIC8vaWYgYWNjZXNzIHRvIG5ldHdvcmsgaXMgZ29vZCB3ZSB3YW50IHRoZSBiZXN0IHF1YWxpdHkgaW1hZ2VcclxuICAgICAgcmV0dXJuIG5ldHdvcmtGZXRjaDtcclxuXHJcbiAgICB9KS5jYXRjaCgoKSA9PiB7IGNhY2hlcy5tYXRjaChvZmZsaW5lUGFnZSk7IH0pXHJcbiAgfSlcclxufVxyXG5cclxuLyoqIFxyXG4gKiBGZXRjaCBhbmQgY2FjaGUgc3RhdGljIGNvbnRlbnQgYW5kIGdvb2dsZSBtYXAgcmVsYXRlZCBjb250ZW50IFxyXG4gKi9cclxuIGZ1bmN0aW9uIGNhY2hlU3RhdGljQ29udGVudChyZXF1ZXN0KSB7XHJcbiAgICBcclxuICByZXR1cm4gY2FjaGVzLm9wZW4oQ0FDSEVfU1RBVElDKS50aGVuKGNhY2hlID0+IHtcclxuICAgIHJldHVybiBjYWNoZS5tYXRjaChyZXF1ZXN0KS50aGVuKHJlc3BvbnNlID0+IHtcclxuICAgIFxyXG4gICAgICAgIC8vIENhY2hlIGhpdCAtIHJldHVybiByZXNwb25zZSBlbHNlIGZldGNoXHJcbiAgICAgICAgLy8gV2UgY2xvbmUgdGhlIHJlcXVlc3QgYmVjYXVzZSBpdCdzIGEgc3RyZWFtIGFuZCBjYW4gYmUgY29uc3VtZWQgb25seSBvbmNlXHJcbiAgICAgIHJldHVybiByZXNwb25zZSB8fCBmZXRjaChyZXF1ZXN0LmNsb25lKCkpLnRoZW4obmV0d29ya1Jlc3BvbnNlID0+IHtcclxuICAgICAgICAvLyBDaGVjayBpZiB3ZSByZWNlaXZlZCBhbiBpbnZhbGlkIHJlc3BvbnNlXHJcbiAgICAgICAgaWYobmV0d29ya1Jlc3BvbnNlLnN0YXR1cyA9PSA0MDQpIHJldHVybjtcclxuICAgIFxyXG4gICAgICAgIC8vIFdlIGNsb25lIHRoZSByZXNwb25zZSBiZWNhdXNlIGl0J3MgYSBzdHJlYW0gYW5kIGNhbiBiZSBjb25zdW1lZCBvbmx5IG9uY2VcclxuICAgICAgICBjYWNoZS5wdXQocmVxdWVzdCwgbmV0d29ya1Jlc3BvbnNlLmNsb25lKCkpO1xyXG4gICAgICAgIHJldHVybiBuZXR3b3JrUmVzcG9uc2U7XHJcbiAgICAgIH0pO1xyXG4gICAgfSkuY2F0Y2goKCkgPT4geyBjYWNoZXMubWF0Y2gob2ZmbGluZVBhZ2UpOyB9KVxyXG4gIH0pXHJcbn1cclxuXHJcbi8qKlxyXG4gKiBGZXRjaCBmcm9tIG5ldHdvcmsgYW5kIHNhdmUgaW4gaW5kZXhlZCBEQlxyXG4gKi9cclxuZnVuY3Rpb24gZmV0Y2hGcm9tTmV0d29ya0FuZENhY2hlUmVzdGF1cmFudHNJbkluZGV4ZWREQihyZXF1ZXN0KSB7XHJcblxyXG4gIHZhciBwYXRoU2xpY2VzID0gcmVxdWVzdC51cmwuc3BsaXQoXCIvXCIpO1xyXG4gIHZhciByZXN0YXVyYW50SWQgPSBwYXJzZUludChwYXRoU2xpY2VzW3BhdGhTbGljZXMubGVuZ3RoIC0gMV0pIHx8IDA7XHJcblxyXG4gIHJldHVybiBmZXRjaChyZXF1ZXN0KS50aGVuKG5ldHdvcmtSZXNwb25zZSA9PiB7XHJcblxyXG4gICAgbmV0d29ya1Jlc3BvbnNlLmNsb25lKCkuanNvbigpLnRoZW4oanNvbiA9PiB7XHJcblxyXG4gICAgICBpZighZGJQcm9taXNlKSByZXR1cm47XHJcblxyXG4gICAgICBkYlByb21pc2UudGhlbihkYiA9PiB7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgIGlmKCFkYikgcmV0dXJuO1xyXG5cclxuICAgICAgICB2YXIgdHggPSBkYi50cmFuc2FjdGlvbigncmVzdGF1cmFudHMnLCAncmVhZHdyaXRlJyk7XHJcbiAgICAgICAgdmFyIHN0b3JlID0gdHgub2JqZWN0U3RvcmUoJ3Jlc3RhdXJhbnRzJyk7XHJcblxyXG4gICAgICAgIC8vIGlmIHdlIHJyZWZlciB0byBhbGwgZGF0YVxyXG4gICAgICAgIGlmKCFyZXN0YXVyYW50SWQpe1xyXG5cclxuICAgICAgICAgIGpzb24uZm9yRWFjaChyZXN0YXVyYW50ID0+IHtcclxuICAgICAgICAgICAgc3RvcmUucHV0KHJlc3RhdXJhbnQsIHJlc3RhdXJhbnQuaWQpO1xyXG4gICAgICAgICAgfSk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgfSBlbHNlIHsgLy8gaWYgd2UgcmVmZXIgdG8gcGVyIHJlc3RhdXJhbnQgZGF0YSBcclxuICAgICAgICBcclxuICAgICAgICAgICBzdG9yZS5wdXQoanNvbiwganNvbi5pZCk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgfVxyXG4gICAgICB9KTtcclxuICAgIH0pXHJcblxyXG4gICAgcmV0dXJuIG5ldHdvcmtSZXNwb25zZTtcclxuICB9KTtcclxufVxyXG5cclxuLyoqXHJcbiAqIFNlYXJjaCBpbiBpbmRleGVkIERCIGFuZCBpZiBubyByZXN1bHQgZmV0Y2ggZnJvbSBuZXR3b3JrIFxyXG4gKi9cclxuZnVuY3Rpb24gZ2V0RGF0YShyZXF1ZXN0KSB7XHJcblxyXG4gIHZhciBwYXRoU2xpY2VzID0gcmVxdWVzdC5jbG9uZSgpLnVybC5zcGxpdChcIi9cIik7XHJcbiAgdmFyIHJlc3RhdXJhbnRJZCA9IHBhcnNlSW50KHBhdGhTbGljZXNbcGF0aFNsaWNlcy5sZW5ndGggLSAxXSkgfHwgMDtcclxuICB2YXIgZGF0YVByb21pc2U7XHJcblxyXG4gIC8vIGlmIG5vdCBpbmRleGVkIGRiIGZ1bmN0aW9uYWxpdHkgZmV0Y2ggZnJvbSBuZXR3b3JrIFxyXG4gIGlmKCFkYlByb21pc2UpIHJldHVybiBmZXRjaEZyb21OZXR3b3JrQW5kQ2FjaGVSZXN0YXVyYW50c0luSW5kZXhlZERCKHJlcXVlc3QuY2xvbmUoKSk7XHJcblxyXG4gIHJldHVybiBkYlByb21pc2UudGhlbihkYiA9PiB7XHJcbiAgICBcclxuICAgIGlmKCFkYikgcmV0dXJuO1xyXG5cclxuICAgIHZhciBzdG9yZSA9IGRiLnRyYW5zYWN0aW9uKCdyZXN0YXVyYW50cycpLm9iamVjdFN0b3JlKCdyZXN0YXVyYW50cycpO1xyXG5cclxuICAgIC8vIGlmIGFsbCBkYXRhIGFyZSByZXF1ZXN0ZWRcclxuICAgIGlmKCFyZXN0YXVyYW50SWQpIHtcclxuXHJcbiAgICAgIGRhdGFQcm9taXNlID0gc3RvcmUuZ2V0QWxsKCk7XHJcblxyXG4gICAgfSBlbHNlIHsgLy8gaWYgcGVyIHJlc3RhdXJhbnQgZGF0YSBhcmUgcmVxdWVzdGVkXHJcblxyXG4gICAgICBkYXRhUHJvbWlzZSA9IHN0b3JlLmdldChyZXN0YXVyYW50SWQpO1xyXG4gICAgXHJcbiAgICB9XHJcbiAgICBcclxuICAgIGlmKGRhdGFQcm9taXNlKSB7XHJcblxyXG4gICAgICByZXR1cm4gZGF0YVByb21pc2UudGhlbihkYXRhID0+IHsgIFxyXG4gICAgICBcclxuICAgICAgICAvLyBpZiBkYXRhIGZvdW5kIGluIGluZGV4ZWQgZGIgcmV0dXJuIHRoZW1cclxuICAgICAgICBpZihKU09OLnN0cmluZ2lmeShkYXRhKSAhPT0gSlNPTi5zdHJpbmdpZnkoW10pICYmIGRhdGEgIT09IHVuZGVmaW5lZCkgIHsgXHJcblxyXG4gICAgICAgICAgY29uc29sZS5sb2coJ0ZvdW5kIGNhY2hlZCcpO1xyXG4gICAgICAgICAgcmV0dXJuIG5ldyBSZXNwb25zZShKU09OLnN0cmluZ2lmeShkYXRhKSk7IFxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY29uc29sZS5sb2coJ0ZldGNoIGZyb20gbmV0d29yaycpO1xyXG4gICAgICAgIC8vIGlmIGRhdGEgbm90IGNhY2hlZCB0aGVuIGZldGNoIGZyb20gbmV0d29yayBcclxuICAgICAgICByZXR1cm4gZmV0Y2hGcm9tTmV0d29ya0FuZENhY2hlUmVzdGF1cmFudHNJbkluZGV4ZWREQihyZXF1ZXN0KTtcclxuICAgICAgICBcclxuICAgICAgfSk7XHJcbiAgICB9ICAgIFxyXG4gIH0pO1xyXG59XHJcblxyXG4vKipcclxuICogQ3JlYXRlIGFuIGluZGV4ZWQgZGIgb2Yga2V5dmFsIHR5cGUgbmFtZWQgYHJlc3RhdXJhbnRzYFxyXG4gKi9cclxuZnVuY3Rpb24gY3JlYXRlREIgKCkge1xyXG4gIGRiUHJvbWlzZSA9IGlkYi5vcGVuKCdyZXN0YXVyYW50cycsIDEsIHVwZ3JhZGVEQiA9PiB7XHJcbiAgICB2YXIgc3RvcmUgPSB1cGdyYWRlREIuY3JlYXRlT2JqZWN0U3RvcmUoJ3Jlc3RhdXJhbnRzJywge1xyXG4gICAgICBrZXlwYXRoOiAnaWQnXHJcbiAgICB9KTtcclxuICB9KTtcclxufVxyXG5cclxuLyoqIFxyXG4gKiBPcGVuIGNhY2hlcyBvbiBpbnN0YWxsIG9mIHN3IFxyXG4gKi9cclxuc2VsZi5hZGRFdmVudExpc3RlbmVyKCdpbnN0YWxsJywgZXZlbnQgPT4ge1xyXG4gIC8vIE9wZW4gY2FjaGUgZm9yIHN0YXRpYyBjb250ZW50IGFuZCBjYWNoZSA0MDQgcGFnZVxyXG4gIGV2ZW50LndhaXRVbnRpbChcclxuICAgIGNhY2hlcy5vcGVuKENBQ0hFX1NUQVRJQykudGhlbihjYWNoZSA9PiB7XHJcbiAgICAgIGNhY2hlLmFkZEFsbChbb2ZmbGluZVBhZ2VdKTtcclxuXHQgICAgY29uc29sZS5sb2coYENhY2hlICR7Q0FDSEVfU1RBVElDfSBvcGVuZWRgKTtcclxuXHQgIH0pXHJcbiAgKTtcclxuICAgLy8gT3BlbiBjYWNoZSBmb3IgaW1hZ2VzIGNvbnRlbnRcclxuICBldmVudC53YWl0VW50aWwoXHJcbiAgICBjYWNoZXMub3BlbihDQUNIRV9JTUFHRVMpLnRoZW4oY2FjaGUgPT4ge1xyXG5cdCAgICBjb25zb2xlLmxvZyhgQ2FjaGUgJHtDQUNIRV9JTUFHRVN9IG9wZW5lZGApO1xyXG5cdCAgfSlcclxuICApO1xyXG4gIC8vY3JlYXRlIGluZGV4ZWQgZGJcclxuICBldmVudC53YWl0VW50aWwoXHJcbiAgICBjcmVhdGVEQigpXHJcbiAgKTtcclxufSk7XHJcblxyXG4vKiogXHJcbiAqIEhhbmRsZSBmZXRjaCBcclxuICovXHJcbnNlbGYuYWRkRXZlbnRMaXN0ZW5lcignZmV0Y2gnLCBldmVudCA9PiB7XHJcbiAgLy8gaGFuZGxlIHJlcXVlc3QgYWNjb3JkaW5nIHRvIGl0cyB0eXBlXHJcbiAgaWYoZXZlbnQucmVxdWVzdC51cmwuZW5kc1dpdGgoJy5qcGcnKSkge1xyXG4gICAgZXZlbnQucmVzcG9uZFdpdGgoY2FjaGVJbWFnZXMoZXZlbnQucmVxdWVzdCkpOyAgXHJcbiAgICByZXR1cm47XHJcbiAgfSBlbHNlIGlmIChldmVudC5yZXF1ZXN0LnVybC5pbmNsdWRlcygncmVzdGF1cmFudHMnKSkge1xyXG4gICAgZXZlbnQucmVzcG9uZFdpdGgoZ2V0RGF0YShldmVudC5yZXF1ZXN0KSk7XHJcbiAgICByZXR1cm47XHJcbiAgfSBcclxuICBlbHNlIHtcclxuICAgIGV2ZW50LnJlc3BvbmRXaXRoKGNhY2hlU3RhdGljQ29udGVudChldmVudC5yZXF1ZXN0KSk7XHJcbiAgICByZXR1cm47XHJcbiAgfVxyXG59KTtcclxuXHJcbiJdfQ==
