"use strict";

// import idb from "idb";
// var idb = require("idb");

var dbPromise = idb.open("restaurant-db", 1, function(upgradeDb) {
  var keyValStore = upgradeDb.createObjectStore("restaurants");
  console.log("DB open");
});

dbPromise.then(function(db) {
  var tx = db.transaction("restaurants", "readwrite");
  var objectStore = tx.objectStore("restaurants");
  objectStore.put("hello", "world");
  return tx.complete;
});
