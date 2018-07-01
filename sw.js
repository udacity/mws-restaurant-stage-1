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
 * Search in indexed DB and if no result fetch from network  ///TODO recheck!!!
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
          store.put(review, review.id);
        });
      });
    });

    return networkResponse;
  })['catch'](function () {
    return caches.match(offlinePage);
  });
}

function searchIDBForReviews(request) {

  var pathSlices = request.clone().url.split("restaurant_id=");
  var restaurantId = parseInt(pathSlices[pathSlices.length - 1]) || 0;

  // if not indexed db functionality
  if (!reviewsDbPromise) return getLatestReviews(request.clone());

  return reviewsDbPromise.then(function (db) {

    if (!db) return getLatestReviews(request.clone());

    var store = db.transaction('restaurant-reviews').objectStore('restaurant-reviews');
    var index = store.index('by-restaurant');

    return index.getAll([restaurantId, '' + restaurantId]).then(function (data) {

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

function submitReview(request) {
  console.log(request);
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
 * Open caches on install of sw 
 */
self.addEventListener('install', function (event) {
  // Open cache for static content and cache 404 page

  var openStaticCachePromise = caches.open(CACHE_STATIC).then(function (cache) {
    cache.addAll([offlinePage]);
    // cache.put('start_url', fetch('/'));
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
  event.waitUntil(dbPromise);
  event.waitUntil(reviewsDbPromise);
});

/** 
 * Handle fetch 
 */
self.addEventListener('fetch', function (event) {
  // handle request according to its type

  if (event.request.method === 'POST') {
    event.respondWith(submitReview(event.request));
    return;
  }

  if (event.request.url.endsWith('.jpg')) {
    event.respondWith(cacheImages(event.request));
    return;
  } else if (event.request.url.includes('reviews')) {
    event.respondWith(searchIDBForReviews(event.request));
    return;
  } else if (event.request.url.includes('restaurants')) {
    event.respondWith(searchInIDB(event.request));
    return;
  } else {
    event.respondWith(cacheStaticContent(event.request));
    return;
  }
});

},{"idb":1}]},{},[2])
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvaWRiL2xpYi9pZGIuanMiLCJDOi9Vc2Vycy92aWNraWUvRGVza3RvcC91ZGFjaXR5L213cy1yZXN0YXVyYW50LXN0YWdlLTEvc3JjL3N3LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7O21CQ3RUZ0IsS0FBSzs7Ozs7OztBQUtyQixJQUFJLFlBQVksR0FBRyw4QkFBOEIsQ0FB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O0FBQy9DLFdBQU87R0FDUjs7QUFFRCxNQUFHLEtBQUssQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsRUFBRTtBQUNyQyxTQUFLLENBQUMsV0FBVyxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQztBQUM5QyxXQUFPO0dBQ1IsTUFBTSxJQUFJLEtBQUssQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxTQUFTLENBQUMsRUFBRTtBQUNoRCxTQUFLLENBQUMsV0FBVyxDQUFDLG1CQUFtQixDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO0FBQ3RELFdBQU87R0FDUixNQUFNLElBQUksS0FBSyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLGFBQWEsQ0FBQyxFQUFFO0FBQ3BELFNBQUssQ0FBQyxXQUFXLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO0FBQzlDLFdBQU87R0FDUixNQUFNO0FBQ0wsU0FBSyxDQUFDLFdBQVcsQ0FBQyxrQkFBa0IsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQztBQUNyRCxXQUFPO0dBQ1I7Q0FDRixDQUFDLENBQUMiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiJ3VzZSBzdHJpY3QnO1xuXG4oZnVuY3Rpb24oKSB7XG4gIGZ1bmN0aW9uIHRvQXJyYXkoYXJyKSB7XG4gICAgcmV0dXJuIEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFycik7XG4gIH1cblxuICBmdW5jdGlvbiBwcm9taXNpZnlSZXF1ZXN0KHJlcXVlc3QpIHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24ocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICByZXF1ZXN0Lm9uc3VjY2VzcyA9IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXNvbHZlKHJlcXVlc3QucmVzdWx0KTtcbiAgICAgIH07XG5cbiAgICAgIHJlcXVlc3Qub25lcnJvciA9IGZ1bmN0aW9uKCkge1xuICAgICAgICByZWplY3QocmVxdWVzdC5lcnJvcik7XG4gICAgICB9O1xuICAgIH0pO1xuICB9XG5cbiAgZnVuY3Rpb24gcHJvbWlzaWZ5UmVxdWVzdENhbGwob2JqLCBtZXRob2QsIGFyZ3MpIHtcbiAgICB2YXIgcmVxdWVzdDtcbiAgICB2YXIgcCA9IG5ldyBQcm9taXNlKGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgcmVxdWVzdCA9IG9ialttZXRob2RdLmFwcGx5KG9iaiwgYXJncyk7XG4gICAgICBwcm9taXNpZnlSZXF1ZXN0KHJlcXVlc3QpLnRoZW4ocmVzb2x2ZSwgcmVqZWN0KTtcbiAgICB9KTtcblxuICAgIHAucmVxdWVzdCA9IHJlcXVlc3Q7XG4gICAgcmV0dXJuIHA7XG4gIH1cbiAgXG4gIGZ1bmN0aW9uIHByb21pc2lmeUN1cnNvclJlcXVlc3RDYWxsKG9iaiwgbWV0aG9kLCBhcmdzKSB7XG4gICAgdmFyIHAgPSBwcm9taXNpZnlSZXF1ZXN0Q2FsbChvYmosIG1ldGhvZCwgYXJncyk7XG4gICAgcmV0dXJuIHAudGhlbihmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgaWYgKCF2YWx1ZSkgcmV0dXJuO1xuICAgICAgcmV0dXJuIG5ldyBDdXJzb3IodmFsdWUsIHAucmVxdWVzdCk7XG4gICAgfSk7XG4gIH1cblxuICBmdW5jdGlvbiBwcm94eVByb3BlcnRpZXMoUHJveHlDbGFzcywgdGFyZ2V0UHJvcCwgcHJvcGVydGllcykge1xuICAgIHByb3BlcnRpZXMuZm9yRWFjaChmdW5jdGlvbihwcm9wKSB7XG4gICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoUHJveHlDbGFzcy5wcm90b3R5cGUsIHByb3AsIHtcbiAgICAgICAgZ2V0OiBmdW5jdGlvbigpIHtcbiAgICAgICAgICByZXR1cm4gdGhpc1t0YXJnZXRQcm9wXVtwcm9wXTtcbiAgICAgICAgfSxcbiAgICAgICAgc2V0OiBmdW5jdGlvbih2YWwpIHtcbiAgICAgICAgICB0aGlzW3RhcmdldFByb3BdW3Byb3BdID0gdmFsO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHByb3h5UmVxdWVzdE1ldGhvZHMoUHJveHlDbGFzcywgdGFyZ2V0UHJvcCwgQ29uc3RydWN0b3IsIHByb3BlcnRpZXMpIHtcbiAgICBwcm9wZXJ0aWVzLmZvckVhY2goZnVuY3Rpb24ocHJvcCkge1xuICAgICAgaWYgKCEocHJvcCBpbiBDb25zdHJ1Y3Rvci5wcm90b3R5cGUpKSByZXR1cm47XG4gICAgICBQcm94eUNsYXNzLnByb3RvdHlwZVtwcm9wXSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gcHJvbWlzaWZ5UmVxdWVzdENhbGwodGhpc1t0YXJnZXRQcm9wXSwgcHJvcCwgYXJndW1lbnRzKTtcbiAgICAgIH07XG4gICAgfSk7XG4gIH1cblxuICBmdW5jdGlvbiBwcm94eU1ldGhvZHMoUHJveHlDbGFzcywgdGFyZ2V0UHJvcCwgQ29uc3RydWN0b3IsIHByb3BlcnRpZXMpIHtcbiAgICBwcm9wZXJ0aWVzLmZvckVhY2goZnVuY3Rpb24ocHJvcCkge1xuICAgICAgaWYgKCEocHJvcCBpbiBDb25zdHJ1Y3Rvci5wcm90b3R5cGUpKSByZXR1cm47XG4gICAgICBQcm94eUNsYXNzLnByb3RvdHlwZVtwcm9wXSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gdGhpc1t0YXJnZXRQcm9wXVtwcm9wXS5hcHBseSh0aGlzW3RhcmdldFByb3BdLCBhcmd1bWVudHMpO1xuICAgICAgfTtcbiAgICB9KTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHByb3h5Q3Vyc29yUmVxdWVzdE1ldGhvZHMoUHJveHlDbGFzcywgdGFyZ2V0UHJvcCwgQ29uc3RydWN0b3IsIHByb3BlcnRpZXMpIHtcbiAgICBwcm9wZXJ0aWVzLmZvckVhY2goZnVuY3Rpb24ocHJvcCkge1xuICAgICAgaWYgKCEocHJvcCBpbiBDb25zdHJ1Y3Rvci5wcm90b3R5cGUpKSByZXR1cm47XG4gICAgICBQcm94eUNsYXNzLnByb3RvdHlwZVtwcm9wXSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gcHJvbWlzaWZ5Q3Vyc29yUmVxdWVzdENhbGwodGhpc1t0YXJnZXRQcm9wXSwgcHJvcCwgYXJndW1lbnRzKTtcbiAgICAgIH07XG4gICAgfSk7XG4gIH1cblxuICBmdW5jdGlvbiBJbmRleChpbmRleCkge1xuICAgIHRoaXMuX2luZGV4ID0gaW5kZXg7XG4gIH1cblxuICBwcm94eVByb3BlcnRpZXMoSW5kZXgsICdfaW5kZXgnLCBbXG4gICAgJ25hbWUnLFxuICAgICdrZXlQYXRoJyxcbiAgICAnbXVsdGlFbnRyeScsXG4gICAgJ3VuaXF1ZSdcbiAgXSk7XG5cbiAgcHJveHlSZXF1ZXN0TWV0aG9kcyhJbmRleCwgJ19pbmRleCcsIElEQkluZGV4LCBbXG4gICAgJ2dldCcsXG4gICAgJ2dldEtleScsXG4gICAgJ2dldEFsbCcsXG4gICAgJ2dldEFsbEtleXMnLFxuICAgICdjb3VudCdcbiAgXSk7XG5cbiAgcHJveHlDdXJzb3JSZXF1ZXN0TWV0aG9kcyhJbmRleCwgJ19pbmRleCcsIElEQkluZGV4LCBbXG4gICAgJ29wZW5DdXJzb3InLFxuICAgICdvcGVuS2V5Q3Vyc29yJ1xuICBdKTtcblxuICBmdW5jdGlvbiBDdXJzb3IoY3Vyc29yLCByZXF1ZXN0KSB7XG4gICAgdGhpcy5fY3Vyc29yID0gY3Vyc29yO1xuICAgIHRoaXMuX3JlcXVlc3QgPSByZXF1ZXN0O1xuICB9XG5cbiAgcHJveHlQcm9wZXJ0aWVzKEN1cnNvciwgJ19jdXJzb3InLCBbXG4gICAgJ2RpcmVjdGlvbicsXG4gICAgJ2tleScsXG4gICAgJ3ByaW1hcnlLZXknLFxuICAgICd2YWx1ZSdcbiAgXSk7XG5cbiAgcHJveHlSZXF1ZXN0TWV0aG9kcyhDdXJzb3IsICdfY3Vyc29yJywgSURCQ3Vyc29yLCBbXG4gICAgJ3VwZGF0ZScsXG4gICAgJ2RlbGV0ZSdcbiAgXSk7XG5cbiAgLy8gcHJveHkgJ25leHQnIG1ldGhvZHNcbiAgWydhZHZhbmNlJywgJ2NvbnRpbnVlJywgJ2NvbnRpbnVlUHJpbWFyeUtleSddLmZvckVhY2goZnVuY3Rpb24obWV0aG9kTmFtZSkge1xuICAgIGlmICghKG1ldGhvZE5hbWUgaW4gSURCQ3Vyc29yLnByb3RvdHlwZSkpIHJldHVybjtcbiAgICBDdXJzb3IucHJvdG90eXBlW21ldGhvZE5hbWVdID0gZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgY3Vyc29yID0gdGhpcztcbiAgICAgIHZhciBhcmdzID0gYXJndW1lbnRzO1xuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpLnRoZW4oZnVuY3Rpb24oKSB7XG4gICAgICAgIGN1cnNvci5fY3Vyc29yW21ldGhvZE5hbWVdLmFwcGx5KGN1cnNvci5fY3Vyc29yLCBhcmdzKTtcbiAgICAgICAgcmV0dXJuIHByb21pc2lmeVJlcXVlc3QoY3Vyc29yLl9yZXF1ZXN0KS50aGVuKGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICAgICAgaWYgKCF2YWx1ZSkgcmV0dXJuO1xuICAgICAgICAgIHJldHVybiBuZXcgQ3Vyc29yKHZhbHVlLCBjdXJzb3IuX3JlcXVlc3QpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH07XG4gIH0pO1xuXG4gIGZ1bmN0aW9uIE9iamVjdFN0b3JlKHN0b3JlKSB7XG4gICAgdGhpcy5fc3RvcmUgPSBzdG9yZTtcbiAgfVxuXG4gIE9iamVjdFN0b3JlLnByb3RvdHlwZS5jcmVhdGVJbmRleCA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBuZXcgSW5kZXgodGhpcy5fc3RvcmUuY3JlYXRlSW5kZXguYXBwbHkodGhpcy5fc3RvcmUsIGFyZ3VtZW50cykpO1xuICB9O1xuXG4gIE9iamVjdFN0b3JlLnByb3RvdHlwZS5pbmRleCA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBuZXcgSW5kZXgodGhpcy5fc3RvcmUuaW5kZXguYXBwbHkodGhpcy5fc3RvcmUsIGFyZ3VtZW50cykpO1xuICB9O1xuXG4gIHByb3h5UHJvcGVydGllcyhPYmplY3RTdG9yZSwgJ19zdG9yZScsIFtcbiAgICAnbmFtZScsXG4gICAgJ2tleVBhdGgnLFxuICAgICdpbmRleE5hbWVzJyxcbiAgICAnYXV0b0luY3JlbWVudCdcbiAgXSk7XG5cbiAgcHJveHlSZXF1ZXN0TWV0aG9kcyhPYmplY3RTdG9yZSwgJ19zdG9yZScsIElEQk9iamVjdFN0b3JlLCBbXG4gICAgJ3B1dCcsXG4gICAgJ2FkZCcsXG4gICAgJ2RlbGV0ZScsXG4gICAgJ2NsZWFyJyxcbiAgICAnZ2V0JyxcbiAgICAnZ2V0QWxsJyxcbiAgICAnZ2V0S2V5JyxcbiAgICAnZ2V0QWxsS2V5cycsXG4gICAgJ2NvdW50J1xuICBdKTtcblxuICBwcm94eUN1cnNvclJlcXVlc3RNZXRob2RzKE9iamVjdFN0b3JlLCAnX3N0b3JlJywgSURCT2JqZWN0U3RvcmUsIFtcbiAgICAnb3BlbkN1cnNvcicsXG4gICAgJ29wZW5LZXlDdXJzb3InXG4gIF0pO1xuXG4gIHByb3h5TWV0aG9kcyhPYmplY3RTdG9yZSwgJ19zdG9yZScsIElEQk9iamVjdFN0b3JlLCBbXG4gICAgJ2RlbGV0ZUluZGV4J1xuICBdKTtcblxuICBmdW5jdGlvbiBUcmFuc2FjdGlvbihpZGJUcmFuc2FjdGlvbikge1xuICAgIHRoaXMuX3R4ID0gaWRiVHJhbnNhY3Rpb247XG4gICAgdGhpcy5jb21wbGV0ZSA9IG5ldyBQcm9taXNlKGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgaWRiVHJhbnNhY3Rpb24ub25jb21wbGV0ZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXNvbHZlKCk7XG4gICAgICB9O1xuICAgICAgaWRiVHJhbnNhY3Rpb24ub25lcnJvciA9IGZ1bmN0aW9uKCkge1xuICAgICAgICByZWplY3QoaWRiVHJhbnNhY3Rpb24uZXJyb3IpO1xuICAgICAgfTtcbiAgICAgIGlkYlRyYW5zYWN0aW9uLm9uYWJvcnQgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgcmVqZWN0KGlkYlRyYW5zYWN0aW9uLmVycm9yKTtcbiAgICAgIH07XG4gICAgfSk7XG4gIH1cblxuICBUcmFuc2FjdGlvbi5wcm90b3R5cGUub2JqZWN0U3RvcmUgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gbmV3IE9iamVjdFN0b3JlKHRoaXMuX3R4Lm9iamVjdFN0b3JlLmFwcGx5KHRoaXMuX3R4LCBhcmd1bWVudHMpKTtcbiAgfTtcblxuICBwcm94eVByb3BlcnRpZXMoVHJhbnNhY3Rpb24sICdfdHgnLCBbXG4gICAgJ29iamVjdFN0b3JlTmFtZXMnLFxuICAgICdtb2RlJ1xuICBdKTtcblxuICBwcm94eU1ldGhvZHMoVHJhbnNhY3Rpb24sICdfdHgnLCBJREJUcmFuc2FjdGlvbiwgW1xuICAgICdhYm9ydCdcbiAgXSk7XG5cbiAgZnVuY3Rpb24gVXBncmFkZURCKGRiLCBvbGRWZXJzaW9uLCB0cmFuc2FjdGlvbikge1xuICAgIHRoaXMuX2RiID0gZGI7XG4gICAgdGhpcy5vbGRWZXJzaW9uID0gb2xkVmVyc2lvbjtcbiAgICB0aGlzLnRyYW5zYWN0aW9uID0gbmV3IFRyYW5zYWN0aW9uKHRyYW5zYWN0aW9uKTtcbiAgfVxuXG4gIFVwZ3JhZGVEQi5wcm90b3R5cGUuY3JlYXRlT2JqZWN0U3RvcmUgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gbmV3IE9iamVjdFN0b3JlKHRoaXMuX2RiLmNyZWF0ZU9iamVjdFN0b3JlLmFwcGx5KHRoaXMuX2RiLCBhcmd1bWVudHMpKTtcbiAgfTtcblxuICBwcm94eVByb3BlcnRpZXMoVXBncmFkZURCLCAnX2RiJywgW1xuICAgICduYW1lJyxcbiAgICAndmVyc2lvbicsXG4gICAgJ29iamVjdFN0b3JlTmFtZXMnXG4gIF0pO1xuXG4gIHByb3h5TWV0aG9kcyhVcGdyYWRlREIsICdfZGInLCBJREJEYXRhYmFzZSwgW1xuICAgICdkZWxldGVPYmplY3RTdG9yZScsXG4gICAgJ2Nsb3NlJ1xuICBdKTtcblxuICBmdW5jdGlvbiBEQihkYikge1xuICAgIHRoaXMuX2RiID0gZGI7XG4gIH1cblxuICBEQi5wcm90b3R5cGUudHJhbnNhY3Rpb24gPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gbmV3IFRyYW5zYWN0aW9uKHRoaXMuX2RiLnRyYW5zYWN0aW9uLmFwcGx5KHRoaXMuX2RiLCBhcmd1bWVudHMpKTtcbiAgfTtcblxuICBwcm94eVByb3BlcnRpZXMoREIsICdfZGInLCBbXG4gICAgJ25hbWUnLFxuICAgICd2ZXJzaW9uJyxcbiAgICAnb2JqZWN0U3RvcmVOYW1lcydcbiAgXSk7XG5cbiAgcHJveHlNZXRob2RzKERCLCAnX2RiJywgSURCRGF0YWJhc2UsIFtcbiAgICAnY2xvc2UnXG4gIF0pO1xuXG4gIC8vIEFkZCBjdXJzb3IgaXRlcmF0b3JzXG4gIC8vIFRPRE86IHJlbW92ZSB0aGlzIG9uY2UgYnJvd3NlcnMgZG8gdGhlIHJpZ2h0IHRoaW5nIHdpdGggcHJvbWlzZXNcbiAgWydvcGVuQ3Vyc29yJywgJ29wZW5LZXlDdXJzb3InXS5mb3JFYWNoKGZ1bmN0aW9uKGZ1bmNOYW1lKSB7XG4gICAgW09iamVjdFN0b3JlLCBJbmRleF0uZm9yRWFjaChmdW5jdGlvbihDb25zdHJ1Y3Rvcikge1xuICAgICAgQ29uc3RydWN0b3IucHJvdG90eXBlW2Z1bmNOYW1lLnJlcGxhY2UoJ29wZW4nLCAnaXRlcmF0ZScpXSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgYXJncyA9IHRvQXJyYXkoYXJndW1lbnRzKTtcbiAgICAgICAgdmFyIGNhbGxiYWNrID0gYXJnc1thcmdzLmxlbmd0aCAtIDFdO1xuICAgICAgICB2YXIgbmF0aXZlT2JqZWN0ID0gdGhpcy5fc3RvcmUgfHwgdGhpcy5faW5kZXg7XG4gICAgICAgIHZhciByZXF1ZXN0ID0gbmF0aXZlT2JqZWN0W2Z1bmNOYW1lXS5hcHBseShuYXRpdmVPYmplY3QsIGFyZ3Muc2xpY2UoMCwgLTEpKTtcbiAgICAgICAgcmVxdWVzdC5vbnN1Y2Nlc3MgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICBjYWxsYmFjayhyZXF1ZXN0LnJlc3VsdCk7XG4gICAgICAgIH07XG4gICAgICB9O1xuICAgIH0pO1xuICB9KTtcblxuICAvLyBwb2x5ZmlsbCBnZXRBbGxcbiAgW0luZGV4LCBPYmplY3RTdG9yZV0uZm9yRWFjaChmdW5jdGlvbihDb25zdHJ1Y3Rvcikge1xuICAgIGlmIChDb25zdHJ1Y3Rvci5wcm90b3R5cGUuZ2V0QWxsKSByZXR1cm47XG4gICAgQ29uc3RydWN0b3IucHJvdG90eXBlLmdldEFsbCA9IGZ1bmN0aW9uKHF1ZXJ5LCBjb3VudCkge1xuICAgICAgdmFyIGluc3RhbmNlID0gdGhpcztcbiAgICAgIHZhciBpdGVtcyA9IFtdO1xuXG4gICAgICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24ocmVzb2x2ZSkge1xuICAgICAgICBpbnN0YW5jZS5pdGVyYXRlQ3Vyc29yKHF1ZXJ5LCBmdW5jdGlvbihjdXJzb3IpIHtcbiAgICAgICAgICBpZiAoIWN1cnNvcikge1xuICAgICAgICAgICAgcmVzb2x2ZShpdGVtcyk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgfVxuICAgICAgICAgIGl0ZW1zLnB1c2goY3Vyc29yLnZhbHVlKTtcblxuICAgICAgICAgIGlmIChjb3VudCAhPT0gdW5kZWZpbmVkICYmIGl0ZW1zLmxlbmd0aCA9PSBjb3VudCkge1xuICAgICAgICAgICAgcmVzb2x2ZShpdGVtcyk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgfVxuICAgICAgICAgIGN1cnNvci5jb250aW51ZSgpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH07XG4gIH0pO1xuXG4gIHZhciBleHAgPSB7XG4gICAgb3BlbjogZnVuY3Rpb24obmFtZSwgdmVyc2lvbiwgdXBncmFkZUNhbGxiYWNrKSB7XG4gICAgICB2YXIgcCA9IHByb21pc2lmeVJlcXVlc3RDYWxsKGluZGV4ZWREQiwgJ29wZW4nLCBbbmFtZSwgdmVyc2lvbl0pO1xuICAgICAgdmFyIHJlcXVlc3QgPSBwLnJlcXVlc3Q7XG5cbiAgICAgIHJlcXVlc3Qub251cGdyYWRlbmVlZGVkID0gZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgaWYgKHVwZ3JhZGVDYWxsYmFjaykge1xuICAgICAgICAgIHVwZ3JhZGVDYWxsYmFjayhuZXcgVXBncmFkZURCKHJlcXVlc3QucmVzdWx0LCBldmVudC5vbGRWZXJzaW9uLCByZXF1ZXN0LnRyYW5zYWN0aW9uKSk7XG4gICAgICAgIH1cbiAgICAgIH07XG5cbiAgICAgIHJldHVybiBwLnRoZW4oZnVuY3Rpb24oZGIpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBEQihkYik7XG4gICAgICB9KTtcbiAgICB9LFxuICAgIGRlbGV0ZTogZnVuY3Rpb24obmFtZSkge1xuICAgICAgcmV0dXJuIHByb21pc2lmeVJlcXVlc3RDYWxsKGluZGV4ZWREQiwgJ2RlbGV0ZURhdGFiYXNlJywgW25hbWVdKTtcbiAgICB9XG4gIH07XG5cbiAgaWYgKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgbW9kdWxlLmV4cG9ydHMgPSBleHA7XG4gIH1cbiAgZWxzZSB7XG4gICAgc2VsZi5pZGIgPSBleHA7XG4gIH1cbn0oKSk7XG4iLCJpbXBvcnQgaWRiIGZyb20gJ2lkYic7XHJcblxyXG4vKiogXHJcbiAqIFNlcGFyYXRlIGNhY2hlcyBmb3IgdGhlIGpwZyBpbWFnZXMgYW5kIGFsbCB0aGUgb3RoZXIgY29udGVudCBcclxuICovXHJcbnZhciBDQUNIRV9TVEFUSUMgPSAncmVzdGF1cmFudC1yZXZpZXdzLXN0YXRpYy12MSc7XHJcbnZhciBDQUNIRV9JTUFHRVMgPSAncmVzdGF1cmFudC1yZXZpZXdzLWltYWdlcy12MSc7XHJcbmNvbnN0IG9mZmxpbmVQYWdlID0gJy4vNDA0Lmh0bWwnO1xyXG52YXIgZGJQcm9taXNlO1xyXG52YXIgcmV2aWV3c0RiUHJvbWlzZTtcclxuXHJcbi8qKiBcclxuICogRmV0Y2ggYW5kIGNhY2hlIGltYWdlIHJlcXVlc3QgXHJcbiAqL1xyXG5mdW5jdGlvbiBjYWNoZUltYWdlcyhyZXF1ZXN0KSB7XHJcbiAgXHJcbiAgLy8gUmVtb3ZlIHNpemUtcmVsYXRlZCBpbmZvIGZyb20gaW1hZ2UgbmFtZSBcclxuICB2YXIgdXJsVG9GZXRjaCA9IHJlcXVlc3QudXJsLnNsaWNlKDAsIHJlcXVlc3QudXJsLmluZGV4T2YoJy0nKSk7XHJcbiAgIFxyXG4gIFxyXG4gIHJldHVybiBjYWNoZXMub3BlbihDQUNIRV9JTUFHRVMpLnRoZW4oY2FjaGUgPT4geyAgXHJcbiAgICByZXR1cm4gY2FjaGUubWF0Y2godXJsVG9GZXRjaCkudGhlbihyZXNwb25zZSA9PiB7XHJcbiAgXHJcbiAgICAgIC8vIENhY2hlIGhpdCAtIHJldHVybiByZXNwb25zZSBlbHNlIGZldGNoXHJcbiAgICAgIC8vIFdlIGNsb25lIHRoZSByZXF1ZXN0IGJlY2F1c2UgaXQncyBhIHN0cmVhbSBhbmQgY2FuIGJlIGNvbnN1bWVkIG9ubHkgb25jZVxyXG4gICAgICB2YXIgbmV0d29ya0ZldGNoID0gZmV0Y2gocmVxdWVzdC5jbG9uZSgpKS50aGVuKChuZXR3b3JrUmVzcG9uc2UpID0+IHtcclxuICAgICAgICAvLyBDaGVjayBpZiB3ZSByZWNlaXZlZCBhbiBpbnZhbGlkIHJlc3BvbnNlXHJcbiAgICAgICAgaWYobmV0d29ya1Jlc3BvbnNlLnN0YXR1cyA9PSA0MDQpIHJldHVybjtcclxuXHJcbiAgICAgICAgLy8gV2UgY2xvbmUgdGhlIHJlc3BvbnNlIGJlY2F1c2UgaXQncyBhIHN0cmVhbSBhbmQgY2FuIGJlIGNvbnN1bWVkIG9ubHkgb25jZVxyXG4gICAgICAgIGNhY2hlLnB1dCh1cmxUb0ZldGNoLCBuZXR3b3JrUmVzcG9uc2UuY2xvbmUoKSk7XHJcblxyXG4gICAgICAgIHJldHVybiBuZXR3b3JrUmVzcG9uc2U7XHJcblxyXG4gICAgICB9LCAocmVqZWN0ZWQpID0+IHtcclxuICAgICAgICByZXR1cm4gcmVzcG9uc2U7XHJcbiAgICAgIH0pLmNhdGNoKCgpID0+IHtcclxuICAgICAgICByZXR1cm4gcmVzcG9uc2U7XHJcbiAgICAgIH0pO1xyXG5cclxuICAgICAgLy8gLy9pZiBhY2Nlc3MgdG8gbmV0d29yayBpcyBnb29kIHdlIHdhbnQgdGhlIGJlc3QgcXVhbGl0eSBpbWFnZVxyXG4gICAgICByZXR1cm4gbmV0d29ya0ZldGNoO1xyXG5cclxuICAgIH0pLmNhdGNoKCgpID0+IHsgXHJcblxyXG4gICAgICByZXR1cm4gZmV0Y2gocmVxdWVzdC5jbG9uZSgpKS50aGVuKChuZXR3b3JrUmVzcG9uc2UpID0+IHtcclxuICAgICAgICAvLyBDaGVjayBpZiB3ZSByZWNlaXZlZCBhbiBpbnZhbGlkIHJlc3BvbnNlXHJcbiAgICAgICAgaWYobmV0d29ya1Jlc3BvbnNlLnN0YXR1cyA9PSA0MDQpIHJldHVybjtcclxuXHJcbiAgICAgICAgLy8gV2UgY2xvbmUgdGhlIHJlc3BvbnNlIGJlY2F1c2UgaXQncyBhIHN0cmVhbSBhbmQgY2FuIGJlIGNvbnN1bWVkIG9ubHkgb25jZVxyXG4gICAgICAgIGNhY2hlLnB1dCh1cmxUb0ZldGNoLCBuZXR3b3JrUmVzcG9uc2UuY2xvbmUoKSk7XHJcblxyXG4gICAgICAgIHJldHVybiBuZXR3b3JrUmVzcG9uc2U7XHJcblxyXG4gICAgICB9LCAocmVqZWN0ZWQpID0+IHtcclxuICAgICAgICByZXR1cm4gY2FjaGVzLm1hdGNoKG9mZmxpbmVQYWdlKTsgXHJcbiAgICAgIH0pLmNhdGNoKCgpID0+IHtcclxuICAgICAgICByZXR1cm4gY2FjaGVzLm1hdGNoKG9mZmxpbmVQYWdlKTsgXHJcbiAgICAgIH0pO1xyXG4gICAgfSlcclxuICB9KTtcclxufVxyXG5cclxuLyoqIFxyXG4gKiBGZXRjaCBhbmQgY2FjaGUgc3RhdGljIGNvbnRlbnQgYW5kIGdvb2dsZSBtYXAgcmVsYXRlZCBjb250ZW50IFxyXG4gKi9cclxuIGZ1bmN0aW9uIGNhY2hlU3RhdGljQ29udGVudChyZXF1ZXN0KSB7XHJcbiAgICBcclxuICByZXR1cm4gY2FjaGVzLm9wZW4oQ0FDSEVfU1RBVElDKS50aGVuKGNhY2hlID0+IHtcclxuICAgIHJldHVybiBjYWNoZS5tYXRjaChyZXF1ZXN0KS50aGVuKHJlc3BvbnNlID0+IHtcclxuICAgIFxyXG4gICAgICAgIC8vIENhY2hlIGhpdCAtIHJldHVybiByZXNwb25zZSBlbHNlIGZldGNoXHJcbiAgICAgICAgLy8gV2UgY2xvbmUgdGhlIHJlcXVlc3QgYmVjYXVzZSBpdCdzIGEgc3RyZWFtIGFuZCBjYW4gYmUgY29uc3VtZWQgb25seSBvbmNlXHJcbiAgICAgIHJldHVybiByZXNwb25zZSB8fCBmZXRjaChyZXF1ZXN0LmNsb25lKCkpLnRoZW4obmV0d29ya1Jlc3BvbnNlID0+IHtcclxuICAgICAgICAvLyBDaGVjayBpZiB3ZSByZWNlaXZlZCBhbiBpbnZhbGlkIHJlc3BvbnNlXHJcbiAgICAgICAgaWYobmV0d29ya1Jlc3BvbnNlLnN0YXR1cyA9PSA0MDQpIHJldHVybjtcclxuICAgIFxyXG4gICAgICAgIC8vIFdlIGNsb25lIHRoZSByZXNwb25zZSBiZWNhdXNlIGl0J3MgYSBzdHJlYW0gYW5kIGNhbiBiZSBjb25zdW1lZCBvbmx5IG9uY2VcclxuICAgICAgICBjYWNoZS5wdXQocmVxdWVzdCwgbmV0d29ya1Jlc3BvbnNlLmNsb25lKCkpO1xyXG4gICAgICAgIHJldHVybiBuZXR3b3JrUmVzcG9uc2U7XHJcblxyXG4gICAgICB9KS5jYXRjaCgoKSA9PiB7IFxyXG4gICAgICAgIHJldHVybiBjYWNoZXMubWF0Y2gob2ZmbGluZVBhZ2UpOyBcclxuICAgICAgfSlcclxuICAgIH0pO1xyXG4gIH0pO1xyXG59XHJcblxyXG4vKipcclxuICogU2VhcmNoIGluIGluZGV4ZWQgREIgYW5kIGlmIG5vIHJlc3VsdCBmZXRjaCBmcm9tIG5ldHdvcmsgIC8vL1RPRE8gcmVjaGVjayEhIVxyXG4gKi9cclxuZnVuY3Rpb24gZ2V0TGF0ZXN0RGF0YShyZXF1ZXN0KSB7XHJcblxyXG4gIHZhciBwYXRoU2xpY2VzID0gcmVxdWVzdC51cmwuc3BsaXQoXCIvXCIpO1xyXG4gIHZhciByZXN0YXVyYW50SWQgPSBwYXJzZUludChwYXRoU2xpY2VzW3BhdGhTbGljZXMubGVuZ3RoIC0gMV0pIHx8IDA7XHJcblxyXG4gIHJldHVybiBmZXRjaChyZXF1ZXN0LmNsb25lKCkpLnRoZW4obmV0d29ya1Jlc3BvbnNlID0+IHtcclxuXHJcbiAgICBpZihuZXR3b3JrUmVzcG9uc2Uuc3RhdHVzID09IDQwNCkgcmV0dXJuO1xyXG5cclxuICAgIG5ldHdvcmtSZXNwb25zZS5jbG9uZSgpLmpzb24oKS50aGVuKGpzb24gPT4ge1xyXG5cclxuICAgICAgaWYoIWRiUHJvbWlzZSkgcmV0dXJuO1xyXG5cclxuICAgICAgZGJQcm9taXNlLnRoZW4oZGIgPT4ge1xyXG4gICAgICAgICAgICBcclxuICAgICAgICBpZighZGIpIHJldHVybjtcclxuXHJcbiAgICAgICAgdmFyIHR4ID0gZGIudHJhbnNhY3Rpb24oJ3Jlc3RhdXJhbnRzJywgJ3JlYWR3cml0ZScpO1xyXG4gICAgICAgIHZhciBzdG9yZSA9IHR4Lm9iamVjdFN0b3JlKCdyZXN0YXVyYW50cycpO1xyXG5cclxuICAgICAgICBpZighcmVzdGF1cmFudElkKXsgLy8gaWYgd2UgcmVmZXIgdG8gYWxsIGRhdGFcclxuXHJcbiAgICAgICAgICBqc29uLmZvckVhY2gocmVzdGF1cmFudCA9PiB7XHJcbiAgICAgICAgICAgIHN0b3JlLnB1dChyZXN0YXVyYW50LCByZXN0YXVyYW50LmlkKTtcclxuICAgICAgICAgIH0pO1xyXG4gICAgICAgIFxyXG4gICAgICAgIH0gZWxzZSB7IC8vIGlmIHdlIHJlZmVyIHRvIHBlciByZXN0YXVyYW50IGRhdGEgXHJcbiAgICAgICAgICAgc3RvcmUucHV0KGpzb24sIGpzb24uaWQpO1xyXG4gICAgICAgIH1cclxuICAgICAgfSk7XHJcbiAgICB9KTtcclxuXHJcbiAgICByZXR1cm4gbmV0d29ya1Jlc3BvbnNlO1xyXG5cclxuICB9KS5jYXRjaCgoKSA9PiB7XHJcbiAgICByZXR1cm4gY2FjaGVzLm1hdGNoKG9mZmxpbmVQYWdlKTsgXHJcbiAgfSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHNlYXJjaEluSURCKHJlcXVlc3QpIHtcclxuXHJcbiAgdmFyIHBhdGhTbGljZXMgPSByZXF1ZXN0LmNsb25lKCkudXJsLnNwbGl0KFwiL1wiKTtcclxuICB2YXIgcmVzdGF1cmFudElkID0gcGFyc2VJbnQocGF0aFNsaWNlc1twYXRoU2xpY2VzLmxlbmd0aCAtIDFdKSB8fCAwO1xyXG4gIHZhciBkYXRhUHJvbWlzZTtcclxuXHJcbiAgLy8gaWYgbm90IGluZGV4ZWQgZGIgZnVuY3Rpb25hbGl0eVxyXG4gIGlmKCFkYlByb21pc2UpIHJldHVybiBnZXRMYXRlc3REYXRhKHJlcXVlc3QuY2xvbmUoKSk7XHJcblxyXG4gIHJldHVybiBkYlByb21pc2UudGhlbihkYiA9PiB7XHJcbiAgICBcclxuICAgIGlmKCFkYikgcmV0dXJuIGdldExhdGVzdERhdGEocmVxdWVzdC5jbG9uZSgpKTtcclxuXHJcbiAgICB2YXIgc3RvcmUgPSBkYi50cmFuc2FjdGlvbigncmVzdGF1cmFudHMnKS5vYmplY3RTdG9yZSgncmVzdGF1cmFudHMnKTtcclxuXHJcbiAgICBpZighcmVzdGF1cmFudElkKSB7IC8vIGlmIGFsbCBkYXRhIGFyZSByZXF1ZXN0ZWRcclxuICAgICAgZGF0YVByb21pc2UgPSBzdG9yZS5nZXRBbGwoKTtcclxuICAgIH0gZWxzZSB7IC8vIGlmIHBlciByZXN0YXVyYW50IGRhdGEgYXJlIHJlcXVlc3RlZFxyXG4gICAgICBkYXRhUHJvbWlzZSA9IHN0b3JlLmdldChyZXN0YXVyYW50SWQpO1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICBpZighZGF0YVByb21pc2UpIHJldHVybiBnZXRMYXRlc3REYXRhKHJlcXVlc3QuY2xvbmUoKSk7XHJcblxyXG4gICAgcmV0dXJuIGRhdGFQcm9taXNlLnRoZW4oZGF0YSA9PiB7ICBcclxuXHJcbiAgICAgIHZhciBuZXR3b3JrRmV0Y2ggPSBnZXRMYXRlc3REYXRhKHJlcXVlc3QuY2xvbmUoKSk7XHJcblxyXG4gICAgICAvLyBpZiBkYXRhIGZvdW5kIGluIGluZGV4ZWQgZGIgcmV0dXJuIHRoZW1cclxuICAgICAgaWYoSlNPTi5zdHJpbmdpZnkoZGF0YSkgIT09IEpTT04uc3RyaW5naWZ5KFtdKSAmJiBkYXRhICE9PSB1bmRlZmluZWQpICB7IFxyXG5cclxuICAgICAgICBjb25zb2xlLmxvZygnRm91bmQgY2FjaGVkJyk7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBSZXNwb25zZShKU09OLnN0cmluZ2lmeShkYXRhKSk7IFxyXG4gICAgICB9XHJcblxyXG4gICAgICByZXR1cm4gbmV0d29ya0ZldGNoO1xyXG4gICAgfSk7XHJcbiAgfSkuY2F0Y2goKCkgPT4ge1xyXG4gICAgcmV0dXJuIGNhY2hlcy5tYXRjaChvZmZsaW5lUGFnZSk7IFxyXG4gIH0pO1xyXG59XHJcblxyXG5mdW5jdGlvbiBnZXRMYXRlc3RSZXZpZXdzKHJlcXVlc3QpIHtcclxuICBcclxuICByZXR1cm4gZmV0Y2gocmVxdWVzdC5jbG9uZSgpKS50aGVuKG5ldHdvcmtSZXNwb25zZSA9PiB7XHJcblxyXG4gICAgaWYobmV0d29ya1Jlc3BvbnNlLnN0YXR1cyA9PSA0MDQpIHJldHVybjtcclxuXHJcbiAgICBuZXR3b3JrUmVzcG9uc2UuY2xvbmUoKS5qc29uKCkudGhlbihqc29uID0+IHtcclxuXHJcbiAgICAgIGlmKCFyZXZpZXdzRGJQcm9taXNlKSByZXR1cm47XHJcblxyXG4gICAgICByZXZpZXdzRGJQcm9taXNlLnRoZW4oZGIgPT4ge1xyXG4gICAgICAgICAgICBcclxuICAgICAgICBpZighZGIpIHJldHVybjtcclxuXHJcbiAgICAgICAgdmFyIHR4ID0gZGIudHJhbnNhY3Rpb24oJ3Jlc3RhdXJhbnQtcmV2aWV3cycsICdyZWFkd3JpdGUnKTtcclxuICAgICAgICB2YXIgc3RvcmUgPSB0eC5vYmplY3RTdG9yZSgncmVzdGF1cmFudC1yZXZpZXdzJyk7XHJcblxyXG4gICAgICAgIGpzb24uZm9yRWFjaChyZXZpZXcgPT4ge1xyXG4gICAgICAgICAgc3RvcmUucHV0KHJldmlldywgcmV2aWV3LmlkKTtcclxuICAgICAgICB9KTtcclxuICAgICAgfSk7XHJcbiAgICB9KTtcclxuXHJcbiAgICByZXR1cm4gbmV0d29ya1Jlc3BvbnNlO1xyXG5cclxuICB9KS5jYXRjaCgoKSA9PiB7XHJcbiAgICByZXR1cm4gY2FjaGVzLm1hdGNoKG9mZmxpbmVQYWdlKTsgXHJcbiAgfSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHNlYXJjaElEQkZvclJldmlld3MocmVxdWVzdCkge1xyXG5cclxuICB2YXIgcGF0aFNsaWNlcyA9IHJlcXVlc3QuY2xvbmUoKS51cmwuc3BsaXQoXCJyZXN0YXVyYW50X2lkPVwiKTtcclxuICB2YXIgcmVzdGF1cmFudElkID0gcGFyc2VJbnQocGF0aFNsaWNlc1twYXRoU2xpY2VzLmxlbmd0aCAtIDFdKSB8fCAwO1xyXG5cclxuICAvLyBpZiBub3QgaW5kZXhlZCBkYiBmdW5jdGlvbmFsaXR5XHJcbiAgaWYoIXJldmlld3NEYlByb21pc2UpIHJldHVybiBnZXRMYXRlc3RSZXZpZXdzKHJlcXVlc3QuY2xvbmUoKSk7XHJcblxyXG4gIHJldHVybiByZXZpZXdzRGJQcm9taXNlLnRoZW4oZGIgPT4ge1xyXG4gICAgXHJcbiAgICBpZighZGIpIHJldHVybiBnZXRMYXRlc3RSZXZpZXdzKHJlcXVlc3QuY2xvbmUoKSk7XHJcblxyXG4gICAgdmFyIHN0b3JlID0gZGIudHJhbnNhY3Rpb24oJ3Jlc3RhdXJhbnQtcmV2aWV3cycpLm9iamVjdFN0b3JlKCdyZXN0YXVyYW50LXJldmlld3MnKTtcclxuICAgIHZhciBpbmRleCA9IHN0b3JlLmluZGV4KCdieS1yZXN0YXVyYW50Jyk7XHJcbiAgXHJcbiAgICByZXR1cm4gaW5kZXguZ2V0QWxsKFtyZXN0YXVyYW50SWQsYCR7cmVzdGF1cmFudElkfWBdKS50aGVuKGRhdGEgPT4geyAgXHJcblxyXG4gICAgICB2YXIgbmV0d29ya0ZldGNoID0gZ2V0TGF0ZXN0UmV2aWV3cyhyZXF1ZXN0LmNsb25lKCkpO1xyXG5cclxuICAgICAgLy8gaWYgZGF0YSBmb3VuZCBpbiBpbmRleGVkIGRiIHJldHVybiB0aGVtXHJcbiAgICAgIGlmKEpTT04uc3RyaW5naWZ5KGRhdGEpICE9PSBKU09OLnN0cmluZ2lmeShbXSkgJiYgZGF0YSAhPT0gdW5kZWZpbmVkKSAgeyBcclxuXHJcbiAgICAgICAgY29uc29sZS5sb2coJ0ZvdW5kIGNhY2hlZCcpO1xyXG4gICAgICAgIHJldHVybiBuZXcgUmVzcG9uc2UoSlNPTi5zdHJpbmdpZnkoZGF0YSkpOyBcclxuICAgICAgfVxyXG5cclxuICAgICAgcmV0dXJuIG5ldHdvcmtGZXRjaDtcclxuICAgIH0pO1xyXG5cclxuICB9KS5jYXRjaCgoKSA9PiB7XHJcbiAgICByZXR1cm4gY2FjaGVzLm1hdGNoKG9mZmxpbmVQYWdlKTsgXHJcbiAgfSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHN1Ym1pdFJldmlldyhyZXF1ZXN0KSB7XHJcbiAgY29uc29sZS5sb2cocmVxdWVzdCk7XHJcbn1cclxuXHJcblxyXG4vKipcclxuICogQ3JlYXRlIGFuIGluZGV4ZWQgZGIgb2Yga2V5dmFsIHR5cGUgbmFtZWQgYHJlc3RhdXJhbnRzYFxyXG4gKi9cclxuZnVuY3Rpb24gY3JlYXRlREIoKSB7XHJcbiAgcmV0dXJuIGlkYi5vcGVuKCdyZXN0YXVyYW50cycsIDEsIHVwZ3JhZGVEQiA9PiB7XHJcbiAgICB2YXIgc3RvcmUgPSB1cGdyYWRlREIuY3JlYXRlT2JqZWN0U3RvcmUoJ3Jlc3RhdXJhbnRzJywge1xyXG4gICAgICBrZXlwYXRoOiAnaWQnXHJcbiAgICB9KTtcclxuICB9KTtcclxufVxyXG5cclxuZnVuY3Rpb24gY3JlYXRlUmV2aWV3REIoKSB7XHJcbiAgcmV0dXJuIGlkYi5vcGVuKCdyZXN0YXVyYW50LXJldmlld3MnLCAxLCB1cGdyYWRlREIgPT4ge1xyXG4gICAgdmFyIHN0b3JlID0gdXBncmFkZURCLmNyZWF0ZU9iamVjdFN0b3JlKCdyZXN0YXVyYW50LXJldmlld3MnLCB7XHJcbiAgICAgIGtleXBhdGg6ICdpZCdcclxuICAgIH0pO1xyXG5cclxuICAgIHN0b3JlLmNyZWF0ZUluZGV4KCdieS1yZXN0YXVyYW50JywgJ3Jlc3RhdXJhbnRfaWQnKTtcclxuICAgIHN0b3JlLmNyZWF0ZUluZGV4KCdieS1kYXRlJywgJ2NyZWF0ZWRBdCcpO1xyXG4gIH0pO1xyXG59XHJcbi8qKiBcclxuICogT3BlbiBjYWNoZXMgb24gaW5zdGFsbCBvZiBzdyBcclxuICovXHJcbnNlbGYuYWRkRXZlbnRMaXN0ZW5lcignaW5zdGFsbCcsIGV2ZW50ID0+IHtcclxuICAvLyBPcGVuIGNhY2hlIGZvciBzdGF0aWMgY29udGVudCBhbmQgY2FjaGUgNDA0IHBhZ2VcclxuXHJcbiAgICB2YXIgb3BlblN0YXRpY0NhY2hlUHJvbWlzZSA9IGNhY2hlcy5vcGVuKENBQ0hFX1NUQVRJQykudGhlbihjYWNoZSA9PiB7XHJcbiAgICAgIGNhY2hlLmFkZEFsbChbb2ZmbGluZVBhZ2VdKTtcclxuICAgICAgLy8gY2FjaGUucHV0KCdzdGFydF91cmwnLCBmZXRjaCgnLycpKTtcclxuICAgICAgY29uc29sZS5sb2coYENhY2hlICR7Q0FDSEVfU1RBVElDfSBvcGVuZWRgKTtcclxuICAgIH0pO1xyXG5cclxuICAgIHZhciBvcGVuSW1hZ2VDYWNoZVByb21pc2UgPSBjYWNoZXMub3BlbihDQUNIRV9JTUFHRVMpLnRoZW4oY2FjaGUgPT4ge1xyXG4gICAgICBjb25zb2xlLmxvZyhgQ2FjaGUgJHtDQUNIRV9JTUFHRVN9IG9wZW5lZGApO1xyXG4gICAgfSlcclxuXHJcbiAgICBkYlByb21pc2UgPSBjcmVhdGVEQigpO1xyXG5cclxuICAgIGV2ZW50LndhaXRVbnRpbChcclxuICAgICAgUHJvbWlzZS5hbGwoW29wZW5TdGF0aWNDYWNoZVByb21pc2UsIG9wZW5JbWFnZUNhY2hlUHJvbWlzZV0pXHJcbiAgICAgIC50aGVuKCgpID0+IHtcclxuICAgICAgICByZXR1cm4gc2VsZi5za2lwV2FpdGluZygpXHJcbiAgICAgIH0pXHJcbiAgICApO1xyXG59KTtcclxuXHJcblxyXG4vKiogXHJcbiAqIE9wZW4gaW5kZXggZGIgb24gYWN0aXZhdGVcclxuICovXHJcbnNlbGYuYWRkRXZlbnRMaXN0ZW5lcignYWN0aXZhdGUnLCBldmVudCA9PiB7XHJcblxyXG4gIGRiUHJvbWlzZSA9IGNyZWF0ZURCKCk7XHJcbiAgcmV2aWV3c0RiUHJvbWlzZSA9IGNyZWF0ZVJldmlld0RCKCk7XHJcbiAgZXZlbnQud2FpdFVudGlsKGRiUHJvbWlzZSk7XHJcbiAgZXZlbnQud2FpdFVudGlsKHJldmlld3NEYlByb21pc2UpO1xyXG5cclxufSk7XHJcblxyXG4vKiogXHJcbiAqIEhhbmRsZSBmZXRjaCBcclxuICovXHJcbnNlbGYuYWRkRXZlbnRMaXN0ZW5lcignZmV0Y2gnLCBldmVudCA9PiB7XHJcbiAgLy8gaGFuZGxlIHJlcXVlc3QgYWNjb3JkaW5nIHRvIGl0cyB0eXBlXHJcblxyXG4gIGlmKGV2ZW50LnJlcXVlc3QubWV0aG9kID09PSAnUE9TVCcpIHtcclxuICAgIGV2ZW50LnJlc3BvbmRXaXRoKHN1Ym1pdFJldmlldyhldmVudC5yZXF1ZXN0KSk7XHJcbiAgICByZXR1cm47XHJcbiAgfVxyXG5cclxuICBpZihldmVudC5yZXF1ZXN0LnVybC5lbmRzV2l0aCgnLmpwZycpKSB7XHJcbiAgICBldmVudC5yZXNwb25kV2l0aChjYWNoZUltYWdlcyhldmVudC5yZXF1ZXN0KSk7ICBcclxuICAgIHJldHVybjtcclxuICB9IGVsc2UgaWYgKGV2ZW50LnJlcXVlc3QudXJsLmluY2x1ZGVzKCdyZXZpZXdzJykpIHtcclxuICAgIGV2ZW50LnJlc3BvbmRXaXRoKHNlYXJjaElEQkZvclJldmlld3MoZXZlbnQucmVxdWVzdCkpO1xyXG4gICAgcmV0dXJuO1xyXG4gIH0gZWxzZSBpZiAoZXZlbnQucmVxdWVzdC51cmwuaW5jbHVkZXMoJ3Jlc3RhdXJhbnRzJykpIHtcclxuICAgIGV2ZW50LnJlc3BvbmRXaXRoKHNlYXJjaEluSURCKGV2ZW50LnJlcXVlc3QpKTtcclxuICAgIHJldHVybjtcclxuICB9IGVsc2Uge1xyXG4gICAgZXZlbnQucmVzcG9uZFdpdGgoY2FjaGVTdGF0aWNDb250ZW50KGV2ZW50LnJlcXVlc3QpKTtcclxuICAgIHJldHVybjtcclxuICB9XHJcbn0pO1xyXG4iXX0=
