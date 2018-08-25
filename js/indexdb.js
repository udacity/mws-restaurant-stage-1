(function() {
  'use strict';

  // Check for browser support

  if (!('indexedDB' in window)) {
    console.log('This browser doesn\'t support IndexedDB');
    return;
  }

  // Creates the database

  var dbPromise = idb.open('mws-restaurant-reviews', 3, function(upgradeDb) {
    console.log('Creating the database');

  // If there is not an objectstore named 'restaurants', create one
    if (!upgradeDb.objectStoreNames.contains('restaurants', {keypath: 'id'} )) { 
      upgradeDb.createObjectStore('restaurants');

      console.log('Creating the restaurants objectstore');
    }
  });

})();

// Reference: https://developers.google.com/web/ilt/pwa/working-with-indexeddb