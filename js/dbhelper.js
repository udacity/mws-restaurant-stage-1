/**
 * Common database helper functions.
 */
class DBHelper {
  /**
   * Server URL.
   * Change this to read the estaurants information from external server.
   */
  static get SERVER_URL() {
    const port = 1337 // Change this to your server port
    return `http://localhost:${port}/restaurants`;
  }

  static get SERVER_REVIEWS_URL() {
    const port = 1337; // Change this to your server port
    return `http://localhost:${port}/reviews`;
  }

  /**
   * Open or Create a Database
   * Chrome complaining about using the idb promise library
   * resulting back to idbRequest
   */
  static openOrCreateDB() {
    return new Promise((resolve) => {
      let idbOpenRequest = indexedDB.open('restaurants-db', 2);
      idbOpenRequest.onerror = (event) => console.log('Open IDB error');
      idbOpenRequest.onsuccess = (event) => {
        console.log('Resolving to ', idbOpenRequest.result);
        resolve(idbOpenRequest.result);
      };
      idbOpenRequest.onupgradeneeded = (event) => {
        let db = event.target.result;
        db.onerror = () => console.log('Error opening DB');
        db.createObjectStore('restaurants', { keyPath: 'id' });
        db.createObjectStore('reviews', { keyPath: 'id', autoIncrement: true });
        db.createObjectStore('pending-reviews', { keyPath: 'updateTime', autoIncrement: true });
      };
    });
  }

  /**
   * Fetch all restaurants.
   */
  static fetchRestaurants(callback) {
    this.openOrCreateDB()
      .then(data => {
        // If restaurant data exists return that 
        if (data.length > 0) {
          return callback(null, data);
        }
        // Fetch from network
        return fetch(`${this.SERVER_URL}`)
          .then(res => {
            if (res.ok) {
              return res.json()
            }
            throw new Error('[RESTAURANT FETCH ACTION] - Network error');
          })
          .then(restaurants => {
            callback(null, restaurants);
            return restaurants;
          })
          .then((restaurants) => {
            this.openOrCreateDB()
              .then((db) => {
                if (!db) throw new Error('[DB ERROR] - No DB found.');
                let tx = db.transaction(['restaurants'], 'readwrite');
                tx.oncomplete = () => console.log('restaurants transaction success');
                tx.onerror = () => console.log('restaurants transaction error');
                let objectStore = tx.objectStore('restaurants');
                restaurants.forEach((restaurant) => {
                  console.log('Putting restaurant: ', restaurant);
                  objectStore.put(restaurant);
                  objectStore.onsuccess = () => console.log('restaurants success adding', restaurant);
                });
              });
          })
          .catch(err => {
            this.openOrCreateDB()
              .then((db) => {
                let tx = db.transaction(['restaurants']);
                let objectStore = tx.objectStore('restaurants');
                let getAllRequest = objectStore.getAll();
                getAllRequest.onsuccess = (event) => {
                  callback(null, event.target.result);
                }
              });
          });
      });
  }

  /**
   * Fetch a restaurant by its ID.
   */
  static fetchRestaurantById(id, callback) {
    // fetch all restaurants with proper error handling.
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        const restaurant = restaurants.find(r => r.id == id);
        if (restaurant) { // Got the restaurant
          callback(null, restaurant);
        } else { // Restaurant does not exist in the database
          callback('Restaurant does not exist', null);
        }
      }
    });
  }

  /**
   * Fetch all restaurants reviews.
   */
  // static fetchRestaurantReviews(callback) {
  //   this.openOrCreateDB()
  //     .then(data => {
  //       // If restaurant data exists return that 
  //       if (data.length > 0) {
  //         console.log('Reviews exist data.length > 0');
  //         return callback(null, data);
  //       }
  //       // Fetch from network
  //       console.log('Fetching reviews from network');
  //       return fetch(`${this.SERVER_REVIEWS_URL}`)
  //         .then(res => {
  //           if (res.ok) {
  //             console.log('Reviews Res.json() okay.')
  //             return res.json()
  //           }
  //           throw new Error('[REVIEW FETCH ACTION] - Network error');
  //         })
  //         // .then(reviews => {
  //         //   console.log('Got reviews.', reviews);
  //         //   // callback(null, reviews);
  //         //   console.log('after callback. Got reviews.', reviews);
  //         //   return reviews;
  //         // })
  //         .then((reviews) => {
  //           console.log('Trying to put in the reviews: ', reviews);
  //           this.openOrCreateDB()
  //             .then((db) => {
  //               if (!db) throw new Error('[DB ERROR] - No DB found.');
  //               let tx = db.transaction(['reviews'], 'readwrite');
  //               tx.oncomplete = () => console.log('reviews transaction success');
  //               tx.onerror = () => console.log('reviews transaction error');
  //               let objectStore = tx.objectStore('reviews');
  //               reviews.forEach((review) => {
  //                 console.log('Putting review: ', review);
  //                 objectStore.put(review);
  //                 objectStore.onsuccess = () => console.log('success adding', review);
  //               });
  //             });
  //           callback(null, reviews);
  //         })
  //         .catch(err => {
  //           // this.openOrCreateDB()
  //           //   .then((db) => {
  //           //     let tx = db.transaction(['reviews']);
  //           //     let objectStore = tx.objectStore('reviews');
  //           //     let getAllRequest = objectStore.getAll();
  //           //     getAllRequest.onsuccess = (event) => {
  //           //       callback(null, event.target.result);
  //           //     }
  //           //   });
  //           callback(err, null);
  //         });
  //     });
  // }
  static fetchRestaurantReviewsById(id, callback) {
    this.openOrCreateDB()
      .then(db => {
        if (!db) return;
        // 1. Check if there are reviews in the IDB
        const tx = db.transaction('reviews');
        const store = tx.objectStore('reviews');
        return store.getAll();
      })
      .then(reviews => {
        if (reviews && reviews.length > 0) {
          // Continue with reviews from IDB
          callback(null, reviews);
        } else {
          // 2. If there are no reviews in the IDB, fetch reviews from the network
          fetch(`${DBHelper.SERVER_REVIEWS_URL}/?restaurant_id=${id}`)
            .then(res => res.json())
            .then(reviews => {
              this.openOrCreateDB()
                .then(db => {
                  if (!db) return;
                  // 3. Put fetched reviews into IDB
                  const tx = db.transaction('reviews', 'readwrite');
                  const store = tx.objectStore('reviews');
                  reviews.forEach(review => store.put(review))
                });
              // Continue with reviews from network
              callback(null, reviews);
            })
            .catch(error => {
              // Unable to fetch reviews from network
              callback(error, null);
            })
        }
      })
      .catch((err) => callback(err, null));
  }
  /**
   * Fetch a restaurant review by its ID.
   * @param {Number} id 
   * @param {fn} callback 
   */
  // static fetchRestaurantReviewsById(id, callback) {
  //   console.log('Inside fetchRestaurantReviewsById', id);
  //   // fetch all restaurants with proper error handling.
  //   DBHelper.fetchRestaurantReviews((error, reviews) => {
  //     if (error) {
  //       callback(error, null);
  //     } else {
  //       const review = reviews.filter(r => r.restaurant_id === id);
  //       console.log('review: ', id, ' - ', review.length);
  //       if (review) { // Got the restaurant
  //         console.log('Inside review: ', review);
  //         callback(null, review);
  //       } else { // Restaurant Review does not exist in the database
  //         console.log('Outside review');
  //         callback('Restaurant Review does not exist', null);
  //       }
  //     }
  //   });
  // }

  // static fetchRestaurantReviewsById(id, callback) {
  //   const fetchURL = DBHelper.SERVER_REVIEWS_URL + "/?restaurant_id=" + id;
  //   fetch(fetchURL, { method: "GET" })
  //     .then(res => {
  //       if (!res.clone().ok && !res.clone().redirected) {
  //         throw "No reviews available";
  //       }
  //       res
  //         .json()
  //         .then(result => {
  //           callback(null, result);
  //         })
  //     }).catch(error => callback(error, null));
  // }


  /**
   * Fetch restaurants by a cuisine type with proper error handling.
   */
  static fetchRestaurantByCuisine(cuisine, callback) {
    // Fetch all restaurants  with proper error handling
    DBHelper.fetchRestaurants((error, restaurants) => {
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
  static fetchRestaurantByNeighborhood(neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
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
  static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        let results = restaurants
        if (cuisine != 'all') { // filter by cuisine
          results = results.filter(r => r.cuisine_type == cuisine);
        }
        if (neighborhood != 'all') { // filter by neighborhood
          results = results.filter(r => r.neighborhood == neighborhood);
        }
        callback(null, results);
      }
    });
  }

  /**
   * Fetch all neighborhoods with proper error handling.
   */
  static fetchNeighborhoods(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all neighborhoods from all restaurants
        const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood)
        // Remove duplicates from neighborhoods
        const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i)
        callback(null, uniqueNeighborhoods);
      }
    });
  }

  /**
   * Fetch all cuisines with proper error handling.
   */
  static fetchCuisines(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all cuisines from all restaurants
        const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type)
        // Remove duplicates from cuisines
        const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i)
        callback(null, uniqueCuisines);
      }
    });
  }

  /**
   * Restaurant page URL.
   */
  static urlForRestaurant(restaurant) {
    return (`./restaurant.html?id=${restaurant.id}`);
  }

  /**
   * Restaurant image URL.
   */
  static imageUrlForRestaurant(restaurant) {
    return (`/img/${restaurant.id}_800w.jpg`);
  }

  /**
   * Map marker for a restaurant.
   */
  static mapMarkerForRestaurant(restaurant, map) {
    // https://leafletjs.com/reference-1.3.0.html#marker  
    const marker = new L.marker([restaurant.latlng.lat, restaurant.latlng.lng],
      {
        title: restaurant.name,
        alt: restaurant.name,
        url: DBHelper.urlForRestaurant(restaurant)
      })
    marker.addTo(newMap);
    return marker;
  }

  /**
   * DB Helper for handling 
   * @param {string} id 
   * @param {boolean} newState 
   */
  static handleFavoriteClick(id, newState) {
    const fav = document.getElementById("favorite-btn-" + id);
    // fav.onclick = null;

    DBHelper.updateFavorite(id, newState, (error, resultObj) => {
      if (error) {
        console.error("Error updating favorite");
        return;
      }
      // Update the button background for the specified favorite
      const favorite = document.getElementById("favorite-btn-" + resultObj.id);
      favorite.style.background = resultObj.value
        ? `url("/icons/love_2.svg") no-repeat`
        : `url("icons/love_1.svg") no-repeat`;
    });
  }

  static toggleFavorite(restaurant, isFavorite) {
    fetch(`${DBHelper.SERVER_URL}/${restaurant.id}/?is_favorite=${isFavorite}`, { method: 'PUT' })
      .then(response => {
        return response.json();
      })
      .then(data => {
        this.openOrCreateDB()
          .then(db => {
            if (!db) return;
            const tx = db.transaction('restaurants', 'readwrite');
            const store = tx.objectStore('restaurants');
            store.put(data)
          });
        return data;
      })
      .catch(error => {
        restaurant.is_favorite = isFavorite;
        this.openOrCreateDB()
          .then(db => {
            if (!db) return;
            const tx = db.transaction('restaurants', 'readwrite');
            const store = tx.objectStore('restaurants');
            store.put(restaurant);
          }).catch(error => {
            console.log(error);
            return;
          });
      });
  }
  /**
   * Update in the data for all restaurants 
   * @param {*} id 
   * @param {*} updateObj 
   */
  static toggleFavorite2(id, newState) {
    // Update the restaurant information in idb
    DBHelper.fetchRestaurantById(id, (error, restaurant) => {
      self.restaurant = restaurant;
      if (!restaurant) {
        console.error(error);
        return;
      }
      restaurant.is_favorite = newState;
      // Put the data back in IDB storage
      this.openOrCreateDB()
        .then(db => {
          console.log('Putting restaurant: ', restaurant);
          const tx = db.transaction("restaurants", "readwrite");
          tx.objectStore("restaurants")
            .put(restaurant);
          tx.objectStore.onsuccess = () => console.log('restaurants success adding', restaurant);
          return tx.complete;
        })
    });
    // this.openOrCreateDB()
    //   .then(db => {
    //     console.log("Getting db transaction");
    //     const tx = db.transaction("restaurants", "readwrite");
    //     const value = tx.objectStore("restaurants")
    //     console.log('Value: ', value.getAll('-1'));
    //     return value.get("-1");
    //   })
    //   .then(value => {
    //     if (!value) {
    //       console.log("No cached data found");
    //       return;
    //     }
    //     const data = value.data;
    //     console.log('Data: ', data);
    //     const restaurantArr = data.filter(r => r.id === id);
    //     const restaurantObj = restaurantArr[0];
    //     // Update restaurantObj with updateObj details
    //     if (!restaurantObj)
    //       return;
    //     const keys = Object.keys(updateObj);
    //     keys.forEach(k => {
    //       restaurantObj[k] = updateObj[k];
    //     })

    //     // Put the data back in IDB storage
    //     this.openOrCreateDB()
    //       .then(db => {
    //         const tx = db.transaction("restaurants", "readwrite");
    //         tx.objectStore("restaurants")
    //           .put({ id: "-1", data: data });
    //         return tx.complete;
    //       })
    //   })


    // // Update the restaurant specific data
    // this.openOrCreateDB()
    //   .then(db => {
    //     console.log("Getting db transaction");
    //     const tx = db.transaction("restaurants", "readwrite");
    //     const value = tx
    //       .objectStore("restaurants")
    //       .get(id + "")
    //       .then(value => {
    //         if (!value) {
    //           console.log("No cached data found");
    //           return;
    //         }
    //         const restaurantObj = value.data;
    //         console.log("Specific restaurant obj: ", restaurantObj);
    //         // Update restaurantObj with updateObj details
    //         if (!restaurantObj)
    //           return;
    //         const keys = Object.keys(updateObj);
    //         keys.forEach(k => {
    //           restaurantObj[k] = updateObj[k];
    //         })

    //         // Put the data back in IDB storage
    //         this.openOrCreateDB()
    //           .then(db => {
    //             const tx = db.transaction("restaurants", "readwrite");
    //             tx
    //               .objectStore("restaurants")
    //               .put({
    //                 id: id + "",
    //                 data: restaurantObj
    //               });
    //             return tx.complete;
    //           })
    //       })
    //   })
  }

  static updateFavorite(id, newState, callback) {
    // Push the request into the waiting queue in IDB
    console.log('Inside updateFavorite');
    const url = `${DBHelper.SERVER_URL}/${id}/?is_favorite=${newState}`;
    const method = "PUT";
    DBHelper.toggleFavorite2(id, newState);
    DBHelper.addPendingRequestToQueue(url, method);

    // Update the favorite data on the selected ID in the cached data

    callback(null, { id, value: newState });
  }

  static updateCachedRestaurantReview(id, bodyObj) {
    console.log("updating cache for new review: ", bodyObj);
    // Push the review into the reviews store
    this.openOrCreateDB()
      .then(db => {
        const tx = db.transaction("reviews", "readwrite");
        const store = tx.objectStore("reviews");
        console.log("putting cached review into store");
        store.put({
          id: Date.now(),
          "restaurant_id": id,
          data: bodyObj
        });
        console.log("successfully put cached review into store");
        return tx.complete;
      })
  }

  /**
   * Save the Review by Id
   * @param {string} id 
   * @param {object} bodyObj 
   * @param {fn} callback 
   */
  static saveNewReview(id, bodyObj, callback) {
    // Push the request into the waiting queue in IDB
    const url = `${DBHelper.DATABASE_REVIEWS_URL}`;
    const method = "POST";
    DBHelper.updateCachedRestaurantReview(id, bodyObj);
    DBHelper.addPendingRequestToQueue(url, method, bodyObj);
    callback(null, null);
  }

  static addPendingRequestToQueue(url, method, body) {
    // Open the database and add the request details to the pending-reviews db
    this.openOrCreateDB()
      .then(db => {
        const tx = db.transaction("pending-reviews", "readwrite");
        tx
          .objectStore("pending-reviews")
          .put({
            data: {
              url,
              method,
              body
            }
          })
      })
      .catch(error => { })
      .then(DBHelper.nextPending());
  }

  static nextPending() {
    DBHelper.attemptCommitPending(DBHelper.nextPending);
  }
  static attemptCommitPending(callback) {
    // Iterate over the pending-reviews items until there is a network failure
    let url;
    let method;
    let body;
    //const dbPromise = idb.open("fm-udacity-restaurant");
    this.openOrCreateDB()
      .then(db => {
        if (!db.objectStoreNames.length) {
          console.log("DB not available");
          db.close();
          return;
        }

        const tx = db.transaction("pending-reviews", "readwrite");
        tx
          .objectStore("pending-reviews")
          .openCursor()
          .then(cursor => {
            if (!cursor) {
              return;
            }
            const value = cursor.value;
            url = cursor.value.data.url;
            method = cursor.value.data.method;
            body = cursor.value.data.body;

            // If we don't have a parameter then we're on a bad record that should be tossed
            // and then move on
            if ((!url || !method) || (method === "POST" && !body)) {
              cursor
                .delete()
                .then(callback());
              return;
            };

            const properties = {
              body: JSON.stringify(body),
              method: method
            }
            console.log("sending post from queue: ", properties);
            fetch(url, properties)
              .then(response => {
                // If we don't get a good response then assume we're offline
                if (!response.ok && !response.redirected) {
                  return;
                }
              })
              .then(() => {
                // Success! Delete the item from the pending-reviews queue
                const deltx = db.transaction("pending-reviews", "readwrite");
                deltx
                  .objectStore("pending-reviews")
                  .openCursor()
                  .then(cursor => {
                    cursor
                      .delete()
                      .then(() => {
                        callback();
                      })
                  })
                console.log("deleted pending item from queue");
              })
          })
          .catch(error => {
            console.log("Error reading cursor");
            return;
          })
      })
  }

  static postReviewToServer(review) {
    console.log('Calling postReviewToServer ', review);
    return fetch(`${DBHelper.SERVER_REVIEWS_URL}`, {
      body: JSON.stringify(review),
      cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
      credentials: 'same-origin', // include, same-origin, *omit
      headers: {
        'content-type': 'application/json'
      },
      method: 'POST',
      mode: 'cors', // no-cors, cors, *same-origin
      redirect: 'follow', // *manual, follow, error
      referrer: 'no-referrer', // *client, no-referrer
    })
      .then(res => {
        res.json()
          .then(data => {
            this.openOrCreateDB()
              .then(db => {
                if (!db) return;
                // Put fetched reviews into IDB
                console.log('Review before put: ', data);
                const tx = db.transaction('reviews', 'readwrite');
                const store = tx.objectStore('reviews');
                store.put(data);
              });
            return data;
          })
      })
      .catch(() => {
        /**
         * Network offline.
         * Add a unique updateTime property to the review
         * and store it in the IDB.
         */
        data['updateTime'] = new Date().getTime();
        console.log('Updated review', data);

        this.openOrCreateDB()
          .then(db => {
            if (!db) return;
            // Put fetched reviews into IDB
            const tx = db.transaction('pending-reviews', 'readwrite');
            const store = tx.objectStore('pending-reviews');
            store.put(data);
            console.log('Review stored offline in IDB');
          });
        return;
      });
  }

  static postOfflineReviewsToServer() {
    console.log('Calling postOfflineReviewsToServer');
    this.openOrCreateDB()
      .then(db => {
        if (!db) return;
        const tx = db.transaction('pending-reviews');
        const store = tx.objectStore('pending-reviews');
        store.getAll().then(reviews => {
          console.log(reviews);
          for (const review of reviews) {
            DBHelper.postReviewToServer(review);
          }
          store.clear();
        });
      });
  }
}
// window.DBHelper = DBHelper;

