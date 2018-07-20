let restaurant;
var newMap;
let form;

/**
 * Initialize map as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {
    initMap();
    form = document.getElementById('new-review-form');
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        submitData();
    })
});

/**
 * Initialize leaflet map
 */
initMap = () => {
    fetchRestaurantFromURL((error, restaurant) => {
        if (error) { // Got an error!
            console.error(error);
        } else {
            self.newMap = L.map('map', {
                center: [restaurant.latlng.lat, restaurant.latlng.lng],
                zoom: 16,
                scrollWheelZoom: false
            });
            L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.jpg70?access_token={mapboxToken}', {
                mapboxToken: MAPBOX_KEY,
                maxZoom: 18,
                attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
                    '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
                    'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
                id: 'mapbox.streets'
            }).addTo(newMap);
            fillBreadcrumb();
            DBHelper.mapMarkerForRestaurant(self.restaurant, self.newMap);
        }
    });
}

/**
 * Get current restaurant from page URL.
 */
fetchRestaurantFromURL = async (callback) => {
    if (self.restaurant) { // restaurant already fetched!
        callback(null, self.restaurant)
        return;
    }
    const id = getParameterByName('id');
    if (!id) { // no id found in URL
        error = 'No restaurant id in URL'
        callback(error, null);
    } else {
        DBHelper.fetchObjectById(id, 'restaurant', async (error, restaurant) => {
            self.restaurant = restaurant;
            if (!self.restaurant) {
                console.error(error);
                return;
            }
            await DBHelper.fetchReviewsByRestaurantId(self.restaurant.id, (error, reviews) => {
                if (error) {
                    console.error(error);
                }
                else {
                    self.restaurant.reviews = reviews;
                }
                fillRestaurantHTML();
                callback(null, self.restaurant)
            })
        });
    }
}

/**
 * Clear restaurant HTML
 */
clearRestaurantHTML = () => {
    const name = document.getElementById('restaurant-name');
    const address = document.getElementById('restaurant-address');
    const image = document.getElementById('restaurant-img');
    const cuisine = document.getElementById('restaurant-cuisine');
    const hours = document.getElementById('restaurant-hours');
    const container = document.getElementById('reviews-container');
    const list = document.getElementById('reviews-list');
    name.innerHTML = '';
    address.innerHTML = '';
    image.innerHTML = '';
    cuisine.innerHTML = '';
    hours.innerHTML = '';
    list.innerHTML = '';
}

/**
 * Create restaurant HTML and add it to the webpage
 */
fillRestaurantHTML = (restaurant = self.restaurant) => {
    clearRestaurantHTML();
    const name = document.getElementById('restaurant-name');
    name.innerHTML = restaurant.name;

    const favorite = document.getElementById('restaurant-favorite');
    let isFavorite = (restaurant.is_favorite == 'true' || restaurant.is_favorite == true) ? true : false;
    favorite.innerHTML = (isFavorite ? 'un' : '') + 'set favorite';
    favorite.setAttribute('aria-checked', isFavorite);
    favorite.onclick = () => {
        toggleFavorite(restaurant, favorite);
        DBHelper.updateObject(restaurant, 'restaurant', (error, response) => {
            if (error) {
                console.error("Could not update neither local nor network database: ", error);
                toggleFavorite(restaurant, favorite);
            }
        });
    };

    const address = document.getElementById('restaurant-address');
    address.innerHTML = restaurant.address;

    const image = document.getElementById('restaurant-img');
    image.className = 'restaurant-img';
    const imgUrlBase = DBHelper.imageUrlForRestaurant(restaurant);
    const imgParts = imgUrlBase.split('.');
    const imgUrl1x = imgParts[0] + '_1x.' + (imgParts[1] || 'jpg');
    const imgUrl2x = imgParts[0] + '_2x.' + (imgParts[1] || 'jpg');
    image.srcset = `${imgUrl1x} 400w, ${imgUrl2x} 800w`;
    image.sizes = `(max-width: 800px) 80vw, 800px`;
    image.src = imgUrl1x;
    image.alt = restaurant.name + ' restaurant picture';

    const cuisine = document.getElementById('restaurant-cuisine');
    cuisine.innerHTML = restaurant.cuisine_type;

    // fill operating hours
    if (restaurant.operating_hours) {
        fillRestaurantHoursHTML();
    }
    // fill reviews
    fillReviewsHTML();
}

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
    const hours = document.getElementById('restaurant-hours');
    for (let key in operatingHours) {
        const row = document.createElement('tr');

        const day = document.createElement('td');
        day.innerHTML = key;
        row.appendChild(day);

        const time = document.createElement('td');
        time.innerHTML = operatingHours[key];
        time.innerHTML = time.innerHTML.replace(', ', '<br/>');
        row.appendChild(time);

        hours.appendChild(row);
    }
}

/**
 * Create all reviews HTML and add them to the webpage.
 */
fillReviewsHTML = (reviews = self.restaurant.reviews) => {
    const container = document.getElementById('reviews-container');

    if (!reviews) {
        const noReviews = document.createElement('p');
        noReviews.innerHTML = 'No reviews yet!';
        noReviews.classList.add('no-reviews');
        container.appendChild(noReviews);
        return;
    }
    const ul = document.getElementById('reviews-list');
    ul.innerHTML = '';
    reviews.forEach(review => {
        ul.appendChild(createReviewHTML(review));
    });
}

/**
 * Create review HTML and add it to the webpage.
 */
createReviewHTML = (review) => {
    const li = document.createElement('li');
    const name = document.createElement('p');
    name.classList.add('review-name');
    name.innerHTML = review.name;
    li.appendChild(name);

    const date = document.createElement('p');
    date.classList.add('review-date');
    date.innerHTML = getFormattedDate(review.createdAt);
    li.appendChild(date);

    const rating = document.createElement('p');
    rating.classList.add('review-rating');
    rating.innerHTML = `Rating: ${review.rating}`;
    li.appendChild(rating);

    const comments = document.createElement('p');
    comments.innerHTML = review.comments;
    li.appendChild(comments);

    return li;
}

/**
 * Add restaurant name to the breadcrumb navigation menu
 */
fillBreadcrumb = (restaurant = self.restaurant) => {
    const breadcrumb = document.getElementById('breadcrumb');
    const li = document.createElement('li');
    li.innerHTML = restaurant.name;
    breadcrumb.appendChild(li);
}

/**
 * Get a parameter by name from page URL.
 */
getParameterByName = (name, url) => {
    if (!url)
        url = window.location.href;
    name = name.replace(/[\[\]]/g, '\\$&');
    const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
        results = regex.exec(url);
    if (!results)
        return null;
    if (!results[2])
        return '';
    return decodeURIComponent(results[2].replace(/\+/g, ' '));
}

/**
 * Parse Date string
 */
getFormattedDate = (date) => {
    return (new Date(date)).toLocaleDateString('en-US', {
        month: 'long', day: 'numeric', year: 'numeric'
    });
}

/**
 * Change favorite status of the restaurant
 */
toggleFavorite = (restaurant, button) => {
    restaurant.is_favorite = (restaurant.is_favorite == 'true' || restaurant.is_favorite == true) ? false : true;
    button.setAttribute('aria-checked', restaurant.is_favorite);
    button.innerHTML = (restaurant.is_favorite ? 'un' : '') + 'set favorite';
}

/**
 * Handle form submission
 */
submitData = () => {
    const restaurant_id = self.restaurant.id;
    const name = escapeHtml(document.getElementById('name').value);
    const rating = parseInt(escapeHtml(document.getElementById('rating').value));
    const comments = escapeHtml(document.getElementById('comments').value);
    const review = {
        restaurant_id,
        name,
        rating,
        comments
    }
    DBHelper.addObject(review, 'review', (error, response) => {
        if (error) {
            console.error(error);
        } else {
            document.getElementById('name').value = '';
            document.getElementById('rating').value = '';
            document.getElementById('comments').value = '';
            self.restaurant.reviews.push(review);
            fillReviewsHTML();
        }
    })
}

function escapeHtml(unsafe) {
    return unsafe
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
 }
