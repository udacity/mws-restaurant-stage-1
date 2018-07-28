let restaurants,
	neighborhoods,
	cuisines;
var newMap;
var markers = [];


/**
 * Fetch neighborhoods and cuisines as soon as the page is loaded. window.init added to init
 */

document.addEventListener('DOMContentLoaded', (event) => {
	initMap();
	fetchNeighborhoods();
	fetchCuisines();
});
/**
 * Leaflet map, called from HTML window.init added to init
*/
initMap = () => {
	self.newMap = L.map('map', {
		center: [40.722216, -73.987501],
		zoom: 12,
		scrollWheelZoom: false
	});
	L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.jpg70?access_token={mapboxToken}', {
		mapboxToken: 'pk.eyJ1IjoiYWxpZWNha2UiLCJhIjoiY2ppYW9pdzZxMGIweTNwbzdrbW82amJwYSJ9.t83apE-NLoi0dvupLaxFlg',
		maxZoom: 18,
		attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
		'<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
		'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
		id: 'mapbox.streets'
	}).addTo(newMap);

	updateRestaurants();
};
/**
 * Fetch all neighborhoods and set their HTML.
 */
fetchNeighborhoods = () => {
	DBHelper.fetchNeighborhoods((error, neighborhoods) => {
		if (error) { // Got an error
			console.error(error);
		} else {
			self.neighborhoods = neighborhoods;
			fillNeighborhoodsHTML();
		}
	});
};

/**
 * Set neighborhoods HTML.
 */
fillNeighborhoodsHTML = (neighborhoods = self.neighborhoods) => {
	const select = document.getElementById('neighborhoods-select');
	neighborhoods.forEach(neighborhood => {
		const option = document.createElement('option');
		option.innerHTML = neighborhood;
		option.value = neighborhood;
		select.append(option);
	});
};

/**
 * Fetch all cuisines and set their HTML.
 */
fetchCuisines = () => {
	DBHelper.fetchCuisines((error, cuisines) => {
		if (error) { // Got an error!
			console.error(error);
		} else {
			self.cuisines = cuisines;
			fillCuisinesHTML();
		}
	});
};

/**
 * Set cuisines HTML.
 */
fillCuisinesHTML = (cuisines = self.cuisines) => {
	const select = document.getElementById('cuisines-select');

	cuisines.forEach(cuisine => {
		const option = document.createElement('option');
		option.innerHTML = cuisine;
		option.value = cuisine;
		select.append(option);
	});
};

/**
 * Update page and map for current restaurants.
 */
updateRestaurants = () => {
	const cSelect = document.getElementById('cuisines-select');
	const nSelect = document.getElementById('neighborhoods-select');

	const cIndex = cSelect.selectedIndex;
	const nIndex = nSelect.selectedIndex;

	const cuisine = cSelect[cIndex].value;
	const neighborhood = nSelect[nIndex].value;

	DBHelper.fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, (error, restaurants) => {
		if (error) { // Got an error!
			console.error(error);
		} else {
			resetRestaurants(restaurants);
			fillRestaurantsHTML();
		}
	});
};

/**
 * Clear current restaurants, their HTML and remove their map markers.
 */
resetRestaurants = (restaurants) => {
	// Remove all restaurants
	self.restaurants = [];
	const ul = document.getElementById('restaurants-list');
	ul.innerHTML = '';

	// Remove all map markers
	self.markers.forEach(m => m.setMap(null));
	self.markers = [];
	self.restaurants = restaurants;
};

/**
 * Create all restaurants HTML and add them to the webpage.
 */
fillRestaurantsHTML = (restaurants = self.restaurants) => {
	const ul = document.getElementById('restaurants-list');
	restaurants.forEach(restaurant => {
		ul.append(createRestaurantHTML(restaurant));
	});
	addMarkersToMap();
};

/**
 * Create restaurant HTML.
 * Set alts for images
 * added picture element.
 * Created picture, source, imageurl to be used to srcsets
 */
createRestaurantHTML = (restaurant) => {
	const li = document.createElement('li');

	const picture = document.createElement('picture');
	const image = document.createElement('img');
	const source1 = document.createElement('source');
	const source2 = document.createElement('source');
	let imageURL = DBHelper.imageUrlForRestaurant(restaurant).replace('.jpg', '');

	source1.media = '(max-width: 800px)';
	source2.media = '(min-width: 801px)';
	source1.srcset = `${imageURL}_small.jpg`;
	source2.srcset = `${imageURL}_large.jpg`;

	image.src = DBHelper.imageUrlForRestaurant(restaurant);
	image.className = 'restaurant-img';
	image.alt = document.getElementById('restaurant-name');
	image.alt = `Picture of ${restaurant.name} restaurant`;

	li.append(picture);
	picture.appendChild(source1);
	picture.appendChild(source2);
	picture.appendChild(image);

	const name = document.createElement('h1');
	name.innerHTML = restaurant.name;
	li.append(name);

	const neighborhood = document.createElement('p');
	neighborhood.innerHTML = restaurant.neighborhood;
	li.append(neighborhood);

	const address = document.createElement('p');
	address.innerHTML = restaurant.address;
	li.append(address);

	const more = document.createElement('button');
	more.innerHTML = 'View Details';
	// Thank you to Doug Brown for idea to turn a link into button for accessibility https://youtu.be/92dtrNU1GQc - added class & id
	more.className = 'button';
	more.onclick = (() => {
		const url = DBHelper.urlForRestaurant(restaurant);
		window.location.href = url;
	});
	li.append(more);

	return li;
};

/**
 * Add markers for current restaurants to the map changed to Leaflet.
 */
addMarkersToMap = (restaurants = self.restaurants) => {
	restaurants.forEach(restaurant => {
	// Add marker to the map
		const marker = DBHelper.mapMarkerForRestaurant(restaurant, self.newMap);
		marker.on('click', onClick);
		function onClick() {
			window.location.href = marker.options.url;
		}
	});
};
