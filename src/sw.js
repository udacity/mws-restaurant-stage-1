importScripts('https://storage.googleapis.com/workbox-cdn/releases/3.0.0/workbox-sw.js');
import IdbRestaurants from './js/idbrestaurants';
import DBHelper from './js/dbhelper';

if (workbox) {
  let dbPromise;

  self.addEventListener('activate', function(event) {
    event.waitUntil(
      IdbRestaurants.createDb()
    );
  });

  workbox.precaching.precacheAndRoute([
    'index.html',
    'restaurant.html'
  ]);

  workbox.routing.registerRoute(
    new RegExp('restaurant.html(.*)'),
    workbox.strategies.networkFirst()
  );

  workbox.routing.registerRoute(
    new RegExp('.*\.js'),
    workbox.strategies.networkFirst()
  );

  workbox.routing.registerRoute(
    /.*\.css/,
    workbox.strategies.staleWhileRevalidate({
      cacheName: 'css-cache',
    })
  );

  workbox.routing.registerRoute(
    /.*\.(?:png|jpg|jpeg|svg|gif)/,
    workbox.strategies.cacheFirst({
      cacheName: 'image-cache',
      plugins: [
        new workbox.expiration.Plugin({
          maxAgeSeconds: 7 * 24 * 60 * 60,
        })
      ],
    })
  );

  // Restaurants API request
  workbox.routing.registerRoute(
    new RegExp(DBHelper.DATABASE_URL),
    ({url, event, params}) => {
      event.respondWith(
        fetch(event.request)
          .then(response => {
            return response.clone().json()
              .then(restaurants => {
                // Update restaurants in indexedDB
                IdbRestaurants.save(restaurants);
                return response;
              });
          })
          .catch(function(error) {
            // If no network connection, returns restaurants from indexedDB
            return IdbRestaurants.getAll()
              .then(restaurants => {
                return new Response(JSON.stringify(restaurants), {
                  headers: {'Content-Type': 'application/json'}
                });
              });
          })
      );
    }
  );

} else {
  console.log(`Workbox didn't load 😬`);
}