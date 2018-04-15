import * as idb from '../../node_modules/idb';

let _dbPromise;
export default class IdbRestaurants {

  static get db() {
    if(!_dbPromise){
      IdbRestaurants.createDb();
    }
    return _dbPromise;
  }

  static createDb() {
    _dbPromise = idb.open('restaurantsDb', 1, function(upgradeDB) {
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
    });
  }

}