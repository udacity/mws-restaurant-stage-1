import { deleteItem, deleteItems, writeItem } from "./js/utils";

const APP_VERSION = 2;

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
      cloneRes.json().then(restaurant => {
        writeItem("restaurants", restaurant);
      });
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
