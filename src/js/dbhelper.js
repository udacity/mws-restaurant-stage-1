import { getItems, getItem } from "./utils";

const PORT = 1337;
const DATABASE_URL = `http://localhost:${PORT}/restaurants`;

/**
 * Fetch all restaurants.
 */
export function fetchRestaurants(callback) {
  let networkDataReceived = false;
  fetch(DATABASE_URL)
    .then(res => {
      if (res) {
        return res.json();
      }
    })
    .then(data => {
      if (data) {
        networkDataReceived = true;
        callback(null, data);
      }
    })
    .catch(err => {
      // Oops!. Got an error from server.
      const error = `Request failed. Returned status of ${err}`;
    });
  // Fetch from IndexedDB
  if ("indexedDB" in window) {
    getItems("restaurants").then(restaurants => {
      if (!networkDataReceived && restaurants) {
        callback(null, restaurants);
      }
    });
  }
}

/**
 * Fetch a restaurant by its ID.
 */
export function fetchRestaurantById(id, callback) {
  let networkDataReceived = false;
  fetch(`${DATABASE_URL}/${id}`)
    .then(res => {
      if (res) {
        return res.json();
      }
    })
    .then(data => {
      if (data) {
        networkDataReceived = true;
        callback(null, data);
      }
    })
    .catch(err => {
      // Oops!. Got an error from server.
      const error = `Request failed. Returned status of ${err}`;
    });
  // Fetch from IndexedDB
  if ("indexedDB" in window) {
    getItem("restaurants", id).then(restaurant => {
      if (!networkDataReceived && restaurant) {
        callback(null, restaurant);
      }
    });
  }
}
/**
 * Update a restaurant
 */
export function updateRestaurant(body, callback) {
  if (!body.id) {
    throw new Error("A valid ID must be present in the body");
  }

  fetch(`${DATABASE_URL}/${body.id}`, {
    method: "PUT",
    body
  })
    .then(res => {
      if (res) {
        return res.json();
      }
    })
    .then(data => {
      if (data) {
        callback(null, data);
      }
    })
    .catch(err => {
      // Oops!. Got an error from server.
      const error = `Request failed. Returned status of ${err}`;
    });
}

/**
 * Fetch restaurants by a cuisine type with proper error handling.
 */
export function fetchRestaurantByCuisine(cuisine, callback) {
  // Fetch all restaurants  with proper error handling
  fetchRestaurants((error, restaurants) => {
    if (error) {
      callback(error, null);
    } else {
      // Filter restaurants to have only given cuisine type
      const results = restaurants.filter(r => r.cuisine_type == cuisine);
      callback(null, results);
    }
  });
}

/**
 * Fetch restaurants by a neighborhood with proper error handling.
 */
export function fetchRestaurantByNeighborhood(neighborhood, callback) {
  // Fetch all restaurants
  fetchRestaurants((error, restaurants) => {
    if (error) {
      callback(error, null);
    } else {
      // Filter restaurants to have only given neighborhood
      const results = restaurants.filter(r => r.neighborhood == neighborhood);
      callback(null, results);
    }
  });
}

/**
 * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
 */
export function fetchRestaurantByCuisineAndNeighborhood(
  cuisine,
  neighborhood,
  callback
) {
  // Fetch all restaurants
  fetchRestaurants((error, restaurants) => {
    if (error) {
      callback(error, null);
    } else {
      let results = restaurants;
      if (cuisine != "all") {
        // filter by cuisine
        results = results.filter(r => r.cuisine_type == cuisine);
      }
      if (neighborhood != "all") {
        // filter by neighborhood
        results = results.filter(r => r.neighborhood == neighborhood);
      }
      callback(null, results);
    }
  });
}

/**
 * Fetch all neighborhoods with proper error handling.
 */
export function fetchNeighborhoods(callback) {
  // Fetch all restaurants
  fetchRestaurants((error, restaurants) => {
    if (error) {
      callback(error, null);
    } else {
      // Get all neighborhoods from all restaurants
      const neighborhoods = restaurants.map(
        (v, i) => restaurants[i].neighborhood
      );
      // Remove duplicates from neighborhoods
      const uniqueNeighborhoods = neighborhoods.filter(
        (v, i) => neighborhoods.indexOf(v) == i
      );
      callback(null, uniqueNeighborhoods);
    }
  });
}

/**
 * Fetch all cuisines with proper error handling.
 */
export function fetchCuisines(callback) {
  // Fetch all restaurants
  fetchRestaurants((error, restaurants) => {
    if (error) {
      callback(error, null);
    } else {
      // Get all cuisines from all restaurants
      const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type);
      // Remove duplicates from cuisines
      const uniqueCuisines = cuisines.filter(
        (v, i) => cuisines.indexOf(v) == i
      );
      callback(null, uniqueCuisines);
    }
  });
}

/**
 * Restaurant page URL.
 */
export function urlForRestaurant(restaurant) {
  return `./restaurant.html?id=${restaurant.id}`;
}

/**
 * Map marker for a restaurant.
 */
export function mapMarkerForRestaurant(restaurant, map) {
  const marker = new google.maps.Marker({
    position: restaurant.latlng,
    title: restaurant.name,
    url: urlForRestaurant(restaurant),
    map: map,
    animation: google.maps.Animation.DROP
  });
  return marker;
}
