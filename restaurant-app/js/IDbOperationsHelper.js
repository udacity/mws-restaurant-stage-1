const API_URL = 'http://localhost:1337/restaurants';
let fetchStatus = 0;

// Helper Functions for various IDb Operations
class IDbOperationsHelper {
    static checkForIDbSupport() {
        if (!('indexedDB' in window)) {
            return 0;
        } else {
            return 1;
        }
    }

    static openIDb(name, version, objectStoreName) {
        const dbPromise = idb.open(name, version, upgradeDB => {
            upgradeDB.createObjectStore(objectStoreName, { autoIncrement: true });
        });
        return dbPromise;
    }

    static addToDb(dbPromise, objectStoreName, permision, jsonData) {
        dbPromise.then(db => {
            const transact = db.transaction(objectStoreName, permision);
            //Add all the json content here
            transact.objectStore(objectStoreName).put(jsonData);
            return transact.complete;
        }).then(response => {
            console.log('Restaurant saved to IDb');
        });
    }

    static getAllData(dbPromise, transactionName, objectStoreName) {
        let responseArrayPromise = dbPromise.then(db => db
            .transaction(transactionName)
            .objectStore(objectStoreName)
            .getAll()
            );
        responseArrayPromise.then(arry => {
            IDbOperationsHelper.setRestaurantsData(arry);
        });
    }

    static getRestaurantsFromServer(dbPromise, objectStoreName, permision, callback) {
        fetch(API_URL)
        .then(response => response.json())
        .then(responseJson => {
            responseJson.forEach(restaurant => {
                restaurant = IDbOperationsHelper.addMissingData(restaurant)
            });

            if (fetchStatus != 1) {
                fetchStatus = 1;
                responseJson.forEach(restaurantData => {

                    //Add every single restaurant data to IDb
                    IDbOperationsHelper.addToDb(
                        dbPromise,
                        objectStoreName,
                        permision,
                        restaurantData
                    );
                });
            }

            console.log(responseJson);
            callback (null, responseJson);
        }).catch(error => {
            console.log(`Unable to fetch restaurants, Error: ${error}`);
            callback (error, null);
        });
    }

    static getRestaurantsData(callback) {
        const idbName = 'restaurants-data';
        const dbVersion = 1;
        const objectStoreNameString = 'restaurants';
        const transactionNameString = 'restaurants';
        const dbPermission = 'readwrite';

        let dbPromise = IDbOperationsHelper.openIDb(
            idbName,
            dbVersion,
            objectStoreNameString
        );

        dbPromise.then(db =>
            db.transaction(transactionNameString)
              .objectStore(objectStoreNameString)
              .getAll()
        ).then(responseObejcts => {
            if (responseObejcts.length <= 0) {
                IDbOperationsHelper.getRestaurantsFromServer(
                    dbPromise,
                    objectStoreNameString,
                    dbPermission,
                    callback
                );
            } else {
                callback(null, responseObejcts);
            }
        });
    }

    // Handle for last entry on Restaurants List
    static addMissingData(restJson) {
        if (!isNaN(restJson.photograph)) {
            restJson.photograph = restJson.photograph + '.jpg';
        } else {
            restJson['photograph'] = restJson.id + '.jpg';
        }
        return restJson;
    }
}
