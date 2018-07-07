class IDBHelper {
    // Static constructor to create Indexed DB reference
    static setup() {
        this.dbPromise = idb.open('mws-db', 1, upgradeDb => {
            switch (upgradeDb.oldVersion) {
                case 0:
                    upgradeDb.createObjectStore('restaurants', { keyPath: 'id' });
                    console.log('created db v1');
            }
        });
    }

    static async addRestaurants(restaurants) {
        let store = (await this.dbPromise).transaction('restaurants', 'readwrite').objectStore('restaurants');
        for (const restaurant of restaurants) {
            store.put(restaurant);
        }
    }

    static async getRestaurants() {
        let store = (await this.dbPromise).transaction('restaurants', 'readwrite').objectStore('restaurants');
        return store.getAll();
    }
}

IDBHelper.setup();