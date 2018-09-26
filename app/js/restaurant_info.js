let restaurant;
var newMap;

/**
 * Initialize map as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {  
  initMap();
});

/**
 * Initialize leaflet map
 */
const initMap = () => {
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
        mapboxToken: 'pk.eyJ1Ijoia2h1c2J1Y2hhbmRyYSIsImEiOiJjamozMm9oeGUwdGlkM3BwNjBwcndoY3NsIn0.nBnmq4CLCWPlszD2pl5Yvg',
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
    callback(null, self.restaurant)
    return;
  }
  const id = getParameterByName('id');
  let error;
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
 
  const div = document.getElementById("maincontent");

  const favoriteDiv = document.createElement("section");
  favoriteDiv.id = "favorite-section";
  const selectedFavouriteIcon = document.createElement("i");
  selectedFavouriteIcon.id = "favorite-selected-icon-" + restaurant.id;
  selectedFavouriteIcon.className ="fas fa-heart";
  selectedFavouriteIcon.style.display = restaurant["is_favorite"] ? "block" : "none";
  selectedFavouriteIcon.style.color = "red";
  selectedFavouriteIcon.setAttribute('aria-label', 'is favourite selected');
  const unselectedFavouriteIcon = document.createElement("i");
  unselectedFavouriteIcon.id = "favorite-unselected-icon-" + restaurant.id;
  unselectedFavouriteIcon.className ="far fa-heart";
  unselectedFavouriteIcon.style.display = restaurant["is_favorite"] ? "none" : "block";
  unselectedFavouriteIcon.setAttribute('aria-label', 'is favourite not selected');
  const favoriteBtn = document.createElement("button");
  favoriteBtn.className ="btn";
  favoriteBtn.id = "favorite-icon-" + restaurant.id;
  favoriteBtn.onclick = event => handleFavoriteSelection(restaurant.id, !restaurant["is_favorite"]);
  favoriteBtn.append(selectedFavouriteIcon);
  favoriteBtn.append(unselectedFavouriteIcon);
  favoriteDiv.append(favoriteBtn);
  div.append(favoriteDiv);

  const name = document.getElementById('restaurant-name');
  name.innerHTML = restaurant.name;

  const address = document.getElementById('restaurant-address');
  address.innerHTML = restaurant.address;

  const image = document.getElementById('restaurant-img');
  image.className = 'restaurant-img'
  image.src = DBHelper.imageUrlForRestaurant(restaurant);

  const cuisine = document.getElementById('restaurant-cuisine');
  cuisine.innerHTML = restaurant.cuisine_type;

  // fill operating hours
  if (restaurant.operating_hours) {
    fillRestaurantHoursHTML();
  }
  // fill reviews
  DBHelper.fetchReviewsById(restaurant.id, fillReviewsHTML)
}

const handleFavoriteSelection = (id, newState) => {
  const fav = document.getElementById("favorite-icon-" + id);
  fav.onclick = null;
   DBHelper.updateFavoriteSelection(id, newState, (error, response) => {
    if (error) {
      console.log("Error updating favorite");
      return;
    }
    // Update the button background for the specified favorite
    const favoriteSelected = document.getElementById("favorite-selected-icon-" + response.id);
    favoriteSelected.style.display = response.value ? "block" : "none";
	const favoriteUnSelected = document.getElementById("favorite-unselected-icon-" + response.id);
    favoriteUnSelected.style.display = response.value ? "none" : "block";
    // Update properties of the restaurant data object
    const restaurant = self.restaurant;
    restaurant["is_favorite"] = response.value;
    fav.onclick = event => handleFavoriteSelection(restaurant.id, !restaurant["is_favorite"]);
  });
}
/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
const fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
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
const fillReviewsHTML = (error,reviews) => {
  if (error) {
    console.log("Retrieval of restaurant review failed: ", error);
  }
  self.restaurant.reviews = reviews;
  const container = document.getElementById('reviews-container');
  const title = document.createElement('h2');
  title.innerHTML = 'Reviews';
  container.appendChild(title);

  const createNewReviewLink = document.createElement("a");
  createNewReviewLink.href = `/add_review.html?id=${self.restaurant.id}`;
  createNewReviewLink.innerHTML = "Add Review";
  createNewReviewLink.style.fontSize = "medium";
  container.appendChild(createNewReviewLink);

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
const createReviewHTML = (review) => {
  const li = document.createElement('li');
  const name = document.createElement('p');
  name.innerHTML = review.name;
  li.appendChild(name);

  const date = document.createElement('p'); 
  date.innerHTML = new Date(review.createdAt).toLocaleString();
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
const fillBreadcrumb = (restaurant=self.restaurant) => {
  const breadcrumb = document.getElementById('breadcrumb');
  const li = document.createElement('li');
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
