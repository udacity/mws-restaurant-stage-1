import { deleteItems, writeItem } from "./js/utils";

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

workbox.routing.registerRoute(
  ({ url, event }) => {
    console.log("Pathname: ", url.pathname);
    return url.pathname === "/restaurants";
  },
  ({ url, event, params }) =>
    fetch(event.request)
      .then(res => {
        if (res.ok) {
          console.log(`[SW] Received ${JSON.stringify(res)}`);
          const cloneRes = res.clone();
          deleteItems("restaurants").then(() =>
            cloneRes.json().then(resAsJSON => {
              resAsJSON.forEach(item => {
                writeItem("restaurants", item);
              });
            })
          );
          return res;
        } else {
          return console.log(`[SW] Failed to fetch ${event.request}`, res);
        }
      })
      .catch(err => console.log(`[SW] Failed to fetch ${event.request}`, err))
);
