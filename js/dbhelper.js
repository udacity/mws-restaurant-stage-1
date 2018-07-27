
/**
 * Common database helper functions.
 */

// Change this to your server port
const port = 1337;

class DBHelper {
	static openDB() {
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
	/**
	 * Database URL.
	 *
	 */
	static get DATABASE_URL() {
		return `http://localhost:${port}/restaurants`;
	}
	static get REVIEW_URL() {
		return `http://localhost:${port}/restaurants/reviews/`;
	}

	/**
	 * Fetch all restaurants. Now populates with either legacy XHR or fetch
	 */

	static fetchRestaurants(callback) {
		fetch(`${DBHelper.DATABASE_URL}`, {method: 'GET'})
			.then(function(response){
				//console.log('First then biatch', response);
				return response.json();
			})
			.then(data => callback(null, data))
			.catch(error => callback(`fetch request failed ${error.statusText}`, null));
	}


/*make fetchRestaurants or store... as fetch it stores in DB, as store it does not. Refractor into idb.js
	static fetchRestaurants(callback) {
		const dbPromise = DBHelper.openDatabase();
		//retrieve json
		fetch(`${DBHelper.DATABASE_URL}`, {method: 'GET'})
			.then(response => {
				console.log('1 Got the json for IDBIATCH', response);
				return response.json();
				//place json
			}).then (restaurants => {
				console.log('2 setup placement to IDBIATCH', restaurants);
				dbPromise.then(function (db) {
					if (!db) return;
					var tx = db.transaction('restaurants', 'readwrite');
					var store = tx.objectStore('restaurants');
					//place each restaurant in DB
					restaurants.forEach(restaurant => {
						store.put(restaurant);
						console.log('Successfully placed in IDBiatch', restaurant);
					});
					//retrieve restaurants
					dbPromise.then(db => {
						var tx = db.transaction('restaurants', 'readonly');
						var store = tx.objectStore('restaurants');
						return store.getAll();
					})
						.then(response => {
							console.log('TAKEN out of IDBiatch', response);
							return response;
						}).then(data => callback(null, data))
						.catch(error => callback(`fetch request failed ${error.statusText}`, null));

				});
			});
	}
	*/

	/* old XHR
		let xhr = new XMLHttpRequest();
		xhr.open('GET', DBHelper.DATABASE_URL);
		xhr.onload = () => {
			if (xhr.status === 200) { // Got a success response from server!
				const json = JSON.parse(xhr.responseText);
				const restaurants = json;//changed json.restaurants so XHR would work
				console.log(json);
				callback(null, restaurants);
			} else { // Oops!. Got an error from server.
				const error = (`Request failed. Returned status of ${xhr.status}`);
				callback(error, null);
			}
		};
		xhr.send();
	}
*/

	/**
	 * Fetch a restaurant by its ID.
	 */
	static fetchRestaurantById(id, callback) {
		// fetch all restaurants with proper error handling.
		DBHelper.fetchRestaurants((error, restaurants) => {
			if (error) {
				callback(error, null);
			} else {
				const restaurant = restaurants.find(r => r.id == id);
				if (restaurant) { // Got the restaurant
					callback(null, restaurant);
				} else { // Restaurant does not exist in the database
					callback('Restaurant does not exist', null);
				}
			}
		});
	}

	/**
	 * Fetch restaurants by a cuisine type with proper error handling.
	 */
	static fetchRestaurantByCuisine(cuisine, callback) {
		// Fetch all restaurants  with proper error handling
		DBHelper.fetchRestaurants((error, restaurants) => {
			if (error) {
				callback(error, null);
			} else {
				// Filter restaurants to have only given cuisine type
				const results = restaurants.filter(r => r.cuisine_type == cuisine);
				callback(null, results);
			}
		});
	}

	/**
	 * Fetch restaurants by a neighborhood with proper error handling.
	 */
	static fetchRestaurantByNeighborhood(neighborhood, callback) {
		// Fetch all restaurants
		DBHelper.fetchRestaurants((error, restaurants) => {
			if (error) {
				callback(error, null);
			} else {
				// Filter restaurants to have only given neighborhood
				const results = restaurants.filter(r => r.neighborhood == neighborhood);
				callback(null, results);
			}
		});
	}

	/**
	 * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
	 */
	static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, callback) {
		// Fetch all restaurants
		DBHelper.fetchRestaurants((error, restaurants) => {
			if (error) {
				callback(error, null);
			} else {
				let results = restaurants;
				if (cuisine != 'all') { // filter by cuisine
					results = results.filter(r => r.cuisine_type == cuisine);
				}
				if (neighborhood != 'all') { // filter by neighborhood
					results = results.filter(r => r.neighborhood == neighborhood);
				}
				callback(null, results);
			}
		});
	}

	/**
	 * Fetch all neighborhoods with proper error handling.
	 */
	static fetchNeighborhoods(callback) {
		// Fetch all restaurants
		DBHelper.fetchRestaurants((error, restaurants) => {
			if (error) {
				callback(error, null);
			} else {
				// Get all neighborhoods from all restaurants
				const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood);
				// Remove duplicates from neighborhoods
				const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i);
				callback(null, uniqueNeighborhoods);
			}
		});
	}

	/**
	 * Fetch all cuisines with proper error handling.
	 */
	static fetchCuisines(callback) {
		// Fetch all restaurants
		DBHelper.fetchRestaurants((error, restaurants) => {
			if (error) {
				callback(error, null);
			} else {
				// Get all cuisines from all restaurants
				const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type);
				// Remove duplicates from cuisines
				const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i);
				callback(null, uniqueCuisines);
			}
		});
	}

	/**
	 * Restaurant page URL.
	 */
	static urlForRestaurant(restaurant) {
		return (`./restaurant.html?id=${restaurant.id}`);
	}

	/**
	 * Restaurant image URL.
	 */
	//handle missing photo
	static imageUrlForRestaurant(restaurant) {
		
		if (restaurant.photograph) {
			return (`/img/${restaurant.photograph}`);
		} else {
			return (`/img/${restaurant.id}.jpg`);
		}
	}

	/**
	 * Map marker for a restaurant.
	 */
	static mapMarkerForRestaurant(restaurant, map) {
		const marker = new L.marker([restaurant.latlng.lat, restaurant.latlng.lng],
			{title: restaurant.name,
				alt: restaurant.name,
				url: DBHelper.urlForRestaurant(restaurant)
			});
		marker.addTo(newMap);
		return marker;
	}

}
