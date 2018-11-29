let restaurant;

document.addEventListener('DOMContentLoaded', (event) => {
  initPage();
});

const initPage = () => {
  fetchRestaurantFromURL((error, restaurant) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      fillBreadcrumb();
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
  const name = document.getElementById('restaurant-name');
  name.innerHTML = restaurant.name;
  name.tabIndex = '0';

  const image = document.getElementById('restaurant-img');
  image.className = 'restaurant-img'

  const imageURL = DBHelper.imageUrlForRestaurant(restaurant, 'banners');
  const imageSplit = imageURL.split('.');
  const image1x = imageSplit[0] + '-400_1x.' + imageSplit[1];
  const image2x = imageSplit[0] + '-800_2x.' + imageSplit[1];
  image.src = image1x;
  image.alt = `${restaurant.name} promo image`
  image.srcset = `${image1x} 400w, ${image2x} 800w`;


  const cuisine = document.getElementById('restaurant-cuisine');
  cuisine.innerHTML = restaurant.cuisine_type;
  cuisine.tabIndex = '0';
}

/**
 * Add restaurant name to the breadcrumb navigation menu
 */
const fillBreadcrumb = (restaurant = self.restaurant) => {
  const breadcrumb = document.getElementById('breadcrumb');
  const li = document.createElement('li');
  const link = document.createElement('a');
  link.href = '/restaurant.html?id=' + restaurant.id;
  link.innerHTML = restaurant.name;
  li.append(link);
  breadcrumb.appendChild(li);

  const liReview = document.createElement('li');
  liReview.innerHTML = 'Write Review';
  breadcrumb.appendChild(liReview);
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

const postReview = () => {
  const name = document.getElementById('your-review-name').value;
  const rating = document.getElementById('your-rating').value;
  const comments = document.getElementById('your-review-comments').value;

  DBHelper.handlePostReview(self.restaurant.id, name, rating, comments, (error, review) => {
    if(error) return;

    const reviewButton = document.getElementById('post-review');
    reviewButton.onclick = (e) => postReview();

    window.location.href = `/restaurant.html?id=${self.restaurant.id}`;
  });
}
