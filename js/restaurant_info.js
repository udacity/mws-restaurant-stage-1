/* globals L, ApiHelper */
var newMap;

const UdacityYelpRestaurant = {
    restaurant: undefined,

    init () {
        this.addListeners()
            .initMap();
    },

    initMap() {
        this.fetchRestaurantFromURL()
            .then(() => {
                newMap = L.map('map', {
                    center: [this.restaurant.latlng.lat, this.restaurant.latlng.lng],
                    zoom: 16,
                    scrollWheelZoom: false
                });

                L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.jpg70?access_token={mapboxToken}', {
                    mapboxToken: 'pk.eyJ1Ijoiam9ubGluayIsImEiOiJjamwzM3c2enowM3cxM3ZyeHp5ejl4M3c5In0.QfxCqP7NfzFifui4vPyMuA',
                    maxZoom: 18,
                    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
                        '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
                        'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
                    id: 'mapbox.streets'
                }).addTo(newMap);

                this.fillBreadcrumb();
                ApiHelper.mapMarkerForRestaurant(this.restaurant, newMap);
            })
            .catch(error => {
                throw error;
            });
    },

    addListeners () {        
        document.querySelector('#favorite-heart').addEventListener('click', () => this.toggleFavorite());
        return this;
    },

    toggleFavorite () {
        const will_be_favorite = this.restaurant.isFavorite === 'true' ? 'false' : 'true';
        fetch(`http://localhost:1337/restaurants/${this.restaurant.id}/?is_favorite=${will_be_favorite}`, {
                method: 'PUT'
            })
            .then(() => {
                this.restaurant.isFavorite = will_be_favorite;
                if (will_be_favorite === 'true') {
                    document.querySelector('#favorite-heart').classList.add('favorite');
                } else {
                    document.querySelector('#favorite-heart').classList.remove('favorite');
                }
            })
            .catch(() => {
                // defer submission
            });
    },

    // Get current restaurant from page URL.
    fetchRestaurantFromURL() {
        if (this.restaurant) { // restaurant already fetched!
            return Promise.resolve();
        }

        const id = this.getParameterByName('id');
        if (!id) { // no id found in URL
            return Promise.reject('No restaurant id in URL');
        } else {
            return ApiHelper.fetchRestaurantById(id)
                .then(restaurant => {
                    this.restaurant = restaurant;
                    this.fillRestaurantHTML();
                    return Promise.resolve();
                });
        }
    },

    // Create restaurant HTML and add it to the webpage
    fillRestaurantHTML() {
        const name = document.getElementById('restaurant-name');
        name.innerHTML = this.restaurant.name;

        if (this.restaurant.is_favorite === 'true') {
            document.getElementById('favorite-heart').classList.add('favorite');
        }

        const address = document.getElementById('restaurant-address');
        address.innerHTML = this.restaurant.address;

        const img_url_fragment = ApiHelper.imageUrlForRestaurant(this.restaurant);
        const image            = document.getElementById('restaurant-img');
        image.className        = 'restaurant-img'
        image.src              = `${img_url_fragment}-300.jpg`;
        image.srcset           = `${img_url_fragment}-600.jpg 1000w, ${img_url_fragment}-1200.jpg 2000w`;
        image.alt              = `classy photo from ${this.restaurant.name}`;

        const cuisine = document.getElementById('restaurant-cuisine');
        cuisine.innerHTML = this.restaurant.cuisine_type;

        // fill operating hours
        if (this.restaurant.operating_hours) {
            this.fillRestaurantHoursHTML();
        }
        // fill reviews
        this.fillReviewsHTML();
    },

    // Create restaurant operating hours HTML table and add it to the webpage.
    fillRestaurantHoursHTML(operatingHours = this.restaurant.operating_hours) {
        const hours = document.getElementById('restaurant-hours');
        for (let key in operatingHours) {
            const row = document.createElement('tr');

            const day = document.createElement('td');
            day.innerHTML = key;
            row.appendChild(day);

            const time = document.createElement('td');
            time.innerHTML = operatingHours[key];
            row.appendChild(time);

            hours.appendChild(row);
        }
    },

    // Create all reviews HTML and add them to the webpage.
    fillReviewsHTML(reviews = this.restaurant.reviews) {
        const container = document.getElementById('reviews-container');
        const title     = document.createElement('h3');
        title.innerHTML = 'Reviews';
        container.appendChild(title);

        if (!reviews) {
            const noReviews     = document.createElement('p');
            noReviews.innerHTML = 'No reviews yet!';
            container.appendChild(noReviews);
            return;
        }
        const ul = document.getElementById('reviews-list');
        reviews.forEach(review => {
            ul.appendChild(this.createReviewHTML(review));
        });
        container.appendChild(ul);
    },

    // Create review HTML and add it to the webpage.
    createReviewHTML(review) {
        const li = document.createElement('li');
        const name = document.createElement('p');
        name.innerHTML = review.name;
        li.appendChild(name);

        const date = document.createElement('p');
        date.innerHTML = review.date;
        li.appendChild(date);

        const rating = document.createElement('p');
        rating.innerHTML = `Rating: ${review.rating}`;
        li.appendChild(rating);

        const comments = document.createElement('p');
        comments.innerHTML = review.comments;
        li.appendChild(comments);

        return li;
    },

    // Add restaurant name to the breadcrumb navigation menu
    fillBreadcrumb(restaurant = this.restaurant) {
        const breadcrumb = document.getElementById('breadcrumb');
        const li         = document.createElement('li');
        li.innerHTML     = restaurant.name;
        breadcrumb.appendChild(li);
    },

    // Get a parameter by name from page URL.
    getParameterByName(name, url) {
        if (!url){
            url = window.location.href;
        }

        name = name.replace(/[\[\]]/g, '\\$&');
        const regex   = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`);
        const results = regex.exec(url);

        if (!results){
            return null;
        }

        if (!results[2]){
            return '';
        }

        return decodeURIComponent(results[2].replace(/\+/g, ' '));
    },
}

document.addEventListener('DOMContentLoaded', () => {
    UdacityYelpRestaurant.init();
});

if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js');
}
