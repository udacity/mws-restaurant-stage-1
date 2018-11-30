(() => {
  'use strict'
  
  // Check for IDB support in browser
  if (!('indexedDB' in window)) {
    //console.warn('IndexedDB not supported')
    console.log('IndexedDB not supported')
    return
  }

  //const name = 'restaurants-DB'
  //const version = 3 
  const dbPromise = idb.open('restaurants-DB', 3, upgradeDB => {
    switch (upgradeDB.oldVersion) {
      case 0:
        upgradeDB.createObjectStore('restaurants', { keyPath: 'id', unique: true });
      case 1:
        const reviewStore = upgradeDB.createObjectStore('reviews', { autoIncrement: true });
        reviewStore.createIndex('restaurant_id', 'restaurant_id', { unique: true });
      case 2:
        upgradeDB.createObjectStore('offline-store', { autoIncrement: true });
    }
  })
  .then(db => console.log('IDB creation successful'))
  
  // Source: idb by Jake Archibald - https://www.npmjs.com/package/idb
  const idbKeyval = {
    get(key) {
      return dbPromise.then(db => {
        return db.transaction('keyval')
          .objectStore('keyval').get(key);
      });
    },
    set(key, val) {
      return dbPromise.then(db => {
        const tx = db.transaction('keyval', 'readwrite');
        tx.objectStore('keyval').put(val, key);
        return tx.complete;
      });
    },
    delete(key) {
      return dbPromise.then(db => {
        const tx = db.transaction('keyval', 'readwrite');
        tx.objectStore('keyval').delete(key);
        return tx.complete;
      });
    },
    clear() {
      return dbPromise.then(db => {
        const tx = db.transaction('keyval', 'readwrite');
        tx.objectStore('keyval').clear();
        return tx.complete;
      });
    },
    keys() {
      return dbPromise.then(db => {
        const tx = db.transaction('keyval');
        const keys = [];
        const store = tx.objectStore('keyval');
   
        // This would be store.getAllKeys(), but it isn't supported by Edge or Safari.
        // openKeyCursor isn't supported by Safari, so we fall back
        (store.iterateKeyCursor || store.iterateCursor).call(store, cursor => {
          if (!cursor) return;
          keys.push(cursor.key);
          cursor.continue();
        });
   
        return tx.complete.then(() => keys);
      });
    }
  };

})()