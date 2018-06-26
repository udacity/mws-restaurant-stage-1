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
 * Search in indexed DB and if no result fetch from network  ///TODO recheck!!!
 */
function getData(request) {

  var pathSlices = request.url.split("/");
  var restaurantId = parseInt(pathSlices[pathSlices.length - 1]) || 0;

  return fetch(request.clone()).then(function (networkResponse) {

    if (networkResponse.status == 404) return searchInIDB(request.clone());

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

    console.log('Fetched from network');
    return networkResponse;
  }, function (rejected) {
    return searchInIDB(request.clone());
  })['catch'](function () {
    return searchInIDB(request.clone());
  });
}

function searchInIDB(request) {

  var pathSlices = request.clone().url.split("/");
  var restaurantId = parseInt(pathSlices[pathSlices.length - 1]) || 0;
  var dataPromise;

  // if not indexed db functionality
  if (!dbPromise) return;

  return dbPromise.then(function (db) {

    if (!db) return;

    var store = db.transaction('restaurants').objectStore('restaurants');

    if (!restaurantId) {
      // if all data are requested
      dataPromise = store.getAll();
    } else {
      // if per restaurant data are requested
      dataPromise = store.get(restaurantId);
    }

    if (!dataPromise) return;

    return dataPromise.then(function (data) {

      // if data found in indexed db return them
      if (JSON.stringify(data) !== JSON.stringify([]) && data !== undefined) {

        console.log('Found cached');
        return new Response(JSON.stringify(data));
      }
    }, function (rejected) {
      return caches.match(offlinePage);
    })['catch'](function () {
      return caches.match(offlinePage);
    });
  })['catch'](function () {
    return caches.match(offlinePage);
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
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvaWRiL2xpYi9pZGIuanMiLCIvaG9tZS92aWNraWUvVWRhY2l0eS9td3MtcmVzdGF1cmFudC1zdGFnZS0xL3NyYy9zdy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7OzttQkN0VGdCLEtBQUs7Ozs7Ozs7QUFLckIsSUFBSSxZQUFZLEdBQUcsOEJBQThCLENBQUM7QUFDbEQsSUFB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N0MsQ0FBQyxDQUFBOztBQUVGLFdBQVMsR0FBRyxRQUFRLEVBQUUsQ0FBQzs7QUFFdkIsT0FBSyxDQUFDLFNBQVMsQ0FDYixPQUFPLENBQUMsR0FBRyxDQUFDLENBQUMsc0JBQXNCLEVBQUUscUJBQXFCLENBQUMsQ0FBQyxDQUMzRCxJQUFJLENBQUMsWUFBTTtBQUNWLFdBQU8sSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFBO0dBQzFCLENBQUMsQ0FDSCxDQUFDO0NBQ0wsQ0FBQyxDQUFDOzs7OztBQU1ILElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxVQUFVLEVBQUUsVUFBQSxLQUFLLEVBQUk7O0FBRXpDLFdBQVMsR0FBRyxRQUFRLEVBQUUsQ0FBQztBQUN2QixPQUFLLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxDQUFDO0NBRTVCLENBQUMsQ0FBQzs7Ozs7QUFLSCxJQUFJLENBQUMsZ0JBQWdCLENBQUMsT0FBTyxFQUFFLFVBQUEsS0FBSyxFQUFJOztBQUV0QyxNQUFHLEtBQUssQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsRUFBRTtBQUNyQyxTQUFLLENBQUMsV0FBVyxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQztBQUM5QyxXQUFPO0dBQ1IsTUFBTSxJQUFJLEtBQUssQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxhQUFhLENBQUMsRUFBRTtBQUNwRCxTQUFLLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQztBQUMxQyxXQUFPO0dBQ1IsTUFBTTtBQUNMLFNBQUssQ0FBQyxXQUFXLENBQUMsa0JBQWtCLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7QUFDckQsV0FBTztHQUNSO0NBQ0YsQ0FBQyxDQUFDIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIid1c2Ugc3RyaWN0JztcblxuKGZ1bmN0aW9uKCkge1xuICBmdW5jdGlvbiB0b0FycmF5KGFycikge1xuICAgIHJldHVybiBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcnIpO1xuICB9XG5cbiAgZnVuY3Rpb24gcHJvbWlzaWZ5UmVxdWVzdChyZXF1ZXN0KSB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgcmVxdWVzdC5vbnN1Y2Nlc3MgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgcmVzb2x2ZShyZXF1ZXN0LnJlc3VsdCk7XG4gICAgICB9O1xuXG4gICAgICByZXF1ZXN0Lm9uZXJyb3IgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgcmVqZWN0KHJlcXVlc3QuZXJyb3IpO1xuICAgICAgfTtcbiAgICB9KTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHByb21pc2lmeVJlcXVlc3RDYWxsKG9iaiwgbWV0aG9kLCBhcmdzKSB7XG4gICAgdmFyIHJlcXVlc3Q7XG4gICAgdmFyIHAgPSBuZXcgUHJvbWlzZShmdW5jdGlvbihyZXNvbHZlLCByZWplY3QpIHtcbiAgICAgIHJlcXVlc3QgPSBvYmpbbWV0aG9kXS5hcHBseShvYmosIGFyZ3MpO1xuICAgICAgcHJvbWlzaWZ5UmVxdWVzdChyZXF1ZXN0KS50aGVuKHJlc29sdmUsIHJlamVjdCk7XG4gICAgfSk7XG5cbiAgICBwLnJlcXVlc3QgPSByZXF1ZXN0O1xuICAgIHJldHVybiBwO1xuICB9XG4gIFxuICBmdW5jdGlvbiBwcm9taXNpZnlDdXJzb3JSZXF1ZXN0Q2FsbChvYmosIG1ldGhvZCwgYXJncykge1xuICAgIHZhciBwID0gcHJvbWlzaWZ5UmVxdWVzdENhbGwob2JqLCBtZXRob2QsIGFyZ3MpO1xuICAgIHJldHVybiBwLnRoZW4oZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgIGlmICghdmFsdWUpIHJldHVybjtcbiAgICAgIHJldHVybiBuZXcgQ3Vyc29yKHZhbHVlLCBwLnJlcXVlc3QpO1xuICAgIH0pO1xuICB9XG5cbiAgZnVuY3Rpb24gcHJveHlQcm9wZXJ0aWVzKFByb3h5Q2xhc3MsIHRhcmdldFByb3AsIHByb3BlcnRpZXMpIHtcbiAgICBwcm9wZXJ0aWVzLmZvckVhY2goZnVuY3Rpb24ocHJvcCkge1xuICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KFByb3h5Q2xhc3MucHJvdG90eXBlLCBwcm9wLCB7XG4gICAgICAgIGdldDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgcmV0dXJuIHRoaXNbdGFyZ2V0UHJvcF1bcHJvcF07XG4gICAgICAgIH0sXG4gICAgICAgIHNldDogZnVuY3Rpb24odmFsKSB7XG4gICAgICAgICAgdGhpc1t0YXJnZXRQcm9wXVtwcm9wXSA9IHZhbDtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cblxuICBmdW5jdGlvbiBwcm94eVJlcXVlc3RNZXRob2RzKFByb3h5Q2xhc3MsIHRhcmdldFByb3AsIENvbnN0cnVjdG9yLCBwcm9wZXJ0aWVzKSB7XG4gICAgcHJvcGVydGllcy5mb3JFYWNoKGZ1bmN0aW9uKHByb3ApIHtcbiAgICAgIGlmICghKHByb3AgaW4gQ29uc3RydWN0b3IucHJvdG90eXBlKSkgcmV0dXJuO1xuICAgICAgUHJveHlDbGFzcy5wcm90b3R5cGVbcHJvcF0gPSBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHByb21pc2lmeVJlcXVlc3RDYWxsKHRoaXNbdGFyZ2V0UHJvcF0sIHByb3AsIGFyZ3VtZW50cyk7XG4gICAgICB9O1xuICAgIH0pO1xuICB9XG5cbiAgZnVuY3Rpb24gcHJveHlNZXRob2RzKFByb3h5Q2xhc3MsIHRhcmdldFByb3AsIENvbnN0cnVjdG9yLCBwcm9wZXJ0aWVzKSB7XG4gICAgcHJvcGVydGllcy5mb3JFYWNoKGZ1bmN0aW9uKHByb3ApIHtcbiAgICAgIGlmICghKHByb3AgaW4gQ29uc3RydWN0b3IucHJvdG90eXBlKSkgcmV0dXJuO1xuICAgICAgUHJveHlDbGFzcy5wcm90b3R5cGVbcHJvcF0gPSBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXNbdGFyZ2V0UHJvcF1bcHJvcF0uYXBwbHkodGhpc1t0YXJnZXRQcm9wXSwgYXJndW1lbnRzKTtcbiAgICAgIH07XG4gICAgfSk7XG4gIH1cblxuICBmdW5jdGlvbiBwcm94eUN1cnNvclJlcXVlc3RNZXRob2RzKFByb3h5Q2xhc3MsIHRhcmdldFByb3AsIENvbnN0cnVjdG9yLCBwcm9wZXJ0aWVzKSB7XG4gICAgcHJvcGVydGllcy5mb3JFYWNoKGZ1bmN0aW9uKHByb3ApIHtcbiAgICAgIGlmICghKHByb3AgaW4gQ29uc3RydWN0b3IucHJvdG90eXBlKSkgcmV0dXJuO1xuICAgICAgUHJveHlDbGFzcy5wcm90b3R5cGVbcHJvcF0gPSBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHByb21pc2lmeUN1cnNvclJlcXVlc3RDYWxsKHRoaXNbdGFyZ2V0UHJvcF0sIHByb3AsIGFyZ3VtZW50cyk7XG4gICAgICB9O1xuICAgIH0pO1xuICB9XG5cbiAgZnVuY3Rpb24gSW5kZXgoaW5kZXgpIHtcbiAgICB0aGlzLl9pbmRleCA9IGluZGV4O1xuICB9XG5cbiAgcHJveHlQcm9wZXJ0aWVzKEluZGV4LCAnX2luZGV4JywgW1xuICAgICduYW1lJyxcbiAgICAna2V5UGF0aCcsXG4gICAgJ211bHRpRW50cnknLFxuICAgICd1bmlxdWUnXG4gIF0pO1xuXG4gIHByb3h5UmVxdWVzdE1ldGhvZHMoSW5kZXgsICdfaW5kZXgnLCBJREJJbmRleCwgW1xuICAgICdnZXQnLFxuICAgICdnZXRLZXknLFxuICAgICdnZXRBbGwnLFxuICAgICdnZXRBbGxLZXlzJyxcbiAgICAnY291bnQnXG4gIF0pO1xuXG4gIHByb3h5Q3Vyc29yUmVxdWVzdE1ldGhvZHMoSW5kZXgsICdfaW5kZXgnLCBJREJJbmRleCwgW1xuICAgICdvcGVuQ3Vyc29yJyxcbiAgICAnb3BlbktleUN1cnNvcidcbiAgXSk7XG5cbiAgZnVuY3Rpb24gQ3Vyc29yKGN1cnNvciwgcmVxdWVzdCkge1xuICAgIHRoaXMuX2N1cnNvciA9IGN1cnNvcjtcbiAgICB0aGlzLl9yZXF1ZXN0ID0gcmVxdWVzdDtcbiAgfVxuXG4gIHByb3h5UHJvcGVydGllcyhDdXJzb3IsICdfY3Vyc29yJywgW1xuICAgICdkaXJlY3Rpb24nLFxuICAgICdrZXknLFxuICAgICdwcmltYXJ5S2V5JyxcbiAgICAndmFsdWUnXG4gIF0pO1xuXG4gIHByb3h5UmVxdWVzdE1ldGhvZHMoQ3Vyc29yLCAnX2N1cnNvcicsIElEQkN1cnNvciwgW1xuICAgICd1cGRhdGUnLFxuICAgICdkZWxldGUnXG4gIF0pO1xuXG4gIC8vIHByb3h5ICduZXh0JyBtZXRob2RzXG4gIFsnYWR2YW5jZScsICdjb250aW51ZScsICdjb250aW51ZVByaW1hcnlLZXknXS5mb3JFYWNoKGZ1bmN0aW9uKG1ldGhvZE5hbWUpIHtcbiAgICBpZiAoIShtZXRob2ROYW1lIGluIElEQkN1cnNvci5wcm90b3R5cGUpKSByZXR1cm47XG4gICAgQ3Vyc29yLnByb3RvdHlwZVttZXRob2ROYW1lXSA9IGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIGN1cnNvciA9IHRoaXM7XG4gICAgICB2YXIgYXJncyA9IGFyZ3VtZW50cztcbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKS50aGVuKGZ1bmN0aW9uKCkge1xuICAgICAgICBjdXJzb3IuX2N1cnNvclttZXRob2ROYW1lXS5hcHBseShjdXJzb3IuX2N1cnNvciwgYXJncyk7XG4gICAgICAgIHJldHVybiBwcm9taXNpZnlSZXF1ZXN0KGN1cnNvci5fcmVxdWVzdCkudGhlbihmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgICAgIGlmICghdmFsdWUpIHJldHVybjtcbiAgICAgICAgICByZXR1cm4gbmV3IEN1cnNvcih2YWx1ZSwgY3Vyc29yLl9yZXF1ZXN0KTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9O1xuICB9KTtcblxuICBmdW5jdGlvbiBPYmplY3RTdG9yZShzdG9yZSkge1xuICAgIHRoaXMuX3N0b3JlID0gc3RvcmU7XG4gIH1cblxuICBPYmplY3RTdG9yZS5wcm90b3R5cGUuY3JlYXRlSW5kZXggPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gbmV3IEluZGV4KHRoaXMuX3N0b3JlLmNyZWF0ZUluZGV4LmFwcGx5KHRoaXMuX3N0b3JlLCBhcmd1bWVudHMpKTtcbiAgfTtcblxuICBPYmplY3RTdG9yZS5wcm90b3R5cGUuaW5kZXggPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gbmV3IEluZGV4KHRoaXMuX3N0b3JlLmluZGV4LmFwcGx5KHRoaXMuX3N0b3JlLCBhcmd1bWVudHMpKTtcbiAgfTtcblxuICBwcm94eVByb3BlcnRpZXMoT2JqZWN0U3RvcmUsICdfc3RvcmUnLCBbXG4gICAgJ25hbWUnLFxuICAgICdrZXlQYXRoJyxcbiAgICAnaW5kZXhOYW1lcycsXG4gICAgJ2F1dG9JbmNyZW1lbnQnXG4gIF0pO1xuXG4gIHByb3h5UmVxdWVzdE1ldGhvZHMoT2JqZWN0U3RvcmUsICdfc3RvcmUnLCBJREJPYmplY3RTdG9yZSwgW1xuICAgICdwdXQnLFxuICAgICdhZGQnLFxuICAgICdkZWxldGUnLFxuICAgICdjbGVhcicsXG4gICAgJ2dldCcsXG4gICAgJ2dldEFsbCcsXG4gICAgJ2dldEtleScsXG4gICAgJ2dldEFsbEtleXMnLFxuICAgICdjb3VudCdcbiAgXSk7XG5cbiAgcHJveHlDdXJzb3JSZXF1ZXN0TWV0aG9kcyhPYmplY3RTdG9yZSwgJ19zdG9yZScsIElEQk9iamVjdFN0b3JlLCBbXG4gICAgJ29wZW5DdXJzb3InLFxuICAgICdvcGVuS2V5Q3Vyc29yJ1xuICBdKTtcblxuICBwcm94eU1ldGhvZHMoT2JqZWN0U3RvcmUsICdfc3RvcmUnLCBJREJPYmplY3RTdG9yZSwgW1xuICAgICdkZWxldGVJbmRleCdcbiAgXSk7XG5cbiAgZnVuY3Rpb24gVHJhbnNhY3Rpb24oaWRiVHJhbnNhY3Rpb24pIHtcbiAgICB0aGlzLl90eCA9IGlkYlRyYW5zYWN0aW9uO1xuICAgIHRoaXMuY29tcGxldGUgPSBuZXcgUHJvbWlzZShmdW5jdGlvbihyZXNvbHZlLCByZWplY3QpIHtcbiAgICAgIGlkYlRyYW5zYWN0aW9uLm9uY29tcGxldGUgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgcmVzb2x2ZSgpO1xuICAgICAgfTtcbiAgICAgIGlkYlRyYW5zYWN0aW9uLm9uZXJyb3IgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgcmVqZWN0KGlkYlRyYW5zYWN0aW9uLmVycm9yKTtcbiAgICAgIH07XG4gICAgICBpZGJUcmFuc2FjdGlvbi5vbmFib3J0ID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHJlamVjdChpZGJUcmFuc2FjdGlvbi5lcnJvcik7XG4gICAgICB9O1xuICAgIH0pO1xuICB9XG5cbiAgVHJhbnNhY3Rpb24ucHJvdG90eXBlLm9iamVjdFN0b3JlID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIG5ldyBPYmplY3RTdG9yZSh0aGlzLl90eC5vYmplY3RTdG9yZS5hcHBseSh0aGlzLl90eCwgYXJndW1lbnRzKSk7XG4gIH07XG5cbiAgcHJveHlQcm9wZXJ0aWVzKFRyYW5zYWN0aW9uLCAnX3R4JywgW1xuICAgICdvYmplY3RTdG9yZU5hbWVzJyxcbiAgICAnbW9kZSdcbiAgXSk7XG5cbiAgcHJveHlNZXRob2RzKFRyYW5zYWN0aW9uLCAnX3R4JywgSURCVHJhbnNhY3Rpb24sIFtcbiAgICAnYWJvcnQnXG4gIF0pO1xuXG4gIGZ1bmN0aW9uIFVwZ3JhZGVEQihkYiwgb2xkVmVyc2lvbiwgdHJhbnNhY3Rpb24pIHtcbiAgICB0aGlzLl9kYiA9IGRiO1xuICAgIHRoaXMub2xkVmVyc2lvbiA9IG9sZFZlcnNpb247XG4gICAgdGhpcy50cmFuc2FjdGlvbiA9IG5ldyBUcmFuc2FjdGlvbih0cmFuc2FjdGlvbik7XG4gIH1cblxuICBVcGdyYWRlREIucHJvdG90eXBlLmNyZWF0ZU9iamVjdFN0b3JlID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIG5ldyBPYmplY3RTdG9yZSh0aGlzLl9kYi5jcmVhdGVPYmplY3RTdG9yZS5hcHBseSh0aGlzLl9kYiwgYXJndW1lbnRzKSk7XG4gIH07XG5cbiAgcHJveHlQcm9wZXJ0aWVzKFVwZ3JhZGVEQiwgJ19kYicsIFtcbiAgICAnbmFtZScsXG4gICAgJ3ZlcnNpb24nLFxuICAgICdvYmplY3RTdG9yZU5hbWVzJ1xuICBdKTtcblxuICBwcm94eU1ldGhvZHMoVXBncmFkZURCLCAnX2RiJywgSURCRGF0YWJhc2UsIFtcbiAgICAnZGVsZXRlT2JqZWN0U3RvcmUnLFxuICAgICdjbG9zZSdcbiAgXSk7XG5cbiAgZnVuY3Rpb24gREIoZGIpIHtcbiAgICB0aGlzLl9kYiA9IGRiO1xuICB9XG5cbiAgREIucHJvdG90eXBlLnRyYW5zYWN0aW9uID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIG5ldyBUcmFuc2FjdGlvbih0aGlzLl9kYi50cmFuc2FjdGlvbi5hcHBseSh0aGlzLl9kYiwgYXJndW1lbnRzKSk7XG4gIH07XG5cbiAgcHJveHlQcm9wZXJ0aWVzKERCLCAnX2RiJywgW1xuICAgICduYW1lJyxcbiAgICAndmVyc2lvbicsXG4gICAgJ29iamVjdFN0b3JlTmFtZXMnXG4gIF0pO1xuXG4gIHByb3h5TWV0aG9kcyhEQiwgJ19kYicsIElEQkRhdGFiYXNlLCBbXG4gICAgJ2Nsb3NlJ1xuICBdKTtcblxuICAvLyBBZGQgY3Vyc29yIGl0ZXJhdG9yc1xuICAvLyBUT0RPOiByZW1vdmUgdGhpcyBvbmNlIGJyb3dzZXJzIGRvIHRoZSByaWdodCB0aGluZyB3aXRoIHByb21pc2VzXG4gIFsnb3BlbkN1cnNvcicsICdvcGVuS2V5Q3Vyc29yJ10uZm9yRWFjaChmdW5jdGlvbihmdW5jTmFtZSkge1xuICAgIFtPYmplY3RTdG9yZSwgSW5kZXhdLmZvckVhY2goZnVuY3Rpb24oQ29uc3RydWN0b3IpIHtcbiAgICAgIENvbnN0cnVjdG9yLnByb3RvdHlwZVtmdW5jTmFtZS5yZXBsYWNlKCdvcGVuJywgJ2l0ZXJhdGUnKV0gPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGFyZ3MgPSB0b0FycmF5KGFyZ3VtZW50cyk7XG4gICAgICAgIHZhciBjYWxsYmFjayA9IGFyZ3NbYXJncy5sZW5ndGggLSAxXTtcbiAgICAgICAgdmFyIG5hdGl2ZU9iamVjdCA9IHRoaXMuX3N0b3JlIHx8IHRoaXMuX2luZGV4O1xuICAgICAgICB2YXIgcmVxdWVzdCA9IG5hdGl2ZU9iamVjdFtmdW5jTmFtZV0uYXBwbHkobmF0aXZlT2JqZWN0LCBhcmdzLnNsaWNlKDAsIC0xKSk7XG4gICAgICAgIHJlcXVlc3Qub25zdWNjZXNzID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgY2FsbGJhY2socmVxdWVzdC5yZXN1bHQpO1xuICAgICAgICB9O1xuICAgICAgfTtcbiAgICB9KTtcbiAgfSk7XG5cbiAgLy8gcG9seWZpbGwgZ2V0QWxsXG4gIFtJbmRleCwgT2JqZWN0U3RvcmVdLmZvckVhY2goZnVuY3Rpb24oQ29uc3RydWN0b3IpIHtcbiAgICBpZiAoQ29uc3RydWN0b3IucHJvdG90eXBlLmdldEFsbCkgcmV0dXJuO1xuICAgIENvbnN0cnVjdG9yLnByb3RvdHlwZS5nZXRBbGwgPSBmdW5jdGlvbihxdWVyeSwgY291bnQpIHtcbiAgICAgIHZhciBpbnN0YW5jZSA9IHRoaXM7XG4gICAgICB2YXIgaXRlbXMgPSBbXTtcblxuICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uKHJlc29sdmUpIHtcbiAgICAgICAgaW5zdGFuY2UuaXRlcmF0ZUN1cnNvcihxdWVyeSwgZnVuY3Rpb24oY3Vyc29yKSB7XG4gICAgICAgICAgaWYgKCFjdXJzb3IpIHtcbiAgICAgICAgICAgIHJlc29sdmUoaXRlbXMpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpdGVtcy5wdXNoKGN1cnNvci52YWx1ZSk7XG5cbiAgICAgICAgICBpZiAoY291bnQgIT09IHVuZGVmaW5lZCAmJiBpdGVtcy5sZW5ndGggPT0gY291bnQpIHtcbiAgICAgICAgICAgIHJlc29sdmUoaXRlbXMpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIH1cbiAgICAgICAgICBjdXJzb3IuY29udGludWUoKTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9O1xuICB9KTtcblxuICB2YXIgZXhwID0ge1xuICAgIG9wZW46IGZ1bmN0aW9uKG5hbWUsIHZlcnNpb24sIHVwZ3JhZGVDYWxsYmFjaykge1xuICAgICAgdmFyIHAgPSBwcm9taXNpZnlSZXF1ZXN0Q2FsbChpbmRleGVkREIsICdvcGVuJywgW25hbWUsIHZlcnNpb25dKTtcbiAgICAgIHZhciByZXF1ZXN0ID0gcC5yZXF1ZXN0O1xuXG4gICAgICByZXF1ZXN0Lm9udXBncmFkZW5lZWRlZCA9IGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgIGlmICh1cGdyYWRlQ2FsbGJhY2spIHtcbiAgICAgICAgICB1cGdyYWRlQ2FsbGJhY2sobmV3IFVwZ3JhZGVEQihyZXF1ZXN0LnJlc3VsdCwgZXZlbnQub2xkVmVyc2lvbiwgcmVxdWVzdC50cmFuc2FjdGlvbikpO1xuICAgICAgICB9XG4gICAgICB9O1xuXG4gICAgICByZXR1cm4gcC50aGVuKGZ1bmN0aW9uKGRiKSB7XG4gICAgICAgIHJldHVybiBuZXcgREIoZGIpO1xuICAgICAgfSk7XG4gICAgfSxcbiAgICBkZWxldGU6IGZ1bmN0aW9uKG5hbWUpIHtcbiAgICAgIHJldHVybiBwcm9taXNpZnlSZXF1ZXN0Q2FsbChpbmRleGVkREIsICdkZWxldGVEYXRhYmFzZScsIFtuYW1lXSk7XG4gICAgfVxuICB9O1xuXG4gIGlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJykge1xuICAgIG1vZHVsZS5leHBvcnRzID0gZXhwO1xuICB9XG4gIGVsc2Uge1xuICAgIHNlbGYuaWRiID0gZXhwO1xuICB9XG59KCkpO1xuIiwiaW1wb3J0IGlkYiBmcm9tICdpZGInO1xuXG4vKiogXG4gKiBTZXBhcmF0ZSBjYWNoZXMgZm9yIHRoZSBqcGcgaW1hZ2VzIGFuZCBhbGwgdGhlIG90aGVyIGNvbnRlbnQgXG4gKi9cbnZhciBDQUNIRV9TVEFUSUMgPSAncmVzdGF1cmFudC1yZXZpZXdzLXN0YXRpYy12MSc7XG52YXIgQ0FDSEVfSU1BR0VTID0gJ3Jlc3RhdXJhbnQtcmV2aWV3cy1pbWFnZXMtdjEnO1xuY29uc3Qgb2ZmbGluZVBhZ2UgPSAnLi80MDQuaHRtbCc7XG52YXIgZGJQcm9taXNlO1xuXG4vKiogXG4gKiBGZXRjaCBhbmQgY2FjaGUgaW1hZ2UgcmVxdWVzdCBcbiAqL1xuZnVuY3Rpb24gY2FjaGVJbWFnZXMocmVxdWVzdCkge1xuICBcbiAgLy8gUmVtb3ZlIHNpemUtcmVsYXRlZCBpbmZvIGZyb20gaW1hZ2UgbmFtZSBcbiAgdmFyIHVybFRvRmV0Y2ggPSByZXF1ZXN0LnVybC5zbGljZSgwLCByZXF1ZXN0LnVybC5pbmRleE9mKCctJykpO1xuICAgXG4gIFxuICByZXR1cm4gY2FjaGVzLm9wZW4oQ0FDSEVfSU1BR0VTKS50aGVuKGNhY2hlID0+IHsgIFxuICAgIHJldHVybiBjYWNoZS5tYXRjaCh1cmxUb0ZldGNoKS50aGVuKHJlc3BvbnNlID0+IHtcbiAgXG4gICAgICAvLyBDYWNoZSBoaXQgLSByZXR1cm4gcmVzcG9uc2UgZWxzZSBmZXRjaFxuICAgICAgLy8gV2UgY2xvbmUgdGhlIHJlcXVlc3QgYmVjYXVzZSBpdCdzIGEgc3RyZWFtIGFuZCBjYW4gYmUgY29uc3VtZWQgb25seSBvbmNlXG4gICAgICB2YXIgbmV0d29ya0ZldGNoID0gZmV0Y2gocmVxdWVzdC5jbG9uZSgpKS50aGVuKChuZXR3b3JrUmVzcG9uc2UpID0+IHtcbiAgICAgICAgLy8gQ2hlY2sgaWYgd2UgcmVjZWl2ZWQgYW4gaW52YWxpZCByZXNwb25zZVxuICAgICAgICBpZihuZXR3b3JrUmVzcG9uc2Uuc3RhdHVzID09IDQwNCkgcmV0dXJuO1xuXG4gICAgICAgIC8vIFdlIGNsb25lIHRoZSByZXNwb25zZSBiZWNhdXNlIGl0J3MgYSBzdHJlYW0gYW5kIGNhbiBiZSBjb25zdW1lZCBvbmx5IG9uY2VcbiAgICAgICAgY2FjaGUucHV0KHVybFRvRmV0Y2gsIG5ldHdvcmtSZXNwb25zZS5jbG9uZSgpKTtcblxuICAgICAgICByZXR1cm4gbmV0d29ya1Jlc3BvbnNlO1xuXG4gICAgICB9LCAocmVqZWN0ZWQpID0+IHtcbiAgICAgICAgcmV0dXJuIHJlc3BvbnNlO1xuICAgICAgfSkuY2F0Y2goKCkgPT4ge1xuICAgICAgICByZXR1cm4gcmVzcG9uc2U7XG4gICAgICB9KTtcblxuICAgICAgLy8gLy9pZiBhY2Nlc3MgdG8gbmV0d29yayBpcyBnb29kIHdlIHdhbnQgdGhlIGJlc3QgcXVhbGl0eSBpbWFnZVxuICAgICAgcmV0dXJuIG5ldHdvcmtGZXRjaDtcblxuICAgIH0pLmNhdGNoKCgpID0+IHsgXG5cbiAgICAgIHJldHVybiBmZXRjaChyZXF1ZXN0LmNsb25lKCkpLnRoZW4oKG5ldHdvcmtSZXNwb25zZSkgPT4ge1xuICAgICAgICAvLyBDaGVjayBpZiB3ZSByZWNlaXZlZCBhbiBpbnZhbGlkIHJlc3BvbnNlXG4gICAgICAgIGlmKG5ldHdvcmtSZXNwb25zZS5zdGF0dXMgPT0gNDA0KSByZXR1cm47XG5cbiAgICAgICAgLy8gV2UgY2xvbmUgdGhlIHJlc3BvbnNlIGJlY2F1c2UgaXQncyBhIHN0cmVhbSBhbmQgY2FuIGJlIGNvbnN1bWVkIG9ubHkgb25jZVxuICAgICAgICBjYWNoZS5wdXQodXJsVG9GZXRjaCwgbmV0d29ya1Jlc3BvbnNlLmNsb25lKCkpO1xuXG4gICAgICAgIHJldHVybiBuZXR3b3JrUmVzcG9uc2U7XG5cbiAgICAgIH0sIChyZWplY3RlZCkgPT4ge1xuICAgICAgICByZXR1cm4gY2FjaGVzLm1hdGNoKG9mZmxpbmVQYWdlKTsgXG4gICAgICB9KS5jYXRjaCgoKSA9PiB7XG4gICAgICAgIHJldHVybiBjYWNoZXMubWF0Y2gob2ZmbGluZVBhZ2UpOyBcbiAgICAgIH0pO1xuICAgIH0pXG4gIH0pO1xufVxuXG4vKiogXG4gKiBGZXRjaCBhbmQgY2FjaGUgc3RhdGljIGNvbnRlbnQgYW5kIGdvb2dsZSBtYXAgcmVsYXRlZCBjb250ZW50IFxuICovXG4gZnVuY3Rpb24gY2FjaGVTdGF0aWNDb250ZW50KHJlcXVlc3QpIHtcbiAgICBcbiAgcmV0dXJuIGNhY2hlcy5vcGVuKENBQ0hFX1NUQVRJQykudGhlbihjYWNoZSA9PiB7XG4gICAgcmV0dXJuIGNhY2hlLm1hdGNoKHJlcXVlc3QpLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgIFxuICAgICAgICAvLyBDYWNoZSBoaXQgLSByZXR1cm4gcmVzcG9uc2UgZWxzZSBmZXRjaFxuICAgICAgICAvLyBXZSBjbG9uZSB0aGUgcmVxdWVzdCBiZWNhdXNlIGl0J3MgYSBzdHJlYW0gYW5kIGNhbiBiZSBjb25zdW1lZCBvbmx5IG9uY2VcbiAgICAgIHJldHVybiByZXNwb25zZSB8fCBmZXRjaChyZXF1ZXN0LmNsb25lKCkpLnRoZW4obmV0d29ya1Jlc3BvbnNlID0+IHtcbiAgICAgICAgLy8gQ2hlY2sgaWYgd2UgcmVjZWl2ZWQgYW4gaW52YWxpZCByZXNwb25zZVxuICAgICAgICBpZihuZXR3b3JrUmVzcG9uc2Uuc3RhdHVzID09IDQwNCkgcmV0dXJuO1xuICAgIFxuICAgICAgICAvLyBXZSBjbG9uZSB0aGUgcmVzcG9uc2UgYmVjYXVzZSBpdCdzIGEgc3RyZWFtIGFuZCBjYW4gYmUgY29uc3VtZWQgb25seSBvbmNlXG4gICAgICAgIGNhY2hlLnB1dChyZXF1ZXN0LCBuZXR3b3JrUmVzcG9uc2UuY2xvbmUoKSk7XG4gICAgICAgIHJldHVybiBuZXR3b3JrUmVzcG9uc2U7XG5cbiAgICAgIH0pLmNhdGNoKCgpID0+IHsgXG4gICAgICAgIHJldHVybiBjYWNoZXMubWF0Y2gob2ZmbGluZVBhZ2UpOyBcbiAgICAgIH0pXG4gICAgfSk7XG4gIH0pO1xufVxuXG4vKipcbiAqIFNlYXJjaCBpbiBpbmRleGVkIERCIGFuZCBpZiBubyByZXN1bHQgZmV0Y2ggZnJvbSBuZXR3b3JrICAvLy9UT0RPIHJlY2hlY2shISFcbiAqL1xuZnVuY3Rpb24gZ2V0RGF0YShyZXF1ZXN0KSB7XG5cbiAgdmFyIHBhdGhTbGljZXMgPSByZXF1ZXN0LnVybC5zcGxpdChcIi9cIik7XG4gIHZhciByZXN0YXVyYW50SWQgPSBwYXJzZUludChwYXRoU2xpY2VzW3BhdGhTbGljZXMubGVuZ3RoIC0gMV0pIHx8IDA7XG5cbiAgcmV0dXJuIGZldGNoKHJlcXVlc3QuY2xvbmUoKSkudGhlbihuZXR3b3JrUmVzcG9uc2UgPT4ge1xuXG4gICAgaWYobmV0d29ya1Jlc3BvbnNlLnN0YXR1cyA9PSA0MDQpIHJldHVybiBzZWFyY2hJbklEQihyZXF1ZXN0LmNsb25lKCkpO1xuXG4gICAgbmV0d29ya1Jlc3BvbnNlLmNsb25lKCkuanNvbigpLnRoZW4oanNvbiA9PiB7XG5cbiAgICAgIGlmKCFkYlByb21pc2UpIHJldHVybjtcblxuICAgICAgZGJQcm9taXNlLnRoZW4oZGIgPT4ge1xuICAgICAgICAgICAgXG4gICAgICAgIGlmKCFkYikgcmV0dXJuO1xuXG4gICAgICAgIHZhciB0eCA9IGRiLnRyYW5zYWN0aW9uKCdyZXN0YXVyYW50cycsICdyZWFkd3JpdGUnKTtcbiAgICAgICAgdmFyIHN0b3JlID0gdHgub2JqZWN0U3RvcmUoJ3Jlc3RhdXJhbnRzJyk7XG5cbiAgICAgICAgaWYoIXJlc3RhdXJhbnRJZCl7IC8vIGlmIHdlIHJlZmVyIHRvIGFsbCBkYXRhXG5cbiAgICAgICAgICBqc29uLmZvckVhY2gocmVzdGF1cmFudCA9PiB7XG4gICAgICAgICAgICBzdG9yZS5wdXQocmVzdGF1cmFudCwgcmVzdGF1cmFudC5pZCk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIFxuICAgICAgICB9IGVsc2UgeyAvLyBpZiB3ZSByZWZlciB0byBwZXIgcmVzdGF1cmFudCBkYXRhIFxuICAgICAgICAgICBzdG9yZS5wdXQoanNvbiwganNvbi5pZCk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH0pXG5cbiAgICBjb25zb2xlLmxvZygnRmV0Y2hlZCBmcm9tIG5ldHdvcmsnKTtcbiAgICByZXR1cm4gbmV0d29ya1Jlc3BvbnNlO1xuXG4gIH0sIHJlamVjdGVkID0+IHtcbiAgICByZXR1cm4gc2VhcmNoSW5JREIocmVxdWVzdC5jbG9uZSgpKTtcbiAgfSkuY2F0Y2goKCkgPT4ge1xuICAgIHJldHVybiBzZWFyY2hJbklEQihyZXF1ZXN0LmNsb25lKCkpO1xuICB9KTtcbn1cblxuZnVuY3Rpb24gc2VhcmNoSW5JREIocmVxdWVzdCkge1xuXG4gIHZhciBwYXRoU2xpY2VzID0gcmVxdWVzdC5jbG9uZSgpLnVybC5zcGxpdChcIi9cIik7XG4gIHZhciByZXN0YXVyYW50SWQgPSBwYXJzZUludChwYXRoU2xpY2VzW3BhdGhTbGljZXMubGVuZ3RoIC0gMV0pIHx8IDA7XG4gIHZhciBkYXRhUHJvbWlzZTtcblxuICAvLyBpZiBub3QgaW5kZXhlZCBkYiBmdW5jdGlvbmFsaXR5XG4gIGlmKCFkYlByb21pc2UpIHJldHVybjtcblxuICByZXR1cm4gZGJQcm9taXNlLnRoZW4oZGIgPT4ge1xuICAgIFxuICAgIGlmKCFkYikgcmV0dXJuO1xuXG4gICAgdmFyIHN0b3JlID0gZGIudHJhbnNhY3Rpb24oJ3Jlc3RhdXJhbnRzJykub2JqZWN0U3RvcmUoJ3Jlc3RhdXJhbnRzJyk7XG5cbiAgICBpZighcmVzdGF1cmFudElkKSB7IC8vIGlmIGFsbCBkYXRhIGFyZSByZXF1ZXN0ZWRcbiAgICAgIGRhdGFQcm9taXNlID0gc3RvcmUuZ2V0QWxsKCk7XG4gICAgfSBlbHNlIHsgLy8gaWYgcGVyIHJlc3RhdXJhbnQgZGF0YSBhcmUgcmVxdWVzdGVkXG4gICAgICBkYXRhUHJvbWlzZSA9IHN0b3JlLmdldChyZXN0YXVyYW50SWQpO1xuICAgIH1cbiAgICBcbiAgICBpZighZGF0YVByb21pc2UpIHJldHVybjtcblxuICAgIHJldHVybiBkYXRhUHJvbWlzZS50aGVuKGRhdGEgPT4geyAgXG4gICAgXG4gICAgICAvLyBpZiBkYXRhIGZvdW5kIGluIGluZGV4ZWQgZGIgcmV0dXJuIHRoZW1cbiAgICAgIGlmKEpTT04uc3RyaW5naWZ5KGRhdGEpICE9PSBKU09OLnN0cmluZ2lmeShbXSkgJiYgZGF0YSAhPT0gdW5kZWZpbmVkKSAgeyBcblxuICAgICAgICBjb25zb2xlLmxvZygnRm91bmQgY2FjaGVkJyk7XG4gICAgICAgIHJldHVybiBuZXcgUmVzcG9uc2UoSlNPTi5zdHJpbmdpZnkoZGF0YSkpOyBcbiAgICAgIH1cbiAgICAgIFxuICAgIH0sIHJlamVjdGVkID0+IHtcbiAgICAgIHJldHVybiBjYWNoZXMubWF0Y2gob2ZmbGluZVBhZ2UpOyBcbiAgICB9KS5jYXRjaCgoKSA9PiB7XG4gICAgICByZXR1cm4gY2FjaGVzLm1hdGNoKG9mZmxpbmVQYWdlKTsgXG4gICAgfSk7XG4gIH0pLmNhdGNoKCgpID0+IHtcbiAgICByZXR1cm4gY2FjaGVzLm1hdGNoKG9mZmxpbmVQYWdlKTsgXG4gIH0pO1xufVxuXG4vKipcbiAqIENyZWF0ZSBhbiBpbmRleGVkIGRiIG9mIGtleXZhbCB0eXBlIG5hbWVkIGByZXN0YXVyYW50c2BcbiAqL1xuZnVuY3Rpb24gY3JlYXRlREIoKSB7XG4gIHJldHVybiBpZGIub3BlbigncmVzdGF1cmFudHMnLCAxLCB1cGdyYWRlREIgPT4ge1xuICAgIHZhciBzdG9yZSA9IHVwZ3JhZGVEQi5jcmVhdGVPYmplY3RTdG9yZSgncmVzdGF1cmFudHMnLCB7XG4gICAgICBrZXlwYXRoOiAnaWQnXG4gICAgfSk7XG4gIH0pO1xufVxuXG4vKiogXG4gKiBPcGVuIGNhY2hlcyBvbiBpbnN0YWxsIG9mIHN3IFxuICovXG5zZWxmLmFkZEV2ZW50TGlzdGVuZXIoJ2luc3RhbGwnLCBldmVudCA9PiB7XG4gIC8vIE9wZW4gY2FjaGUgZm9yIHN0YXRpYyBjb250ZW50IGFuZCBjYWNoZSA0MDQgcGFnZVxuXG4gICAgdmFyIG9wZW5TdGF0aWNDYWNoZVByb21pc2UgPSBjYWNoZXMub3BlbihDQUNIRV9TVEFUSUMpLnRoZW4oY2FjaGUgPT4ge1xuICAgICAgY2FjaGUuYWRkQWxsKFtvZmZsaW5lUGFnZV0pO1xuICAgICAgLy8gY2FjaGUucHV0KCdzdGFydF91cmwnLCBmZXRjaCgnLycpKTtcbiAgICAgIGNvbnNvbGUubG9nKGBDYWNoZSAke0NBQ0hFX1NUQVRJQ30gb3BlbmVkYCk7XG4gICAgfSk7XG5cbiAgICB2YXIgb3BlbkltYWdlQ2FjaGVQcm9taXNlID0gY2FjaGVzLm9wZW4oQ0FDSEVfSU1BR0VTKS50aGVuKGNhY2hlID0+IHtcbiAgICAgIGNvbnNvbGUubG9nKGBDYWNoZSAke0NBQ0hFX0lNQUdFU30gb3BlbmVkYCk7XG4gICAgfSlcblxuICAgIGRiUHJvbWlzZSA9IGNyZWF0ZURCKCk7XG5cbiAgICBldmVudC53YWl0VW50aWwoXG4gICAgICBQcm9taXNlLmFsbChbb3BlblN0YXRpY0NhY2hlUHJvbWlzZSwgb3BlbkltYWdlQ2FjaGVQcm9taXNlXSlcbiAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgcmV0dXJuIHNlbGYuc2tpcFdhaXRpbmcoKVxuICAgICAgfSlcbiAgICApO1xufSk7XG5cblxuLyoqIFxuICogT3BlbiBpbmRleCBkYiBvbiBhY3RpdmF0ZVxuICovXG5zZWxmLmFkZEV2ZW50TGlzdGVuZXIoJ2FjdGl2YXRlJywgZXZlbnQgPT4ge1xuXG4gIGRiUHJvbWlzZSA9IGNyZWF0ZURCKCk7XG4gIGV2ZW50LndhaXRVbnRpbChkYlByb21pc2UpO1xuXG59KTtcblxuLyoqIFxuICogSGFuZGxlIGZldGNoIFxuICovXG5zZWxmLmFkZEV2ZW50TGlzdGVuZXIoJ2ZldGNoJywgZXZlbnQgPT4ge1xuICAvLyBoYW5kbGUgcmVxdWVzdCBhY2NvcmRpbmcgdG8gaXRzIHR5cGVcbiAgaWYoZXZlbnQucmVxdWVzdC51cmwuZW5kc1dpdGgoJy5qcGcnKSkge1xuICAgIGV2ZW50LnJlc3BvbmRXaXRoKGNhY2hlSW1hZ2VzKGV2ZW50LnJlcXVlc3QpKTsgIFxuICAgIHJldHVybjtcbiAgfSBlbHNlIGlmIChldmVudC5yZXF1ZXN0LnVybC5pbmNsdWRlcygncmVzdGF1cmFudHMnKSkge1xuICAgIGV2ZW50LnJlc3BvbmRXaXRoKGdldERhdGEoZXZlbnQucmVxdWVzdCkpO1xuICAgIHJldHVybjtcbiAgfSBlbHNlIHtcbiAgICBldmVudC5yZXNwb25kV2l0aChjYWNoZVN0YXRpY0NvbnRlbnQoZXZlbnQucmVxdWVzdCkpO1xuICAgIHJldHVybjtcbiAgfVxufSk7Il19
