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

    static async addRestaurants(restaurants) {
        let store = (await this.dbPromise).transaction('restaurants', 'readwrite').objectStore('restaurants');
        for (const restaurant of restaurants) {
            store.put(restaurant);
        }
    }

    static async addRestaurant(restaurant) {
        let store = (await this.dbPromise).transaction('restaurants', 'readwrite').objectStore('restaurants');
        store.put(restaurant);
    }

    static async getRestaurants() {
        let store = (await this.dbPromise).transaction('restaurants', 'readwrite').objectStore('restaurants');
        return await store.getAll();
    }

    static async getRestaurant(id) {
        let store = (await this.dbPromise).transaction('restaurants', 'readwrite').objectStore('restaurants');
        return await store.get(parseInt(id));
    }

    static async addReviews(reviews) {
        let store = (await this.dbPromise).transaction('reviews', 'readwrite').objectStore('reviews');
        for (const restaurant of reviews) {
            store.put(restaurant);
        }
    }

    static async addReview(review) {
        let store = (await this.dbPromise).transaction('reviews', 'readwrite').objectStore('reviews');
        store.put(review);
    }

    static async getReviews() {
        let store = (await this.dbPromise).transaction('reviews', 'readwrite').objectStore('reviews');
        return await store.getAll();
    }

    static async getReview(id) {
        let store = (await this.dbPromise).transaction('reviews', 'readwrite').objectStore('reviews');
        return await store.get(parseInt(id));
    }

    static async getReviewsOfRestaurant(restaurantId) {
        let store = (await this.dbPromise).transaction('reviews', 'readwrite').objectStore('reviews');
        return await store.index('restaurant_id').getAll(parseInt(restaurantId));
    }
}

IDBHelper.setup();