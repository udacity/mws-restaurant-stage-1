"use strict";

var _idb = require("idb");

var _idb2 = _interopRequireDefault(_idb);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// const idb = require("idb");

var dbPromise = _idb2.default.open("restaurant-db", 1, function (upgradeDb) {
  var keyValStore = upgradeDb.createObjectStore("restaurants");
  console.log("DB open");
}); // "use strict";

dbPromise.then(function (db) {
  var tx = db.transaction("restaurants", "readwrite");
  var objectStore = tx.objectStore("restaurants");
  objectStore.put("hello", "world");
  return tx.complete;
});