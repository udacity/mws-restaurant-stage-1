//import idb from 'idb';

class IDBHelper {

    //Open the database
    static openDatabase() {
        if (!('indexedDB' in window)) {
            console.log('This browser doesn\'t support IndexedDB');
            return;
        }

        return idb.open('data', 1, function (upgradeDb) {
            var store = upgradeDb.createObjectStore('restaurants', {
                keyPath: 'id'
            });

            store.createIndex('by-id', 'id');
        });
        // .then(db => {
        //     return this.populateRestaurants(db);
        //     return db;
        // });
    }

    //Get restaurants from server if necessary
    static populateRestaurants(database$) {
        return IDBHelper.getAllRestaurants(database$)
            .then(restaurants => {
                if (restaurants && restaurants.length > 0) {
                    return restaurants;
                }
                return DBHelper.fetchRestaurants()
                    .then(restaurants => {
                        return IDBHelper.addData(database$, restaurants)
                            .then(() => restaurants);
                    });
            });
    }

    //To add data you do the following
    static addData(database$, restaurants) {
        //open the database to make transactions
        return database$.then(function (db) {
            if (!db) return;
            //open an transaction
            var tx = db.transaction('restaurants', 'readwrite'),
                store = tx.objectStore('restaurants');

            //put data in the in the database
            return Promise.all(restaurants.map(function (restaurant) {
                //console.log('Adding item: ', restaurant);
                return store.add(restaurant);
            }));
        });
    }

    static getAllRestaurants(database$) {
        //open the database to make transactions
        return database$.then(function (db) {
            if (!db) return;
            //open an transaction
            var tx = db.transaction('restaurants', 'readonly'),
                store = tx.objectStore('restaurants');

            return store.getAll();
        });
    }

    static getRestaurantById(database$, id) {
        //open the database to make transactions
        return database$.then(function (db) {
            if (!db) return;
            //open an transaction
            let tx = db.transaction('restaurants', 'readonly'),
            store = tx.objectStore('restaurants');

            let index = store.index('by-id');
            return index.get(id);
        });
    }

    /**
   * Fetch restaurants by a cuisine type with proper error handling.
   */
    static getRestaurantByCuisine(database$, cuisine) {
        // Fetch all restaurants  with proper error handling
        return IDBHelper.getAllRestaurants(database$)
            .then(restaurants =>
                // Filter restaurants to have only given cuisine type 
                restaurants.filter(r => r.cuisine_type == cuisine));
    }

    /**
     * Fetch restaurants by a neighborhood with proper error handling.
     */
    static getRestaurantByNeighborhood(database$, neighborhood) {
        // Fetch all restaurants
        return IDBHelper.getAllRestaurants(database$)
            .then(restaurants =>
                // Filter restaurants to have only given neighborhood
                restaurants.filter(r => r.neighborhood == neighborhood));

    }

    /**
     * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
     */
    static getRestaurantByCuisineAndNeighborhood(database$, cuisine, neighborhood) {
        // Fetch all restaurants
        return IDBHelper.getAllRestaurants(database$)
            .then(restaurants => {
                let results = restaurants
                if (cuisine != 'all') { // filter by cuisine
                    results = results.filter(r => r.cuisine_type == cuisine);
                }
                if (neighborhood != 'all') { // filter by neighborhood
                    results = results.filter(r => r.neighborhood == neighborhood);
                }
                return results;
            });
    }

    /**
     * Fetch all neighborhoods with proper error handling.
     */
    static getNeighborhoods(database$) {
        // Fetch all restaurants
        return IDBHelper.getAllRestaurants(database$)
            .then(restaurants => {
                const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood)
                // Remove duplicates from neighborhoods
                const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i)
                return uniqueNeighborhoods;
            });
    }

    /**
     * Fetch all cuisines with proper error handling.
     */
    static getCuisines(database$) {
        // Fetch all restaurants
        return IDBHelper.getAllRestaurants(database$)
            .then(restaurants => {
                // Get all cuisines from all restaurants
                const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type)
                // Remove duplicates from cuisines
                const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i)
                return uniqueCuisines;
            });
    }
}