let restaurant;
var map;

/**
 * @description Initialize Google map, called from HTML.
 * Add some accessibility attributes to the div #map <div role='application' aria-label='Google Map' id='map'>
 */
window.initMap = () => {
  fetchRestaurantFromURL((error, restaurant) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      const googleMap = document.getElementById('map');
      googleMap.setAttribute("role", "application");
      googleMap.setAttribute("aria-label", "Google Map");
      self.map = new google.maps.Map(googleMap, {
        zoom: 16,
        center: restaurant.latlng,
        scrollwheel: false
      });
      fillBreadcrumb();
      DBHelper.mapMarkerForRestaurant(self.restaurant, self.map);
    }
  });
}

/**
 * @description Get current restaurant from page URL
 * @param {string} callback
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
 * @description Create restaurant HTML and add it to the webpage
 *@param {string} restaurant
 */
fillRestaurantHTML = (restaurant = self.restaurant) => {
	const restaurantContainer = document.getElementById("restaurant-container");
	const newHeading = document.createElement("h2");
	newHeading.innerHTML = restaurant.name;
	newHeading.setAttribute("id", "restaurant-name");
	const name = restaurantContainer.childNodes[1];
  restaurantContainer.replaceChild(newHeading, name);
  const address = document.getElementById('restaurant-address');
  address.innerHTML = restaurant.address;

  //set the responsive images  
  const figure = document.createElement('figure');
  const picture = document.createElement('picture');
  restaurantContainer.insertBefore(figure, restaurantContainer.childNodes[2]);
  const source = document.createElement('source');
  source.media = '(min-width: 551px)';
  source.srcset = DBHelper.imageUrlForRestaurant(restaurant);
  const image = document.getElementById('restaurant-img');
  image.className = 'restaurant-img';
  image.src = DBHelper.imageResponsiveForRestaurant(restaurant);
  image.alt = restaurant.name;

  const figCaption = document.createElement('figcaption');
  figCaption.textContent = restaurant.name;

  figure.prepend(figCaption);
  picture.prepend(image);
  picture.prepend(source);
  figure.prepend(picture);
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
 * @description Create restaurant operating hours HTML table and add it to the webpage.
 * Some accessibility attributes are added 
 *@param {string} operating hours of the restaurant
 */
fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
  const hours = document.getElementById('restaurant-hours');
  for (let key in operatingHours) {
    const row = document.createElement('tr');
    const day = document.createElement('td');
    day.innerHTML = key;
    row.appendChild(day);
    day.setAttribute("aria-label", "Open on " + key);
    const time = document.createElement('td');
    time.innerHTML = operatingHours[key];
    time.setAttribute("aria-label", "Opening hours from: " + operatingHours[key]);
    row.appendChild(time);
    hours.appendChild(row);
  }
}

 /**
 * @description Create all reviews HTML and add them to the webpage.
 * Some accessibility attributes are added 
 *@param {string} reviews of the restaurant
 */
fillReviewsHTML = (reviews = self.restaurant.reviews) => {
  const container = document.getElementById('reviews-container');
  const title = document.createElement('h2');
  title.innerHTML = 'Reviews';
  container.appendChild(title);
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
 * @description Create review HTML and add it to the webpage:
 * <li>
 <p>Name of the review</p>
 <p>Date of the review</p>
 <p>Rating of the review</p>
 <p>Comments of the review</p>
 </li>
 *@param {string} reviews of the restaurant
 */
createReviewHTML = (review) => {
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
}

/**
 * @description Add restaurant name to the breadcrumb navigation menu
 * <li id='breadcrumb' aria-label='Breadcrumb' aria-current='page'>Name of the restaurant</li>
 *@param {string} Name of the restaurant
 */
fillBreadcrumb = (restaurant=self.restaurant) => {
  const breadcrumb = document.getElementById('breadcrumb');
  breadcrumb.setAttribute('aria-label', 'Breadcrumb');

  const li = document.createElement('li');
  li.innerHTML = restaurant.name;
  li.setAttribute('aria-current', 'page');
  breadcrumb.appendChild(li);
}
 
 /**
 * @description Get a parameter by name from page URL.
 *@param {string} name - Name of the restaurant
 * @param {string} url - URL of the page
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
* @description Create a div and a button in the header of the page to show the map of the restaurant
* <div id='show-map' role='button' tabindex=0 aria-pressed='false'>Text content<button></div>
* If the map doesn't appear on the page,  the text content of the button will be Map view. 
* Otherwise there's no button. 
*/
const showMapButton = document.createElement('div');
showMapButton.setAttribute("id", "button");
const header = document.querySelector('header');
header.append(showMapButton);

showMapButton.setAttribute('id', 'show-map');
showMapButton.setAttribute('role', 'button');
showMapButton.setAttribute('tabindex','0');
showMapButton.setAttribute("aria-pressed", "false");

const mapToHide = document.getElementById("map-container");
mapToHide.style.display = "none";

if(mapToHide.style.display == "none") {
  showMapButton.textContent = 'Map view' || mapToHide.style.display == "flex";
}

showMapButton.setAttribute('aria-label', showMapButton.textContent);

showMeMap = () =>{
showMapButton.focus();
showMapButton.setAttribute("aria-pressed", "true");

  if(mapToHide.style.display == "none") {
  mapToHide.style.display = "flex";
  showMapButton.style.display = "none";
  }
  else {
    mapToHide.style.display = "none";
  }
};

/**
* @description Add event listeners to the various buttons
* @param keydown - Keydown event
* @param function
*/

// Define values for keycodes
  const VK_ENTER      = 13;
  const VK_SPACE      = 32;

showMapButton.addEventListener('keydown', function(event) {
  switch (event.keyCode) {
  case VK_SPACE:
  case VK_ENTER: {

  showMeMap();
  event.stopPropagation();
  event.preventDefault();
  break;
}
  }
});

showMapButton.addEventListener('click', showMeMap);

/**
* @description Create a div for skip to the main content :
* <div class='invisible' role='complementary'></div>
*/
const skipNav = document.createElement('div');
skipNav.setAttribute("role", "complementary");
skipNav.className = 'invisible';

const nav = document.querySelector('nav');
nav.prepend(skipNav);

const linkMain = document.createElement('a');
linkMain.href= '#restaurant-name';
linkMain.textContent = 'Skip to the main content';
linkMain.setAttribute('aria-label', linkMain.textContent);
linkMain.className = 'skip-main';

skipNav.prepend(linkMain);
