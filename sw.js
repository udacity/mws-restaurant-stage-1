const staticCacheName  = 'reviews-app--static-v1';
const mapCacheName = 'reviews-app--mapAPI-v1'
const allCaches = [
	staticCacheName,
	mapCacheName
];

self.addEventListener('install', (e) => {
	e.waitUntil(
		caches.open(staticCacheName).then( (cache) => {
			return cache.addAll([
				'./',
				'./index.html',
				'./restaurant.html',
				'./build/data/restaurants.json',
				'./build/css/styles.css',
				'/build/js/dbhelper.js',
				'/build/js/main.js',
				'/build/js/restaurant_info.js',
				/* will work as replacement to images */
				'./offline.png',
				/* Caching map assets */
				'https://unpkg.com/leaflet@1.3.1/dist/leaflet.css',
				'https://unpkg.com/leaflet@1.3.1/dist/leaflet.js',
				'https://unpkg.com/leaflet@1.3.1/dist/images/marker-icon.png',
				/* Cashing font face */
				'https://fonts.googleapis.com/css?family=Lato:400,700'
			]);
		})
	);
});



self.addEventListener('activate', function(e) {
	e.waitUntil(
		caches.keys().then( (keyList) => {
			return Promise.all(
				keyList.filter( (key) => {
					return key.startsWith('reviews-app--') &&
						!allCaches.includes(key);
				})
				.map( (key) => {
					return caches.delete(key);
				})
			);
		})
	);
	return self.clients.claim();
});

/*
	- If request if for an inside page respond with '/restaurant.html'
	- If it's a MAP API asset request:
		- if there is internet access:
		 * fetch new data from the network.
		 * update cache with new data.
		- else:
			* match the cache for a similar request and respond with it
	- else:
		match other requests
		- if request for an image respond with offline.png image

NOTE: the offline image was inspired by james priest's
https://james-priest.github.io/mws-restaurant-stage-1/stage1.html

NOTE: overall handling of the service worker is self implemented due
to extra learning from this article by Jake Archibald
https://jakearchibald.com/2014/offline-cookbook/
*/
self.addEventListener('fetch', e => {
	const mapAPIBaseUrl = 'https://api.tiles.mapbox.com/v4/';
	const insideBaseUrl = `${location.origin}/restaurant.html?id=`;

	if(e.request.url.includes(insideBaseUrl)){
		e.respondWith(caches.match('/restaurant.html'));

	} else if (e.request.url.includes(mapAPIBaseUrl)) {

		e.respondWith(
			fetch(e.request).then( res => {
				console.log('Fetching from Network');
				const resClone = res.clone();
				caches.open(mapCacheName).then( (cache) => {
					cache.put(e.request, resClone);
				});
				return res;
			}).catch(function() {
				console.log('Fetching from Cache');
				return caches.match(e.request);
			})
		);

	} else {
		e.respondWith(
			caches.match(e.request).then(res => {
				return res || fetch(e.request);
			}).catch(error => {
				if (e.request.url.includes('.jpg')) {
					return caches.match('/offline.png');
				}
				console.log('no cache entry for:', e.request.url);
			})
		);
	}
});



