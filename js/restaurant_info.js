let restaurant;
var newMap;

/**
 * Initialize map as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {  
  // console.log('DOM loaded');
  DBHelper.sendWaitingReviews();
  DBHelper.sendWaitingFavorites();
  // console.log('calling initmap');
  initMap();

  // saveReviews().then(reviews => {
  //   console.log('calling initmap');
  //   initMap();
  // }).catch(error => {
  //   console.log('loaded error',error);
  // });
});

/*
  retrieve data from server then Save reviews to IDB
*/
saveReviews = () => {
  return DBHelper.SaveReviews();
}

/**
 * Initialize leaflet map
 */
initMap = () => {
  // console.log('in initmap');
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
        mapboxToken: 'pk.eyJ1IjoiYXRsYW50YWRhbmNlciIsImEiOiJjamp4Ymc4Y3AwOWg1M2tyd2w5aDZmeW44In0.q5P7OpWfkHQApPcTxv8ZcA',
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
    DBHelper.readRestaurauntsById(id, (error, restaurant) => {
      self.restaurant = restaurant;
      // console.log('return',restaurant);
      if (!restaurant) {
        // console.log('error',error);
        return;
      }
      // console.log('idb get',id);
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
  
  const favorite = document.getElementById('restaurant-favorite');
  favorite.checked = restaurant.is_favorite;

  const address = document.getElementById('restaurant-address');
  address.innerHTML = restaurant.address;

  const image = document.getElementById('restaurant-img');
  image.className = 'restaurant-img'
  image.src = DBHelper.imageUrlForRestaurant(restaurant);
  image.srcset=DBHelper.imageUrlForRestaurantSrcset(restaurant);
  // add accessibility alt text identify restaurant shown 
  image.alt = restaurant.name;
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
    row.appendChild(time);

    hours.appendChild(row);
  }
}

/**
 * Create all reviews HTML and add them to the webpage.
 */
fillReviewsHTML = () => {
  
  const container = document.getElementById('reviews-container');
  const title = document.createElement('h2');
  title.innerHTML = 'Reviews';
  container.appendChild(title);
  const action=document.createElement('a');
  action.href=`/review.html?restaurant_id=${self.restaurant.id}`;
  action.innerHTML="Add Review";
  container.appendChild(action);
  //now fetch reviews from server into indexedDB then retrieve from indexedDB
  DBHelper.SaveRestaurantReviews (self.restaurant.id).then(() =>{
    DBHelper.readReviewsForRestaurant(restaurant_id=self.restaurant.id).then(reviews => {
      // console.log('review html',reviews);
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
    })
  });
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
  // date.innerHTML = review.date;  
  date.innerHTML = new Date(review.createdAt).toDateString();
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
fillBreadcrumb = (restaurant=self.restaurant) => {
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
// built upon example from w3schools.com for checkbox code
updateFavorite=() => {
  const chkFavorite = document.getElementById('restaurant-favorite');
  DBHelper.updateFavoriteForRestaurant(self.restaurant, chkFavorite.checked);

}