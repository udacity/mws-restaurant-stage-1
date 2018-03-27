let restaurant;
let reviews;
var map;
var marker;
let review_form;

/**
 * Initialize Google map, called from HTML.
 */
window.initMap = () => {
 //when google maps api is loaded display the map container
 document.getElementById('map-container').style.display='block';

 //regexp taken from https://www.opentechguides.com/how-to/article/javascript/98/detect-mobile-device.html
 const mobExp = new RegExp('Android|webOS|iPhone|iPad|' +
 'BlackBerry|Windows Phone|'  +
 'Opera Mini|IEMobile|Mobile' ,
'i');

 if (!mobExp.test(navigator.userAgent)){
   //if not mobile start the map
   initiateMap();
   google.maps.event.addListenerOnce(self.map, 'tilesloaded', MapReady);
 }else{
   //if mobile the map will load on user request to maximize performance
   document.getElementById('startmap').addEventListener('click',initiateMap);
 }


}
function MapReady(){
  /*
  When map is loaded, focus on the restaurant name element for screen reader
  */
  document.getElementById('restaurant-name').focus();

}


initiateMap = (e) => {
  if(e){
    if(!navigator.onLine){
      alert('You are currently offline.');
      return;
    }
  }
  let mm=document.getElementById('map');
  mm.innerHTML='';
  document.getElementById('map-container').style.minHeight='250px';
  let loc = {
    lat: 40.722216,
    lng: -73.987501
  };
    self.map = new google.maps.Map(document.getElementById('map'), {
      zoom: 16,
      center: loc,
      scrollwheel: false
    });
    if(self.restaurant){
      self.map.setCenter(self.restaurant.latlng);
      if(!self.marker){
        self.marker=DBHelper.mapMarkerForRestaurant(self.restaurant, self.map);
      }
    }
}







/*
  Listeners for offline state
  */

window.addEventListener('offline', (e) => {
  toggleOffline(true);
});

window.addEventListener('online', (e) => {
  toggleOffline(false);
});

toggleOffline = (offline,checkSync=true) =>{
  if(offline){
    document.getElementById('offline').style.visibility='visible';
  }else{
    document.getElementById('offline').style.visibility='hidden';
    if(checkSync){
      DBHelper.syncOfflineData();//when back online send temp data to server and delete them locally
    }
  }
}



formSubmit = (e) =>{
  e.preventDefault();
  let formData = new FormData();
  for (let elem of self.review_form) {
    if(elem.type!='submit'){
      if(elem.name=='restaurant_id'){
       //force restaurant_id to be an integer (for indexedDB index to work as expected)
      formData.append(elem.name, parseInt(elem.value));
      }else{
      formData.append(elem.name, elem.value);
      }
    }
  }

  DBHelper.addReview(formData).then(resp => {
    if(resp){
      self.reviews=null;
      fetchRestaurantReviews((error, reviews) => {
        if (error) { // Got an error!
          console.error(error);
        } else {
          const ul = document.getElementById('reviews-list');
          ul.innerHTML = '';
          let aa=1;
          reviews.forEach(review => {
            ul.appendChild(createReviewHTML(review,aa));
            aa++;
          });
          document.getElementById('filtered-results').innerHTML=`<p>Review added</p>`;
          self.review_form.reset();
        }
      });
    }

  });


}


/**
 * if offline initMap does not get called
 */
document.addEventListener('DOMContentLoaded', (event) => {
  toggleOffline(!navigator.onLine,false);//check initial offline state
 /**
 * because the initMap is not called offline we load the restaurant info on dom loaded
 * and if the map is loaded we set the center and marker
 */


if(!navigator.onLine){
  //if offline don't check for pending sync
  fetchRestaurantFromURL((error, restaurant) => {
    if (error) { // Got an error!
      console.error(error);
    } else {

      fillBreadcrumb();
      if(self.map){
        self.map.setCenter(self.restaurant.latlng);
      self.marker=DBHelper.mapMarkerForRestaurant(self.restaurant, self.map);
      }
      //get reviews from new server
      fetchRestaurantReviews((error, reviews) => {
        if (error) { // Got an error!
          console.error(error);
        } else {
          fillReviewsHTML();
        }
      });

    }
  });
}else{
  //online first check if pending sync
  DBHelper.syncOfflineData().then(() =>{
    fetchRestaurantFromURL((error, restaurant) => {
      if (error) { // Got an error!
        console.error(error);
      } else {

        fillBreadcrumb();
        if(self.map){
          self.map.setCenter(self.restaurant.latlng);
        self.marker=DBHelper.mapMarkerForRestaurant(self.restaurant, self.map);
        }
        //get reviews from new server
        fetchRestaurantReviews((error, reviews) => {
          if (error) { // Got an error!
            console.error(error);
          } else {
            fillReviewsHTML();
          }
        });

      }
    });
  });
}
self.review_form=document.getElementById("review-form");

//add event listener for the form submit event
self.review_form.addEventListener('submit',formSubmit);




});

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
      callback(null, restaurant)
      fillRestaurantHTML();

    });
  }
}

/**
 * Get restaurant reviews.
 */
fetchRestaurantReviews = (callback) => {
  if (self.reviews) { // restaurant already fetched!
    callback(null, self.reviews)
    return;
  }
  if(!self.restaurant){
    console.error('Could not get reviews');
    return;
  }

    DBHelper.fetchReviewsByRestaurantId(self.restaurant.id, (error, reviews) => {
      self.reviews = reviews;
      if (!reviews) {
        console.error(error);
        return;
      }
      callback(null, reviews)

    });

}


/**
 * Create restaurant HTML and add it to the webpage
 */
fillRestaurantHTML = (restaurant = self.restaurant) => {
  const name = document.getElementById('restaurant-name');
  name.innerHTML = restaurant.name;
  name.setAttribute('aria-label',`${restaurant.name}, ${restaurant.cuisine_type} cuisine`)

  const image = document.getElementById('restaurant-img');
  image.className = 'restaurant-img'
  image.alt=`${restaurant.name} ${restaurant.cuisine_type} Cuisine`;
  image.src = DBHelper.imageUrlForRestaurant(restaurant);


  const address = document.getElementById('restaurant-address');
  address.innerHTML = restaurant.address;
  address.setAttribute('aria-label',`address ${restaurant.address}`);

  const cuisine = document.getElementById('restaurant-cuisine');
  cuisine.innerHTML = restaurant.cuisine_type;


  let fav=document.getElementById('fav');
  if(restaurant.is_favorite && DBHelper.parseBoolean(restaurant.is_favorite)){
    fav.src ='icons/favorite.png';
    fav.setAttribute('data-is-favorite',`true`);
    fav.setAttribute('title',`Click to mark as not favorite!`);
    fav.setAttribute('aria-label',`Press enter to mark as not favorite!`);
  }
  fav.addEventListener('click',(e) => {
    toggleFavorite(e.target);
  });
  //we add a keydown listener to toggle Favorite with keyboard enter (ARIA)
  fav.addEventListener('keydown',(e) => {
    if(e.keyCode==13){
    toggleFavorite(e.target);
    }
  });
  //set value for hidden input restaurant id (add a review)
  document.getElementById('form_restaurant_id').value = self.restaurant.id;
  // fill operating hours
  if (restaurant.operating_hours) {
     fillRestaurantHoursHTML();
  }

}



toggleFavorite = (elem) => {
  let restaurant_id=self.restaurant.id;
  let is_favorite=DBHelper.parseBoolean(elem.getAttribute('data-is-favorite'));
  DBHelper.toggleFavorite(restaurant_id,!is_favorite);
  //change image
  if(!is_favorite==true){
    elem.src='icons/favorite.png';
    elem.setAttribute('data-is-favorite',`true`);
    elem.setAttribute('title',`Click to mark as not favorite!`);
    elem.setAttribute('aria-label',`Press enter to mark as not favorite!`);
    //announce it to scren readers
    document.getElementById('filtered-results').innerHTML=`<p>Υου marked as favorite</p>`;
  }else{
    elem.src='icons/notfavorite.png';
    elem.setAttribute('data-is-favorite',`false`);
    elem.setAttribute('title',`Click to mark as favorite!`);
    elem.setAttribute('aria-label',`Press enter to mark as favorite!`);
    //announce it to scren readers
    document.getElementById('filtered-results').innerHTML=`<p>Υου marked as not favorite</p>`;
  }




}




/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
  const hours = document.getElementById('restaurant-hours');
  let aa=1;
  for (let key in operatingHours) {
    const row = document.createElement('tr');

    const day = document.createElement('td');
    day.innerHTML = key;
    day.setAttribute('tabindex',0);
    day.setAttribute('aria-label',`${key} : ${operatingHours[key]}`);
    aa++;
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
fillReviewsHTML = (reviews = self.reviews) => {
  const container = document.getElementById('reviews-container');
  const title = document.createElement('h3');
  title.innerHTML = 'Reviews';
  title.setAttribute('aria-label',`${reviews.length} reviews`);
  title.setAttribute('tabindex',0);
  container.appendChild(title);

  if (!reviews) {
    const noReviews = document.createElement('p');
    noReviews.innerHTML = 'No reviews yet!';
    container.appendChild(noReviews);
    return;
  }
  const ul = document.createElement('ul');
  ul.setAttribute('id','reviews-list');
  let aa=1;
  reviews.forEach(review => {
    ul.appendChild(createReviewHTML(review,aa));
    aa++;
  });

  container.appendChild(ul);
}

/**
 * Create review HTML and add it to the webpage.
 */
createReviewHTML = (review,aa) => {
  const li = document.createElement('li');
  li.setAttribute('tabindex',0);
  li.setAttribute('aria-label', `Review ${aa}`);
  const div = document.createElement('div');
  div.className='review-inner';

  const name = document.createElement('h4');
  name.className='review-reviewer';
  name.setAttribute('tabindex',0);
  name.setAttribute('aria-label',`reviewer name ${review.name} date ${review.date}`);
  name.innerHTML = review.name;


  const date = document.createElement('p');
  date.className='review-date';
  //get Date from timestamp (new server returns timestamp)
  date.innerHTML = DBHelper.toDate(review.updatedAt);

  const tbl = document.createElement("table");
  tbl.setAttribute('width','100%');
  const tblBody = document.createElement("tbody");
  const row = document.createElement("tr");
  const cell1 = document.createElement("td");
  const cell2 = document.createElement("td");
  cell1.setAttribute('align','left');
  cell1.appendChild(name);
  cell2.setAttribute('align','right');
  cell2.appendChild(date);
  row.appendChild(cell1);
  row.appendChild(cell2);

  tblBody.appendChild(row);
  tbl.appendChild(tblBody);
  li.appendChild(tbl);


  const rating = document.createElement('p');
  rating.className='review-rating';
  rating.setAttribute('aria-label',`review rating ${review.rating}`);
  rating.innerHTML = `Rating: ${review.rating}`;
  rating.setAttribute('tabindex',0);
  div.appendChild(rating);

  const comments = document.createElement('p');
  comments.setAttribute('aria-label',`review, ${review.comments}`);
  comments.innerHTML = review.comments;
  comments.setAttribute('tabindex',0);
  div.appendChild(comments);
li.appendChild(div);
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
