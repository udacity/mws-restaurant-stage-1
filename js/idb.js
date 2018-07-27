//IDB open and create
function openDB() {
	if (!navigator.serviceWorker) {
		return Promise.resolve();
	}
	return idb.open('restaurantR', 1, function(upgradeDb) {
		var store = upgradeDb.createObjectStore('restaurants', {keyPath: 'id'});
		store.createIndex('by-id', 'id');
		store.createIndex('by-neighborhood', 'neighborhood');
		store.createIndex('by-cuisine', 'cuisine_type');
	});
}
//steps in order
openDB()
	.then(storeRestaurants())
	.then(pullRestaurants())
	.catch((err) => console.log(`IDB is unhappy and failed with ${err}`));

function storeRestaurants() {
	let dbPromise = openDB();
	//retrieve json
	fetch(`${DBHelper.DATABASE_URL}`, {method: 'GET'})
		.then(response => {
			console.log('1 Got the json for IDBIATCH', response);
			return response.json();
			//place json
		}).then (restaurants => {
			console.log('Begin placement to IDBIATCH', restaurants);
			dbPromise.then(function (db) {
				if (!db) return;
				let tx = db.transaction('restaurants', 'readwrite');
				let store = tx.objectStore('restaurants');
				//place each restaurant in DB
				restaurants.forEach(restaurant => {
					store.put(restaurant);
					console.log('Successfully cached each restaurant in IDBiatch', restaurant);
				});
				return tx.complete;
			});
		});
}
function pullRestaurants() {
	let dbPromise = openDB();
	//retrieve restaurants
	dbPromise.then(db => {
		let tx = db.transaction('restaurants', 'readonly');
		let store = tx.objectStore('restaurants');
		return store.getAll();
	})
		.then((restaurants) => {
			console.log('Retrieved out of IDBiatch', restaurants);
			return restaurants;
		});
}
