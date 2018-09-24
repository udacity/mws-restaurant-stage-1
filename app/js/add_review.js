let restaurant;

const documentReady = () => {
  fetchRestaurantFromURL((error, restaurant) => {
    if (error) {
      // Got an error!
      console.error(error);
    } else {
      fillBreadcrumb();
    }
  });
  DBHelper.pendingQueuedData();
};

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

    const image = document.getElementById('restaurant-img');
    image.className = 'restaurant-img'
    image.src = DBHelper.imageUrlForRestaurant(restaurant);
    
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
      fav.onclick = handleFavoriteSelection(restaurant.id, !restaurant["is_favorite"]);
    });
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

  const addReview = () => {
    // Get the data points for the review
    
    const name = document.getElementById("reviewer").value;
    const rating = document.getElementById("rating").value - 0;
    const comment = document.getElementById("comments").value;
    // const btn = document.getElementById("review-submit");
    //  btn.onclick = null;

    console.log(`Restaurant Id: ${self.restaurant.id} Reviewer: ${name} Rating : ${rating} Comments: ${comment} `)
    console.log('Called Save click')
    DBHelper.saveReview(self.restaurant.id, name, rating, comment, (error, review) => {
      
      if (error) {
        console.log("Error while adding review")
      }
    //   btn.onclick = addReview;
      // Update the button onclick event
      window.location.href = window.location.origin + "/restaurant.html?id=" + self.restaurant.id;
     return false;
      
    });
  }