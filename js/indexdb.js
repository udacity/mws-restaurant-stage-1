(function() {
  'use strict';

  // Check for browser support

  if (!('indexedDB' in window)) {
    console.log('This browser doesn\'t support IndexedDB');
    return;
  }

  // Creates the database

  var dbPromise = idb.open('mws-restaurant-reviews', 4, function(upgradeDb) {
    console.log('Creating the database');

  // If there is not an objectstore named 'restaurants', create one, with a primary key of 'id'

    if (!upgradeDb.objectStoreNames.contains('restaurants', {keypath: 'id'} )) { 
      var restaurantsOS = upgradeDb.createObjectStore('restaurants');

      restaurantsOS.createIndex('neighborhood', 'neighborhood', {unique: false}) // Create index for neighborhoods
      restaurantsOS.createIndex('cuisine', 'cuisine', {unique: false}) // Create index for cuisines

      console.log('Creating the restaurants objectstore');
    }
  });

})();

// Function for adding JSON data to indexDB

dbPromise(function(db) {
  var tx = dbPromise.transction('restaurants', 'readwrite');
  var store = tx.objectstore('restaurants');

  restaurants.add(DATABASE_URL); // ???

});


// Reference: https://developers.google.com/web/ilt/pwa/working-with-indexeddb