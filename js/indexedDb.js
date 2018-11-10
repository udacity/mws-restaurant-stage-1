openLocalDataBase = () => {
  // static OpenLocalDatabase(callback) {
 if (!navigator.serviceWorker) {
    return Promise.resolve();
  }
    this._dbPromise = idb.open('local-db', 1, function(upgradeDb) {
      var keyValStore2 = upgradeDb.createObjectStore('restaurantList');
    //keyValStore2.put("world", "hello");
    console.log('opened db');
   });
  return this._dbPromise;
}

AddRestaurantsToLocalDatabase = (restaurants)=> {
  if (!navigator.serviceWorker) {
    return Promise.resolve();
  }

  this._dbPromise.then(function(db) {
   if (!db) return;

     var tx = db.transaction('restaurantList', 'readwrite');
     var store = tx.objectStore('restaurantList');
     //store.put("restaurant", 'photograph')
      restaurants.forEach(function(restaurant) {
          //console.log(restaurant.photograph);
          var tx = db.transaction('restaurantList', 'readwrite');
          var store = tx.objectStore('restaurantList');
          store.put(restaurant, restaurant.id);
          return tx.complete;
        });
        //callback(null, results);
    });
 // });
}

/*
fetchRestaurantsFromLocalDatabase = () => {

  var dbP = openLocalDataBase();
  dbP.then(function (db) {
    if (!db) return;

     var tx = db.transaction('restaurantList', 'readwrite');
     var store = tx.objectStore('restaurantList');
     return store.getAll().then(restaurants => {
       console.log(`Returned restaurants ${restaurants}`);
       return restaurants.json();
     })
     //callback(null, restaurants);
     //return tx.complete;
  });
}
*/

fetchRestaurantsFromLocalDatabase = () => {
  return new Promise((resolve, reject) => {
  if (!navigator.serviceWorker) {
   reject('');
      //return Promise.resolve();
 }
 //openLocalDataBase();
 this._dbPromise.then(function (db) {
   if (!db) return;

    var tx = db.transaction('restaurantList', 'readwrite');
    var store = tx.objectStore('restaurantList');
    return store.getAll().then(restaurants => {
      console.log(`Returned restaurants ${restaurants}`);
      resolve(restaurants);
      //return restaurants;
    });
    //callback(null, restaurants);
     tx.complete;
 });
  });
}