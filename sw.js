// Service Worker

let projectCache = 'v1';
const cacheFiles = [
	'./',
	'./index.html',
	'./restaurant.html',
	'./sw.js',
	'./img/',
	'./css/styles.css',
	'./js/main.js',
	'./js/restaurant_info.js',
	'./js/dbhelper.js',
	'./data/restaurants.json',
	'./manifest.json'
];

// install the service worker
self.addEventListener('install', (event) => {
	//dont wait for install
	self.skipWaiting();
	console.log('SW Installed correctly');
	// install steps wait until version is opened and cache
	event.waitUntil(
		caches.open(projectCache).then((cache) => {
			console.log('SW Cache is installing');
			//opened and use cache.addAll to add files
			return cache.addAll(cacheFiles);
		}).catch((error) => {
			// install failed
			console.log('SW Open & Cache install failed with ' + error);
		})
	);
});

// activate service worker
self.addEventListener('activate', (event) => {
	//success!
	console.log('Service Worker Activated');
	event.waitUntil(
		caches.keys().then((projectCaches) => {
			return Promise.all(projectCaches.map((thisprojectCache) => {
				//if cache versions to not match, delete old version
				if (thisprojectCache !== projectCache) {
					console.log('Service Worker Removing Cache version');
					return caches.delete(thisprojectCache);
				}
			}));
		})
	);
});

// fetch service worker
self.addEventListener('fetch', (event) => {
	// fetch steps
	console.log('Fetch event');

	let request = event.request;

	event.respondWith (
		//match requests to cache, including pages on demand
		caches.match(request, {ignoreSearch: true}).then((response) => {
			if (response) {
				//return cached files
				console.log('[ServiceWorker] found in cache', event.request);
				return response;
			} else {
			//if request is not in cache, add it
				return fetch(request).then((response) => {
					let toCache = response.clone();
					caches.open(projectCache).then((cache) => {
						cache.put(request, toCache).catch((err) => {
							console.warn(request.url + err);
						});
					});
					return response;
				});
			}
		})
	);
});