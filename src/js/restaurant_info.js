//<<-!->>import DBHelper from './dbhelper.mjs';

class RestaurantInfo {

  /**
   * Initialize leaflet map
   * @param {string} mapboxToken - mapbox API Token
   */
  initMap(mapboxToken) {
    this.fetchRestaurantFromURL((error, restaurant) => {
      if (error) { // Got an error!
        console.error(error);
      } else {
        this.newMap = L.map('map', {
          center: [restaurant.latlng.lat, restaurant.latlng.lng],
          zoom: 16,
          scrollWheelZoom: false
        });
        L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.jpg70?access_token={mapboxToken}', {
          mapboxToken,
          maxZoom: 18,
          attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
            '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
            'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
          id: 'mapbox.streets'
        }).addTo(this.newMap);

        this.fillBreadcrumb();
        DBHelper.mapMarkerForRestaurant(this.restaurant, this.newMap);
      }
    });
  }


  /**
   * Get current restaurant from page URL.
   */
  fetchRestaurantFromURL(callback) {
    if (this.restaurant) { // restaurant already fetched!
      callback(null, this.restaurant);
      return;
    }
    const id = this.getParameterByName('id');
    if (!id) { // no id found in URL
      const error = 'No restaurant id in URL';
      callback(error, null);
    } else {
      DBHelper.fetchRestaurantById(id, (error, restaurant) => {
        this.restaurant = restaurant;
        if (!restaurant) {
          console.error(error);
          this.handleRestaurantNotFound();
          return;
        }
        this.fillRestaurantHTML();
        callback(null, restaurant);
      });
    }
  }


  /**
   * Shows a message when request restaurant 'id' is not found
   */
  handleRestaurantNotFound() {
    /* selecting all the elements that are not needed anymore */
    const $uselessElems = document.querySelectorAll(
      '.breadcrumb-wrapper, .restaurant-container, .map-container, .reviews-container'
    );
    /* removing all "useless" elements */
    $uselessElems.forEach(elem => {
      elem.remove();
    });

    const $main = document.querySelector('.maincontent');

    const $container = document.createElement('div');
    $container.className = 'rst-not-found';
    $container.innerHTML = `<h2>Restaurant Not found</h2>
    <p>This is not the restaurant you are looking for!</p>`;

    $main.prepend($container);
  }

  /**
   * Create restaurant HTML and add it to the webpage
   */
  fillRestaurantHTML() {
    const name = document.querySelector('.restaurant-name');
    name.innerHTML = this.restaurant.name;

    const address = document.querySelector('.restaurant-address');
    address.innerHTML = this.restaurant.address;

    /* image sizes to use in srcset */
    const imgSizes = ['300', '400', '500', '600', '800', '1000', '1200'];
    /* image size to use as fallback in src */
    const defaultSize = '600';

    const image = document.querySelector('.restaurant-img');
    image.className = 'restaurant-img';
    image.src = DBHelper.imageUrlForRestaurant(
      this.restaurant.photograph,
      defaultSize
    );
    image.srcset = DBHelper.imageSrcsetForRestaurant(
      this.restaurant.photograph,
      imgSizes
    );
    image.sizes = '(min-width: 632px) 600px, 100vw';
    image.alt = `This is an image of the ${this.restaurant.name} restaurant`;

    const cuisine = document.querySelector('.restaurant-cuisine');
    cuisine.innerHTML = this.restaurant.cuisine_type;

    // fill operating hours
    if (this.restaurant.operating_hours) {
      this.fillRestaurantHoursHTML();
    }
    // fill reviews
    this.fillReviewsHTML();
  }



  /**
   * Create restaurant operating hours HTML table and add it to the webpage.
   */
  fillRestaurantHoursHTML() {
    const operatingHours = this.restaurant.operating_hours;
    const hours = document.querySelector('.restaurant-hours');

    for (let key in operatingHours) {
      /*
        wrapping the content of the for-in loop
        in a conditional statement to prevent
        it from from iterating over the prototype chain
      */
      if (operatingHours.hasOwnProperty(key)) {

        const row = document.createElement('tr');
        row.setAttribute('tabindex', '0');

        const day = document.createElement('td');
        day.innerHTML = key;
        row.appendChild(day);

        const time = document.createElement('td');
        time.innerHTML = operatingHours[key];
        row.appendChild(time);

        hours.appendChild(row);
      }
    }
  }

  /**
   * Create all reviews HTML and add them to the webpage.
   */
  fillReviewsHTML() {
    const container = document.querySelector('.reviews-container');

    const title = document.createElement('h2');
    title.innerHTML = 'Reviews';
    container.appendChild(title);

    if (!this.restaurant.reviews) {
      const noReviews = document.createElement('p');
      noReviews.innerHTML = 'No reviews yet!';
      container.appendChild(noReviews);
      return;
    }
    const ul = document.querySelector('.reviews-list');
    this.restaurant.reviews.forEach(review => {
      ul.appendChild(this.createReviewHTML(review));
    });
    container.appendChild(ul);
  }

  /**
   * Create review HTML and add it to the webpage.
   */
  createReviewHTML(review) {
    const li = document.createElement('li');

    const name = document.createElement('p');
    name.setAttribute('tabindex', '0');
    name.className = 'review-name';
    name.innerHTML = review.name;
    li.appendChild(name);

    const date = document.createElement('p');
    date.innerHTML = review.date;
    date.className = 'review-date';
    li.appendChild(date);

    const rating = this.createRatingElement(review.rating);
    li.appendChild(rating);

    const comments = document.createElement('p');
    comments.innerHTML = review.comments;
    li.appendChild(comments);

    return li;
  }



  /**
   * Create rating element as stars
   */
  createRatingElement(reviewRating) {
    const $rating = document.createElement('p');
    $rating.className = 'review-rating';

    const hollowStars = 5 - reviewRating;

    for(let i=0; i<reviewRating; i++){
      const $star = document.createElement('span');
      $star.innerHTML = '★';
      $rating.appendChild($star);
    }

    for(let i=0; i<hollowStars; i++){
      const $star = document.createElement('span');
      $star.innerHTML = '☆';
      $rating.appendChild($star);
    }

    return $rating;
  }

  /**
   * Add restaurant name to the breadcrumb navigation menu
   */
  fillBreadcrumb() {
    const breadcrumb = document.querySelector('.breadcrumb');
    const li = document.createElement('li');
    li.innerHTML = this.restaurant.name;
    breadcrumb.appendChild(li);
  }

  /**
   * Get a parameter by name from page URL.
   */
  getParameterByName(name, url) {
    if (!url){
      url = window.location.href;
    }
    const sanitizePattern = new RegExp('[\\[\\]]', 'g');
    // name = name.replace(/[\[\]]/g, '\\$&');
    name = name.replace(sanitizePattern, '\\$&');
    const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`);
    const results = regex.exec(url);
    if (!results)
      return null;
    if (!results[2])
      return '';
    return decodeURIComponent(results[2].replace(/\+/g, ' '));
  }

  init() {
    /**
     * Initialize map as soon as the page is loaded.
     */
    document.addEventListener('DOMContentLoaded', () => {
      DBHelper.fetchMAPBOXToken().then( mapboxToken => {
        this.initMap(mapboxToken); // added
      });
    });
  }
}

(() => {
  const inside = new RestaurantInfo();
  inside.init();
})();