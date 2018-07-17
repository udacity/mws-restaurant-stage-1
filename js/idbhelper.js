class IDBHelper {
    // Static constructor to create Indexed DB reference
    static setup() {
        this.dbPromise = idb.open('mws-db', 2, upgradeDb => {
            switch (upgradeDb.oldVersion) {
                case 0:
                    upgradeDb.createObjectStore('restaurants', { keyPath: 'id' });
                    console.log('created db v1');
                case 1:
                    upgradeDb.createObjectStore('reviews', { keyPath: 'id' });
                    console.log('created db v2');
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

    static async addReviews(reviews) {
        let store = (await this.dbPromise).transaction('reviews', 'readwrite').objectStore('reviews');
        for (const restaurant of reviews) {
            store.put(restaurant);
        }
    }

    static async getReviews() {
        let store = (await this.dbPromise).transaction('reviews', 'readwrite').objectStore('reviews');
        return store.getAll();
    }
}

IDBHelper.setup();