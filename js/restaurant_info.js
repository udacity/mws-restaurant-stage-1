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
  const pModal = document.createElement("p");
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

  const addReviewBtn = document.createElement("button");
  addReviewBtn.id = "add-review";
  addReviewBtn.innerHTML = "Add A Review";
  // container.appendChild(addReviewBtn);

  // When the user clicks on the button, open the modal 
  addReviewBtn.onclick = () => {
    reviewModalContainer.style.display = "block";
  }

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

// Reviews 
writeReviewForm = () => {
  // let reviewForm = "";
  // reviewForm += "<section id=\"review-form\">";
  // reviewForm += "            <div>";
  // reviewForm += "              <label>";
  // reviewForm += "                <span class=\"label-text\">Your Name<\/span>";
  // reviewForm += "                <input type=\"text\" id=\"review-name\">";
  // reviewForm += "              <\/label>";
  // reviewForm += "            <\/div>";
  // reviewForm += "    ";
  // reviewForm += "            <div>";
  // reviewForm += "              <label>";
  // reviewForm += "                <span class=\"label-text\">Rating<\/span>";
  // reviewForm += "                <select id=\"review-rating\">";
  // reviewForm += "                  <option value=\"1\">1<\/option>";
  // reviewForm += "                  <option value=\"2\">2<\/option>";
  // reviewForm += "                  <option value=\"3\">3<\/option>";
  // reviewForm += "                  <option value=\"4\">4<\/option>";
  // reviewForm += "                  <option value=\"5\">5<\/option>";
  // reviewForm += "                <\/select>";
  // reviewForm += "              <\/label>";
  // reviewForm += "            <\/div>";
  // reviewForm += "    ";
  // reviewForm += "            <div>";
  // reviewForm += "              <label>";
  // reviewForm += "                <span class=\"label-text\">Comments<\/span>";
  // reviewForm += "                <textarea id=\"review-comment\" rows=\"4\" cols=\"30\"><\/textarea>";
  // reviewForm += "              <\/label>";
  // reviewForm += "            <\/div>";
  // reviewForm += "    ";
  // reviewForm += "            <div><button id=\"btnSaveReview\" onclick=\"saveReview()\">Save Review<\/button></div>";
  // reviewForm += "          <\/section>";              
  let reviewForm = "";
  reviewForm += "<button type=\"button\" class=\"btn btn-primary\" data-toggle=\"modal\" data-target=\"#exampleModal\" data-whatever=\"@getbootstrap\">Add Review<\/button>";
  reviewForm += "";
  reviewForm += "<div class=\"modal fade\" id=\"exampleModal\" tabindex=\"-1\" role=\"dialog\" aria-labelledby=\"exampleModalLabel\" aria-hidden=\"true\">";
  reviewForm += "  <div class=\"modal-dialog\" role=\"document\">";
  reviewForm += "    <div class=\"modal-content\">";
  reviewForm += "      <div class=\"modal-header\">";
  reviewForm += "        <h5 class=\"modal-title\" id=\"exampleModalLabel\">New Review<\/h5>";
  reviewForm += "        <button type=\"button\" class=\"close\" data-dismiss=\"modal\" aria-label=\"Close\">";
  reviewForm += "          <span aria-hidden=\"true\">&times;<\/span>";
  reviewForm += "        <\/button>";
  reviewForm += "      <\/div>";
  reviewForm += "      <div class=\"modal-body\">";
  reviewForm += "        <form>";
  reviewForm += "          <div class=\"form-group\">";
  reviewForm += "            <label for=\"review-name\" class=\"col-form-label\">Name:<\/label>";
  reviewForm += "            <input type=\"text\" class=\"form-control\" id=\"review-name\">";
  reviewForm += "          <\/div>";
  reviewForm += "          <div class=\"form-group\">";
  reviewForm += "              <label for=\"customRange\">Rating (0 - 5)<\/label>";
  reviewForm += "<input type=\"range\" class=\"custom-range\" min=\"0\" max=\"5\" id=\"review-rating\">";
  reviewForm += "          <\/div>";
  reviewForm += "          <div class=\"form-group\">";
  reviewForm += "            <label for=\"review-comments\" class=\"col-form-label\">Comment:<\/label>";
  reviewForm += "            <textarea class=\"form-control\" id=\"review-comment\"><\/textarea>";
  reviewForm += "          <\/div>";
  reviewForm += "        <\/form>";
  reviewForm += "      <\/div>";
  reviewForm += "      <div class=\"modal-footer\">";
  reviewForm += "        <button type=\"button\" class=\"btn btn-secondary\" data-dismiss=\"modal\">Close<\/button>";
  reviewForm += "        <button type=\"button\" class=\"btn btn-primary\" onclick=\"saveReview()\">Save Review<\/button>";
  reviewForm += "      <\/div>";
  reviewForm += "    <\/div>";
  reviewForm += "  <\/div>";
  reviewForm += "<\/div>";

  return reviewForm;
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

      const form = document.getElementById("review-form");
      form.reset()

      const modal = document.getElementById("exampleModal");
      // modal.style.display = "none";
      modal.setAttribute('aria-hidden', true);
      $("#exampleModal").modal('hide');
      console.log('Redirecting after ', review);
      // window.location.href = `/restaurant.html?id=${restaurant_id}`;
      const ul = document.getElementById('reviews-list');
      ul.appendChild(createReviewHTML(review));
      // fillRestaurantHTML();
    })
    .catch(error => console.error(error))
};
