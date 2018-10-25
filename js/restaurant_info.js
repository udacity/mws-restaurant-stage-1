let restaurant;
var newMap;

// Accessibility focusing
const skipToRestaurantLink = document.getElementById('accessibility-skip-link');
skipToRestaurantLink.addEventListener('click', (event) => {
  console.log('Accessibility link has been clicked');
  document.getElementById('restaurant-name').focus();
});

/**
 * Initialize map as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {
  initMap();
  console.log('Dom loaded');
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
        mapboxToken: 'pk.eyJ1IjoiYWNlb25ld29ybGQiLCJhIjoiY2pqM21idDVtMWZvZjNxbGY3YXpmZzd0biJ9.YiVmvPeX3OiJxe-zfipNdQ',
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
fetchRestaurantFromURL = (callback) => {
  if (self.restaurant) { // restaurant already fetched!
    callback(null, self.restaurant)
    return;
  }
  const id = getParameterByName('id');
  if (!id) { // no id found in URL
    error = 'No restaurant id in URL'
    callback(error, null);
  } else {
    DBHelper.fetchRestaurantById(id, (error, restaurant) => {
      self.restaurant = restaurant;
      if (!restaurant) {
        console.error(error);
        return;
      }
      fillRestaurantHTML();
      callback(null, restaurant)
    });
  }
}

/**
 * Create restaurant HTML and add it to the webpage
 */
fillRestaurantHTML = (restaurant = self.restaurant) => {
  const name = document.getElementById('restaurant-name');
  name.innerHTML = restaurant.name;

  const address = document.getElementById('restaurant-address');
  address.innerHTML = restaurant.address;

  const image = document.getElementById('restaurant-img');
  image.className = 'restaurant-img';
  image.setAttribute('alt', restaurant.altString);
  image.srcset = `/img/${restaurant.id}_400w.jpg 400w, /img/${restaurant.id}_800w.jpg 800w`;
  image.src = DBHelper.imageUrlForRestaurant(restaurant);

  const cuisine = document.getElementById('restaurant-cuisine');
  cuisine.innerHTML = restaurant.cuisine_type;

  // fill operating hours
  if (restaurant.operating_hours) {
    fillRestaurantHoursHTML();
  }
  // fill reviews
  console.log('About to call fetchRestaurantReviewsById');
  DBHelper.fetchRestaurantReviewsById(restaurant.id, fillReviewsHTML)
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
    row.appendChild(time);

    hours.appendChild(row);
  }
}

/**
 * Create all reviews HTML and add them to the webpage.
 */
fillReviewsHTML = (error, reviews) => {
  self.restaurant.reviews = reviews;
  if (error) {
    console.log("Error retrieving restaurant review: ", error);
  }

  const container = document.getElementById('reviews-container');
  const flex = document.createElement("div");
  flex.id = "reviews-heading";
  container.appendChild(flex);

  const title = document.createElement('h3');
  title.innerHTML = 'Reviews';
  container.appendChild(title);

  // Review Modal
  const reviewModalContainer = document.createElement("div");
  reviewModalContainer.id = "review-modal";
  reviewModalContainer.className = "modal";
  const reviewModalHeader = document.createElement("div");
  reviewModalHeader.className = "modal-header";
  const reviewModalContent = document.createElement("div");
  reviewModalContent.className = "modal-content";
  const closeModal = document.createElement("span");
  closeModal.className = "close";
  closeModal.innerHTML = "&times;";
  const heading = document.createElement("h2");
  heading.innerHTML = "Add Your Review Below";
  const reviewModalBody = document.createElement("div");
  reviewModalBody.className = "modal-body";
  const reviewModalfooter = document.createElement("div");
  reviewModalfooter.className = "modal-footer";
  const footerText = document.createElement("h3");
  footerText.innerHTML = "MWS";
  const reviewForm = document.createElement("div");

  reviewModalHeader.appendChild(closeModal);
  reviewModalHeader.appendChild(heading);
  reviewModalBody.appendChild(reviewForm);
  reviewModalContent.appendChild(reviewModalBody);
  reviewModalContainer.appendChild(reviewModalContent);
  flex.appendChild(reviewModalContainer);

  if (!reviews) {
    const noReviews = document.createElement('p');
    noReviews.innerHTML = 'No reviews yet!';
    container.appendChild(noReviews);
    return;
  }
  const ul = document.getElementById('reviews-list');
  reviews.forEach(review => {
    ul.appendChild(createReviewHTML(review));
  });
  container.appendChild(ul);

  // When the user clicks on <span> (x), close the modal
  closeModal.onclick = () => {
    reviewModalContainer.style.display = "none";
  }

  // When the user clicks anywhere outside of the modal, close it
  window.onclick = (event) => {
    if (event.target == reviewModalContainer) {
      reviewModalContainer.style.display = "none";
    }
  }
}

/**
 * Create review HTML and add it to the webpage.
 */
createReviewHTML = (review) => {
  const li = document.createElement('li');
  const name = document.createElement('p');
  name.innerHTML = review.name;
  li.appendChild(name);

  const date = document.createElement('p');
  const created = review.createdAt;
  date.innerHTML = new Date(created).toLocaleString();
  li.appendChild(date);

  const rating = document.createElement('p');
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
  li.setAttribute('aria-current', 'page');
  li.setAttribute('aria-label', `${restaurant.name}`);
  li.setAttribute('role', 'menuitem');
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

const saveReview = () => {
  // Collect form data from review form
  const name = document.getElementById("review-name").value;
  const rating = document.getElementById("review-rating").value - 0;
  const comments = document.getElementById("review-comment").value;
  const addReviewBtn = document.getElementById("add-review");
  const reviewModalBtn = document.getElementById("btnSaveReview");
  const restaurant_id = self.restaurant.id;
  const createdAt = new Date().getTime();
  const review = {
    restaurant_id,
    name,
    rating,
    comments,
    createdAt,
    updatedAt: createdAt,
  }
  console.log("review-name: ", JSON.stringify(review, null, 2));
  DBHelper.postReviewToServer(review)
    .then(data => {
      // Update the button onclick event
      reviewModalBtn.onclick = (event) => {
        return saveReview();
      };

      // reset form values
      const form = document.getElementById("review-form");
      form.reset()

      const modal = document.getElementById("exampleModal");
      modal.setAttribute('aria-hidden', true);
      $("#exampleModal").modal('hide');
      const ul = document.getElementById('reviews-list');
      ul.appendChild(createReviewHTML(review));
    })
    .catch(error => console.error(error))
};
