(function() {
  'use strict';

  // Check for browser support
  if (!('indexedDB' in window)) {
    console.log('This browser doesn\'t support IndexedDB');
    return;
  }

  var dbPromise = idb.open('mws-restaurant-reviews', 1);

})();

// Reference: https://developers.google.com/web/ilt/pwa/working-with-indexeddb