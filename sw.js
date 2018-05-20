// In addition to the Udacity Jake Archibald content, I've been using Max
// Schwarzmueller's PWA course on Udemy.
// The service worker reflects patterns, I've learned from both courses
// https://www.udemy.com/progressive-web-app-pwa-the-complete-guide/learn/v4/

try {
  importScripts("/js/idb.js");
  importScripts("/js/utils.js");
} catch (err) {
  console.log(err);
}

const SW_VERSION = "6";
const STATIC_CACHE_NAME = `static-v${SW_VERSION}`;
const STATIC_CACHE_CONTENT = [
  "/",
  "/index.html",
  "/restaurant.html",
  "/css/styles.css",
  "/js/idb.js",
  "/js/utils.js",
  "/js/main.js",
  "/js/dbhelper.js",
  "/js/restaurant_info.js"
];
const DYNAMIC_CACHE_NAME = `dynamic-v${SW_VERSION}`;
const RESTAURANTS_URL = "http://localhost:1337/restaurants";

// Service Worker Lifecycle Events
self.addEventListener("install", event => {
  console.log(`[Service Worker v${SW_VERSION}] Installing...`, event);
  // When we install our service worker, we want to cache all of the static
  // assets needed to render our app shell
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME).then(cache => {
      console.log(
        `[Service Worker v${SW_VERSION}] Precaching App Shell to ${STATIC_CACHE_NAME}...`
      );
      cache.addAll(STATIC_CACHE_CONTENT);
    })
  );
});

self.addEventListener("activate", event => {
  console.log(`[Service Worker v${SW_VERSION}] Activating...`, event);
  // Prune all caches that are not appended with the appropriate SW version
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.map(key => {
          if (!key.includes(`-v${SW_VERSION}`)) {
            console.log(
              `[Service Worker v${SW_VERSION}] Removing old cache ${key}`
            );
            return caches.delete(key);
          } else {
            // Otherwise just immediately resolve so that Promise.all receives a Promise
            return Promise.resolve();
          }
        })
      )
    )
  );
  return self.clients.claim();
});

/**
 * Utility that helps normalize checking if a request url is in an array of cached assets
 * This is needed because of slight differences between how local and 3rd party origins are
 * expressed
 *
 * @param {string} string
 * @param {string[]} array
 * @returns
 */
function isInArray(string, array) {
  var cachePath;
  // also strip off query params
  // console.log(string);
  string = stripQueryParam(string);
  console.log("origin", self.origin);
  if (string.indexOf(self.origin) === 0) {
    // request targets domain where we serve the page from (i.e. NOT a CDN)
    // console.log("matched ", string);
    cachePath = string.substring(self.origin.length); // take the part of the URL AFTER the domain (e.g. after localhost:8080)
    // console.log("cachePath", cachePath);
  } else {
    cachePath = string; // store the full request (for CDNs)
  }
  return array.indexOf(cachePath) === -1 ? false : cachePath;
}

function stripQueryParam(string) {
  return string.split("?")[0];
}

// Fetch Proxy
self.addEventListener("fetch", event => {
  console.log("Request", event.request);
  // Condition 1: Fetching the static app shell
  // Strategy: Cache Only
  const matchingKey = isInArray(event.request.url, STATIC_CACHE_CONTENT);
  if (matchingKey) {
    console.log(
      `[Service Worker v${SW_VERSION}] Loading ${
        event.request.url
      } from ${STATIC_CACHE_NAME}`
    );
    event.respondWith(caches.match(matchingKey));
  }
  // Condition 2: Fetching restaurants JSON data from the server endpoint at RESTAURANTS_URL
  // Strategy: IndexedDB then Network
  else if (RESTAURANTS_URL === event.request.url) {
    console.log("Restaurants JSON", event.request.url);
    event.respondWith(
      fetch(event.request).then(res => {
        const cloneRes = res.clone();
        deleteItems("restaurants").then(() =>
          cloneRes.json().then(resAsJSON => {
            resAsJSON.forEach(item => {
              writeItem("restaurants", item);
            });
          })
        );
        return res;
      })
    );
  }
  // Condition 3: Fetching other requests from the network
  // Strategy: Cache then network, with fallback HTML for requests of type text/html
  else {
    event.respondWith(
      caches.match(event.request).then(cacheResponse => {
        if (!cacheResponse) {
          console.log(
            `[Service Worker v${SW_VERSION}] Fetching...`,
            event.request.url
          );
          return fetch(event.request)
            .then(fetchResponse =>
              caches.open(DYNAMIC_CACHE_NAME).then(cache => {
                cache.put(event.request.url, fetchResponse.clone());
                return fetchResponse;
              })
            )
            .catch(err => {
              return caches.open(STATIC_CACHE_NAME).then(cache => {
                // if requesting an image that's not available, serve the fail whale
                if (
                  event.request.headers.get("accept").includes("image/jpeg")
                ) {
                  return cache.match("/img/failwhale.jpg");
                }
              });
            });
        } else {
          return cacheResponse;
        }
      })
    );
  }
});

/**
 * Handle a request for all restuarants, immediately respond from the cache
 * and then request the avatar from the server to make sure the image isn't
 * stale
 *
 * @param {any} request
 * @returns HTTP response
 */
function serveRestaurants() {}
