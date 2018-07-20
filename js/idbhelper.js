class IDBHelper {
    // Static constructor to create Indexed DB reference
    static setup() {
        this.dbPromise = idb.open('mws-db', 2, upgradeDb => {
            switch (upgradeDb.oldVersion) {
                case 0:
                    upgradeDb.createObjectStore('restaurants', { keyPath: 'id' });
                    console.log('created db v1');
                case 1:
                    let reviewsStore = upgradeDb.createObjectStore('reviews', { keyPath: 'id' });
                    reviewsStore.createIndex('restaurant_id', 'restaurant_id', { unique: false });
                    console.log('created db v2');
            }
        });
    }

    static async putObjects(objects, storeName, create = false) {
        try {
            let store = (await this.dbPromise).transaction(storeName, 'readwrite').objectStore(storeName);
            let response = [];
            for (const object of objects) {
                object.updatedAt = Date.now();
                if (create) {
                    object.id = IDBHelper.getMaxIndex(store) + 1;
                    object.createdAt = object.updatedAt;
                }
                response.push(await store.put(object));
            }

            return response;
        }
        catch (error) {
            console.error(error);
            return null;
        }
    }

    static async putObject(object, storeName, create = false) {
        try {
            let store = (await this.dbPromise).transaction(storeName, 'readwrite').objectStore(storeName);
            let now = Date.now();
            object.updatedAt = (new Date(now)).toJSON();
            if (create) {
                object.id = await IDBHelper.getMaxIndex(store) + 1;
                object.createdAt = now;
            }
            return await store.put(object);
        }
        catch (error) {
            console.log(object);
            console.error(error);
            return null;
        }
    }

    static async getObjects(storeName) {
        try {
            let store = (await this.dbPromise).transaction(storeName, 'readwrite').objectStore(storeName);
            return await store.getAll();
        }
        catch (error) {
            console.error(error);
            return null;
        }
    }

    static async getObject(id, storeName) {
        try {
            let store = (await this.dbPromise).transaction(storeName, 'readwrite').objectStore('restaurants');
            return await store.get(parseInt(id));
        }
        catch (error) {
            console.error(error);
            return null;
        }
    }

    static async getReviewsOfRestaurant(restaurantId) {
        try {
            let store = (await this.dbPromise).transaction('reviews', 'readwrite').objectStore('reviews');
            return await store.index('restaurant_id').getAll(parseInt(restaurantId));
        }
        catch (error) {
            console.error(error);
            return null;
        }
    }

    static async getMaxIndex(store) {
        return Math.max(...await store.getAllKeys());
    }
}

IDBHelper.setup();