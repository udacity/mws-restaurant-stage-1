var CACHE = 'restaurant-cache';

self.addEventListener('install', function(event) {
	console.log('installing SW');

	event.waitUntil(precache());

	console.log('finished installing SW');

});

self.addEventListener('fetch', function(event) {
	//console.log('SW serving asset');
	const URL = event.request.url
	console.log(event.request.url);

if (URL.startsWith('http://localhost')) {
		event.respondWith(fromCache(event.request)
		.catch(function() {
			console.log(`serving ${URL} from cache `);

			return fromNetwork(event.request)
		}));
	} else {
		event.respondWith(fromNetwork(event.request));
	}
});

function precache() {
	return caches.open(CACHE).then(function(cache) {
		return cache.addAll([
			'/css/styles.css',
			'/data/restaurants.json',
			'/js/dbhelper.js',
			'/js/main.js',
			'/js/restaurant_info.js',
			'/index.html',
			'/restaurant.html',
			'/img/1.jpg',
			'/img/2.jpg',
			'/img/3.jpg',
			'/img/4.jpg',
			'/img/5.jpg',
			'/img/6.jpg',
			'/img/7.jpg',
			'/img/8.jpg',
			'/img/9.jpg',
			'/img/10.jpg'
		]);
	});
}

function fromCache(request) {
	//console.log('loading from cache');

	return caches.open(CACHE).then(function (cache) {
		return cache.match(request).then(function(matching) {
			return matching || Promise.reject('no-match');
		});
	});
}

function fromNetwork(request) {
	//console.log('loading from network');

	return new Promise(function(fulfill, reject) {
		fetch(request).then(function(response) {
			fulfill(response);
		}, reject);
	});
}

function update(request, response) {
	//console.log('updating');

	return caches.open(CACHE).then(function(cache)  {
		return cache.put(request, response);
	});
}