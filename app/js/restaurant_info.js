let restaurant;
//let reviews;
var newMap;
let focusedElementBeforeModal;
const modal = document.getElementById('modal');
const modalOverlay = document.getElementById('modal-overlay');

/**
 * Initialize map as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {  
  //registerServiceWorker();
  initMap();
  DBHelper.postOfflineData();
});

/*
window.addEventListener('offline', (e) => { 
  console.log('offline');
  postMessage('offline');
});
*/

/** Resend offline posts when connection is established **/
window.addEventListener('online', (e) => { 
  console.log('online');
  //postMessage('online');
  DBHelper.postOfflineData();
});

/*window.addEventListener('load', () => {
  initMap();
  //addMarkersToMap();
});*/

/**  TODO : Register service worker  **/
/*registerServiceWorker = () => {
  if (navigator.serviceWorker) {
    navigator.serviceWorker.register('./sw.js')
    .then(() => {
        console.log('Service Worker registered')
    })
    .catch((error) => {
        console.log('Registration Failed', error);
    });
  }    
}*/

/**
 * Initialize leaflet map
 */
const initMap = () => {
  fetchRestaurantFromURL((error, restaurant) => {
    // console.log(restaurant);
    if (error) { // Got an error!
      console.error(error);
    } else {      
      self.newMap = L.map('map', {
        center: [restaurant.latlng.lat, restaurant.latlng.lng],
        zoom: 16,
        scrollWheelZoom: false
      });
      L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.jpg70?access_token={mapboxToken}', {
        mapboxToken: 'pk.eyJ1Ijoib3dsa2luZyIsImEiOiJjamttbTBhcGMwYzF3M290ZGhyc2F4ZW1lIn0.Aasfyld5HSVNGPS-8QaDmg',
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
const fetchRestaurantFromURL = (callback) => {
  if (self.restaurant) { // restaurant already fetched!
    console.log('restaurant already fetched!');
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
const fillRestaurantHTML = (restaurant = self.restaurant) => {
  // console.log(restaurant);
  const name = document.getElementById('restaurant-name');
  name.setAttribute('aria-label', 'Restaurant name: ' + restaurant.name);
  name.innerHTML = restaurant.name;

  const address = document.getElementById('restaurant-address');
  address.setAttribute('aria-label', 'Address: ' + restaurant.address);
  address.innerHTML = `<strong>${restaurant.address}</strong>`;

  /** TODO: Add favorite toggle  **/
  const fav1 = document.getElementById('fav-button');
  // if ((/true/i).test(restaurant.is_favorite)) {
  if (restaurant.is_favorite === true) {
    fav1.classList.add('active');
    fav1.setAttribute('aria-pressed', 'true');
    fav1.setAttribute('aria-label', `Unmark ${restaurant.name} as favorite`);
    fav1.title = `Unmark as favorite`;
  } else {
    fav1.setAttribute('aria-pressed', 'false');
    fav1.setAttribute('aria-label', `Mark ${restaurant.name} as favorite`);
    fav1.title = `Mark as favorite`;
  }
  fav1.addEventListener('click', (event) => {
    event.preventDefault();
    if (fav1.classList.contains('active')) {
      fav1.setAttribute('aria-pressed', 'false');
      fav1.setAttribute('aria-label', `Mark ${restaurant.name} as favorite`);
      fav1.title = `Mark as favorite`;
      DBHelper.setFavorite(restaurant, false);
      //postMessage(`${restaurant.name} is not a favorite`);
    } else {
      fav1.setAttribute('aria-pressed', 'true');
      fav1.setAttribute('aria-label', `Unmark ${restaurant.name} as favorite`);
      fav1.title = `Unmark ${restaurant.name} as favorite`;
      DBHelper.setFavorite(restaurant, true);
      //postMessage(`${restaurant.name} is a favorite`);
    }
    fav1.classList.toggle('active');
  });

  const myImage = DBHelper.imageUrlForRestaurant(restaurant);
  const source = document.getElementById('source');
  source.media = '(min-width: 367px)';
  source.srcset = myImage.normal + ' 1x,' + myImage.large + '2x';

  const image = document.getElementById('restaurant-img');
  image.className = 'restaurant-img';
  image.src = myImage.small;
  const altText = 'An image of ' + restaurant.name + ' Restaurant';
  image.alt = altText;

  const cuisine = document.getElementById('restaurant-cuisine');
  cuisine.setAttribute('aria-label', 'Cuisine: ' + restaurant.cuisine_type);
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
const fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
  const hours = document.getElementById('restaurant-hours');

  for (let key in operatingHours) {
    const row = document.createElement('tr');
    row.setAttribute('tabindex', '0');        // Make table's rows tabbable 
    const day = document.createElement('td');
    //day.setAttribute('tabindex', '0');
    day.innerHTML = `<strong>${key}</strong>`;
    row.appendChild(day);

    const time = document.createElement('td');
    //time.setAttribute('tabindex', '0');
    time.innerHTML = operatingHours[key];
    row.appendChild(time);

    hours.appendChild(row);
  }
}

/**
 * Create all reviews HTML and add them to the webpage.
 */
const fillReviewsHTML = (reviews = self.restaurant.reviews) => {  
  
  const container = document.getElementById('reviews-container');
  //const rev = document.createElement('div');
  const rev = document.getElementById('reviews-header');
  rev.innerHTML = '';
  
  const title = document.createElement('h2');
  title.innerHTML = 'Reviews';
  rev.appendChild(title);

  const writeReview = document.createElement('button');
  writeReview.classList.add('rev-button');
  writeReview.setAttribute('aria-label', 'write a review');
  writeReview.title = 'Write a Review'
  writeReview.innerHTML = '+';
  //writeReview.innerHTML = '&#43;';
  writeReview.addEventListener('click', openModal);
  rev.appendChild(writeReview);
  container.appendChild(rev);

  //DBHelper.getReviewsById(self.restaurant.id, (error, reviews) => {
  //DBHelper.fetchReviews(self.restaurant.id, (error, reviews) => {
  DBHelper.fetchReviews((error, reviews) => {
    if (!reviews) {
    const noReviews = document.createElement('p');
    noReviews.innerHTML = 'No reviews yet!';
    container.appendChild(noReviews);
    return;
    }
    const ul = document.getElementById('reviews-list');
    ul.innerHTML = '';
    reviews.forEach(review => {
      // if (review.restaurant_id === self.restaurant._id) {
      if (review._parent_id === self.restaurant._id) {
        ul.appendChild(createReviewHTML(review));
      }
    });
    container.appendChild(ul);
  });
}

/**
 * Create review HTML and add it to the webpage.
 */
const createReviewHTML = (review) => {
  const li = document.createElement('li');
  li.setAttribute('tabindex', '0');
  //li.setAttribute('aria-label', 'Review by: ' + review.name);

  const div1 = document.createElement('div');
  div1.className = "reviews-head";

  const name = document.createElement('h3');
  name.classList.add('author');
  name.setAttribute('aria-label', 'Author: ' + review.name + ".");
  name.innerHTML = review.name;
  div1.appendChild(name);
  //li.appendChild(div1);

  const date = document.createElement('div');
  date.className = "date";

  // Return "Waiting..." if date created is not valid
  const created = document.createElement('span');
  // const cDate = review.createdAt ? new Date(review.createdAt).toLocaleDateString() : 'Waiting...';
  const cDate = review._created ? new Date(review._created).toLocaleDateString() : 'Waiting...';
  created.classList.add('date-created');
  //date.setAttribute('aria-label', 'Date reviewed: ' + review.date + ".");
  created.innerHTML = `Created: <strong>${cDate}</strong>`;
  date.appendChild(created);

  if (review._changed !== review._created) {
    /* Return "Waiting..." if date updated is not valid */

    const updated = document.createElement('span');
    // const uDate = review.updatedAt ? new Date(review.updatedAt).toLocaleDateString() : 'Waiting...';
    const uDate = review._changed ? new Date(review._changed).toLocaleDateString() : 'Waiting...';
    updated.classList.add('date-updated');
    //date.setAttribute('aria-label', 'Updated on: ' + review.date + ".");
    updated.innerHTML = `Updated: <strong>${uDate}</strong>`;
    date.appendChild(updated);
  }
  
  div1.appendChild(date);
  li.appendChild(div1);

  const rating = document.createElement('div');
  rating.classList.add('rating');
  //rating.setAttribute('aria-label', 'Rating: ' + review.rating + ".");
  rating.innerHTML = `Rating: ${review.rating}`;
  li.appendChild(rating);

  const comments = document.createElement('div');
  comments.classList.add('comment');
  comments.innerHTML = review.comments;
  li.appendChild(comments);

  return li;
}

/**
 * Add restaurant name to the breadcrumb navigation menu
 */
const fillBreadcrumb = (restaurant=self.restaurant) => {
  const breadcrumb = document.getElementById('breadcrumb');
  const li = document.createElement('li');
  li.setAttribute('aria-current', 'page');
  li.innerHTML = restaurant.name;
  breadcrumb.appendChild(li);
}

/**
 * Get a parameter by name from page URL.
 */
const getParameterByName = (name, url) => {
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

//  Note: The following code is an adaptation of UD891; Udacity's course on Modals and Keyboard Traps

/** TODO: Determine what happens when modal is opened or closed **/
const openModal = () => {
  // Save current focus
  focusedElementBeforeModal = document.activeElement;

  // Find all focusable children and Convert NodeList to an Array
  let focusableElementsString = 'a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), iframe, object, embed, [tabindex="0"], [contenteditable]';
  let focusableElements = modal.querySelectorAll(focusableElementsString);
  focusableElements = Array.prototype.slice.call(focusableElements);

  let firstTabStop = focusableElements[0];
  let lastTabStop = focusableElements[focusableElements.length - 1];
  
  let submitBtn = modal.querySelector('#submit-button');
  submitBtn.addEventListener('click', submitRev);

  // Listen for and trap the keyboard
  modal.addEventListener('keydown', trapTabKey);

  // Close the modal if overlay is clicked
  modalOverlay.addEventListener('click', closeModal);

  // Show the modal and overlay
  modal.style.display = "flex";
  modalOverlay.style.display = "block";

  // Focus first child
  firstTabStop.focus();

  function trapTabKey(e) {
    // Check for TAB key press
    if (e.keyCode === 9) {

      // SHIFT + TAB
      if (e.shiftKey) {
        if (document.activeElement === firstTabStop) {
          e.preventDefault();
          lastTabStop.focus();
        }

      // TAB
      } else {
        if (document.activeElement === lastTabStop) {
          e.preventDefault();
          firstTabStop.focus();
        }
      }
    }

    // ESCAPE
    if (e.keyCode === 27) {
      closeModal();
    }
  }
}

const closeModal = () => {
  
  //  Reset the form then Hide the modal and overlay
  const form = document.getElementById('rev-form');
  form.reset();
  //modal.classList.remove('show');
  //modalOverlay.classList.remove('show');
  modal.style.display = "none";
  modalOverlay.style.display = "none";

  // Set focus back to element that had it before the modal was opened
  focusedElementBeforeModal.focus();
}

const submitRev = (event) => {
  event.preventDefault();

  //let url, myReview, textR, textF, textS;
	const ul = document.getElementById('reviews-list');
  // const id = self.restaurant.id;
  const id = self.restaurant._id;
  const name = document.getElementById('review-author').value;
  const rating = document.getElementById('review-rating').value;
  const comments = document.getElementById('review-comments').value;

  //const textR = 'Fields marked * are required!';
  //const textS = 'Your review was saved. Thanks for the review';
  //const textF = 'Offline: Your review will be sent when you are online';
	const url = `${DBHelper.DATABASE_URL}/reviews`;
  const myReview = {
    // 'restaurant_id': id,
    '_parent_id': id,
    'name': name,
    'rating': rating,
    'comments': comments
  };
  const body = JSON.stringify(myReview);
  const method = 'POST';
  const headers = DBHelper.DATABASE_HEADERS;

  //  Check input validity
  //  if ((name === "") || (comments === "")) {
	if ((name === "") || isNaN(rating) || (comments === "")) {
    // console.log(body);
		postMessage('Fields marked * are required!');
		return;
	} else {
  		fetch(url, {
    		method: method,
    		headers: headers,
    		body: body
  		})
  		.then(response => response.json())
  		.then(review => {
        // console.log(review);
        // postSuccess(review);
        DBHelper.updateReviewsOnline(review).then(() => {
          fillReviewsHTML();
        });
        postMessage('Your review was saved. Thanks for the review');
        closeModal();
			}).catch(err => {
        // console.log(err);
        //  postFailure(myReview);
        DBHelper.updateReviewsOffline(myReview).then(id => {
          console.log('this is ur offline review key', id)
          DBHelper.saveOfflinePost(url, headers, method, myReview, id);
          fillReviewsHTML();
        });
        postMessage('Offline: Your review will be sent when you are online');
        closeModal();
			});
		}
}

/** Handle successful review posts  **/
const postSuccess = (review) => {
  //ul.appendChild(createReviewHTML(review));
  DBHelper.updateReviewsOnline(review).then(() => {
    fillReviewsHTML();
  });
  postMessage('Your review was saved. Thanks for the review');
  closeModal();
}

/** Handle failed review posts  **/
const postFailure = (myReview) => {
  //ul.appendChild(createReviewHTML(myReview));
  DBHelper.updateReviewsOffline(myReview).then(id => {
    console.log('this is ur offline review key', id)
    DBHelper.saveOfflinePost(url, headers, method, myReview, id);
    fillReviewsHTML();
  });
  postMessage('Offline: Your review will be sent when you are online');
  closeModal();
}

/** Method for showing notification onscreen **/
const postMessage = (text) => {
  const messageBox = document.getElementById('message-box'); 
  messageBox.innerHTML = `<p>${text}<p>`;
	messageBox.style.display = 'block';

  setTimeout(() => {
		messageBox.style.display = "none";
		messageBox.innerHTML = "";
  }, 3000);
}

/** Register Service Worker **/
if (navigator.serviceWorker) {
  navigator.serviceWorker.register('./sw.js')
  .then(() => {
      console.log('Service Worker registered')
  })
  .catch((error) => {
      console.log('Registration Failed', error);
  });
}