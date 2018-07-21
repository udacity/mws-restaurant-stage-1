// import idb from "idb";
// const idb = require("idb");

var dbPromise = idb.open("restaurant-db", 1, function(upgradeDb) {
  var keyValStore = upgradeDb.createObjectStore("restaurants");
  console.log("DB open");
});

dbPromise.then(db => {
  const tx = db.transaction("restaurants", "readwrite");
  const objectStore = tx.objectStore("restaurants");
  objectStore.put("hello", "world");
  return tx.complete;
});
