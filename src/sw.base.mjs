import {
  deleteItem,
  deleteItems,
  writeItem,
  getItems,
  sanitizeReview
} from "./js/utils";
import { postReviewDirectly } from "./js/dbhelper";

const APP_VERSION = 2;
const SERVER = `http://localhost:1337`;

/**
 * The workboxSW.precacheAndRoute() method efficiently caches and responds to
 * requests for URLs in the manifest.
 * See https://goo.gl/S9QRab
 */

// Cache Web Fonts
workbox.routing.registerRoute(
  /.*(?:googleapis|gstatic)\.com.*$/,
  workbox.strategies.staleWhileRevalidate({
    cacheName: "google-maps",
    cacheExpiration: {
      maxEntries: 3,
      maxAgeSeconds: 60 * 60 * 24 * 30
    }
  })
);

self.__precacheManifest = [].concat(self.__precacheManifest || []);
workbox.precaching.suppressWarnings();
workbox.precaching.precacheAndRoute(self.__precacheManifest, {});

// Redirect proper route IDs to main restaurant.html
workbox.routing.registerRoute(/restaurant.html\?id=[0-9]+/, () =>
  caches.match("/restaurant.html")
);

// Cache images
workbox.routing.registerRoute(
  ({ url }) => url.origin === self.origin && url.pathname.includes(".jpg"),
  workbox.strategies.staleWhileRevalidate({
    cacheName: "restaurant-images",
    cacheExpiration: {
      maxEntries: 3,
      maxAgeSeconds: 60 * 60 * 24 * 30
    }
  })
);

workbox.routing.registerRoute(
  ({ url }) => url.pathname === "/restaurants",
  ({ url, event, params }) =>
    fetch(event.request).then(res => {
      if (res.ok) {
        const cloneRes = res.clone();
        deleteItems("restaurants").then(() =>
          cloneRes.json().then(resAsJSON => {
            resAsJSON.forEach(item => {
              writeItem("restaurants", item);
            });
          })
        );
      }
      return res;
    })
);

const restaurantByIDMatcher = new RegExp(
  /http:\/\/localhost:1337\/restaurants\/[0-9]+/
);
const restaurantByIDHandler = ({ url, event, params }) => {
  const matchRestaurantID = /\/restaurants\/([0-9]+)/g;
  const restaurantID = matchRestaurantID.exec(url)[1];
  fetch(event.request).then(res => {
    const cloneRes = res.clone();
    if (cloneRes.ok) {
      cloneRes
        .json()
        .then(restaurant => writeItem("restaurants", restaurant))
        .catch(err => console.log("ERR: ", err));
    }
    return res;
  });
};

// Because PUT and POST return the resulting object, we can reuse the logic for GET
workbox.routing.registerRoute(
  restaurantByIDMatcher,
  restaurantByIDHandler,
  "GET"
);
workbox.routing.registerRoute(
  restaurantByIDMatcher,
  restaurantByIDHandler,
  "PUT"
);
workbox.routing.registerRoute(
  restaurantByIDMatcher,
  restaurantByIDHandler,
  "POST"
);

// fetch(`${SERVER}/reviews/?restaurant_id=${restaurantID}`)
const reviewsByRestaurantIDMatcher = new RegExp(
  /http:\/\/localhost:1337\/reviews\/\?restaurant_id=[0-9]+/
);
const reviewsByRestaurantIDHandler = ({ url, event, params }) => {
  fetch(event.request).then(res => {
    const cloneRes = res.clone();
    if (cloneRes.ok) {
      cloneRes
        .json()
        .then(dirtyReviews =>
          dirtyReviews.map(dirtyReview => sanitizeReview(dirtyReview))
        )
        .then(cleanReviews => {
          cleanReviews.forEach(review => {
            writeItem("reviews", review);
          });
        });
    }
    return res;
  });
};

workbox.routing.registerRoute(
  reviewsByRestaurantIDMatcher,
  reviewsByRestaurantIDHandler,
  "GET"
);

/**
 * Send a message to a client, returning a promise that resolves to the client's response
 *
 * @param {any} client
 * @param {any} msg
 * @returns
 */
function send_message_to_client(client, msg) {
  return new Promise((resolve, reject) => {
    var msg_chan = new MessageChannel();

    msg_chan.port1.onmessage = function(event) {
      if (event.data.error) {
        reject(event.data.error);
      } else {
        resolve(event.data);
      }
    };

    // Pass a message with a response channel
    client.postMessage(msg, [msg_chan.port2]);
  });
}

/**
 * Send a message to all clients controlled by this service worker
 *
 * @param {any} msg
 */
function send_message_to_all_clients(msg) {
  return clients.matchAll().then(clients => {
    clients.forEach(client => {
      send_message_to_client(client, msg).then(m =>
        console.log(`[SW]: Received message from client ` + m)
      );
    });
  });
}

function syncNewReviews() {
  return getItems("sync-reviews").then(reviews => {
    const arrOfPromises = reviews.map(review => {
      return postReviewDirectly(review)
        .then(resBody => {
          // and delete the review from the sync-reviews store if successful
          console.log(`[SW] Synced review with server`, resBody);
          return deleteItem("sync-reviews", [
            resBody.name,
            resBody.restaurant_id
          ]);
        })
        .catch(err => {
          console.log(`[SW] Error syncing review ${review.id}`, err);
          return Promise.reject(err);
        });
    });
    // After all reviews are successfully uploaded
    return Promise.all(arrOfPromises)
      .then(res => {
        console.log(`[SW] Successfully synced all reviews to server`);
        // tell all clients to refresh their reviews
        send_message_to_all_clients("refresh");
        return Promise.resolve(res);
      })
      .catch(err => {
        console.log(`[SW] Failed to sync all reviews to server`, err);
        return Promise.reject(err);
      });
  });
}

self.addEventListener("sync", function(event) {
  switch (event.tag) {
    case "sync-new-reviews":
      return event.waitUntil(syncNewReviews());
    default:
      console.log(`[SW] Error: ${event.tag} is an unknown sync tag`);
  }
});
