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

    static async putRestaurants(restaurants, create = false) {
        try {
            let store = (await this.dbPromise).transaction('restaurants', 'readwrite').objectStore('restaurants');
            let response = [];
            for (const restaurant of restaurants) {
                restaurant.updatedAt = Date.now();
                if (create) restaurant.createdAt = restaurant.updatedAt;
                response.push(await store.put(restaurant));
            }

            return response;
        }
        catch (error) {
            console.error(error);
            return null;
        }
    }

    static async putRestaurant(restaurant, create = false) {
        try {
            let store = (await this.dbPromise).transaction('restaurants', 'readwrite').objectStore('restaurants');
            restaurant.updatedAt = Date.now();
            if (create) restaurant.createdAt = restaurant.updatedAt;
            return await store.put(restaurant);
        }
        catch (error) {
            console.error(error);
            return null;
        }
    }

    static async getRestaurants() {
        try {
            let store = (await this.dbPromise).transaction('restaurants', 'readwrite').objectStore('restaurants');
            return await store.getAll();
        }
        catch (error) {
            console.error(error);
            return null;
        }
    }

    static async getRestaurant(id) {
        try {
            let store = (await this.dbPromise).transaction('restaurants', 'readwrite').objectStore('restaurants');
            return await store.get(parseInt(id));
        }
        catch (error) {
            console.error(error);
            return null;
        }
    }

    static async putReviews(reviews, create = false) {
        try {
            let store = (await this.dbPromise).transaction('reviews', 'readwrite').objectStore('reviews');
            let response = [];
            for (const review of reviews) {
                review.updatedAt = Date.now();
                if (create) review.createdAt = review.updatedAt;
                response.push(await store.put(review));
            }

            return response;
        }
        catch (error) {
            console.error(error);
            return null;
        }
    }

    static async putReview(review, create = false) {
        try {
            let store = (await this.dbPromise).transaction('reviews', 'readwrite').objectStore('reviews');
            review.updatedAt = Date.now();
            if (create) review.createdAt = review.updatedAt;
            return await store.put(review);
        }
        catch (error) {
            console.error(error);
            return null;
        }
    }

    static async getReviews() {
        try {
            let store = (await this.dbPromise).transaction('reviews', 'readwrite').objectStore('reviews');
            return await store.getAll();
        }
        catch (error) {
            console.error(error);
            return null;
        }
    }

    static async getReview(id) {
        try {
            let store = (await this.dbPromise).transaction('reviews', 'readwrite').objectStore('reviews');
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
}

IDBHelper.setup();