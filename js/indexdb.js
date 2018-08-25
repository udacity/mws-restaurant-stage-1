(function() {
  'use strict';

  // Check for browser support

  if (!('indexedDB' in window)) {
    console.log('This browser doesn\'t support IndexedDB');
    return;
  }

  // Creates the database

  var dbPromise = idb.open('mws-restaurant-reviews', 2, function(upgradeDb) {
    console.log('Creating the database');

    if (!upgradeDb.objectStoreNames.contains('restaurants')) { // If there is not an objectstore named 'restaurants', create one
      upgradeDb.createObjectStore('restaurants');
    }
  });

})();

// Reference: https://developers.google.com/web/ilt/pwa/working-with-indexeddb