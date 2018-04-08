importScripts('../node_modules/idb/lib/idb.js');

let _dbPromise;
class IdbRestaurants {

  static get db() {
    return _dbPromise;
  }

  static set db(db) {
    _dbPromise = db;
  }

  static createDb() {
    IdbRestaurants.db = idb.open('restaurantsDb', 1, function(upgradeDB) {
      upgradeDB.createObjectStore('restaurants', {
        keyPath: 'id'
      });
    });
  }

  static save(restaurants) {
    IdbRestaurants.db.then(db => {
      const tx = db.transaction('restaurants', 'readwrite');
      restaurants.map((restaurant) => {
        tx.objectStore('restaurants').put(restaurant);
      });
    });
  }

  static getAll() {
    return IdbRestaurants.db.then(db => {
      return db.transaction('restaurants')
        .objectStore('restaurants').getAll();
    })
  }

}