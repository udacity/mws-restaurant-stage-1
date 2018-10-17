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
  // fillReviewsHTML();
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

  const addReviewBtn = document.createElement("button");
  // addReviewBtn.className = "favorite-Btn";
  addReviewBtn.innerHTML = "Click to Give a Review";
  flex.appendChild(addReviewBtn);

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
  const pModal = document.createElement("p");
  pModal.innerText = "Some text in the modal";
  const reviewModalfooter = document.createElement("div");
  reviewModalfooter.className = "modal-footer";
  const footerText = document.createElement("h3");
  footerText.innerHTML = "Footer Text";

  
  

  reviewModalHeader.appendChild(closeModal);
  reviewModalHeader.appendChild(heading);
  reviewModalBody.appendChild(pModal);
  reviewModalfooter.appendChild(footerText);
  reviewModalContent.appendChild(reviewModalHeader);
  reviewModalContent.appendChild(reviewModalBody);
  reviewModalContent.appendChild(reviewModalfooter);

  reviewModalContainer.appendChild(reviewModalContent);

//   <!-- Modal content -->
// <div class="modal-content">
//   <div class="modal-header">
//     <span class="close">&times;</span>
//     <h2>Modal Header</h2>
//   </div>
//   <div class="modal-body">
//     <p>Some text in the Modal Body</p>
//     <p>Some other text...</p>
//   </div>
//   <div class="modal-footer">
//     <h3>Modal Footer</h3>
//   </div>
// </div>

  flex.appendChild(reviewModalContainer);

  // When the user clicks on the button, open the modal 
  addReviewBtn.onclick = function () {
    reviewModalContainer.style.display = "block";
  }

  // When the user clicks on <span> (x), close the modal
  closeModal.onclick = function () {
    reviewModalContainer.style.display = "none";
  }

  // When the user clicks anywhere outside of the modal, close it
  window.onclick = function (event) {
    if (event.target == reviewModalContainer) {
      reviewModalContainer.style.display = "none";
    }
  }
  //   <div id="myModal" class="modal">

  //   <!-- Modal content -->
  //   <div class="modal-content">
  //     <span class="close">&times;</span>
  //     <p>Some text in the Modal..</p>
  //   </div>

  // </div>

  // const addReviewLink = document.createElement("a");
  // addReviewLink.href = `/review.html?id=${self.restaurant.id}`;
  // addReviewLink.innerHTML = "Add Review";
  // flex.appendChild(addReviewLink);

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
