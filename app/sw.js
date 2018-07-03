/* eslint-env worker */
import idb from 'idb';
const currentCacheName = 'restaurant-sw-cache-v3';

const dbPromise = idb.open('udacity-restaurant', 1, upgradeDB => {
  switch (upgradeDB.oldVersion) {
    case 0 :
      upgradeDB.createObjectStore('restaurants', {keyPath: 'id'});
  }
});
 
/* === getting service worker ready with cache === */
self.addEventListener('install', (event) => {
  const cachedUrls = [
    '/',
    '/js/dbhelper.js',
    '/js/main.js',
    '/img/na.png',
    '/js/restaurant_info.js',
    '/index.html',
    '/restaurant.html',
    '/css/styles.css'
  ];
  event.waitUntil(
    caches.open(currentCacheName).then((cache) => {
      cache.addAll(cachedUrls);
    })
  );
});

/* ===== Activate event To delete old version caches ===== */
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.filter((cacheName) => {
          return cacheName.startsWith('restaurant-') &&
                 cacheName != currentCacheName;
        }).map((cacheName) => {
          return caches.delete(cacheName);
        })
      );
    })
  );
});

/* === Fetching cached content ==== */
self.addEventListener('fetch', (event) => {
      let cacheRequest = event.request;
      if (event.request.url.indexOf('restaurant.html') > -1 ) {
        const cacheURL = 'restaurant.html';
        cacheRequest = new Request(cacheURL);
      }

    const checkURL = new URL(event.request.url);
    if (checkURL.port === '1337') {
      const parts = checkURL.pathname.split('/');
      const id = parts[parts.length - 1] === 'restaurants' ? '-1' : parts[parts.length -1];
      handleAJAXEvent(event, id);
    } else {
      handleNonAJAXEvent(event, cacheRequest);
    }
  }); 

    const handleAJAXEvent = (event, id) => {
      event.respondWith(
        dbPromise.then(db => {
          return db.transaction('restaurants').objectStore('restaurants').get(id);
        }).then(data => {
          return (
            (data && data.data) || fetch(event.request).then(fetchResponse => fetchResponse.json())
            .then(json => {
              return dbPromise.then(db => {
                  const trx = db.transaction('restaurants', 'readwrite');
                  trx.objectStore('restaurants').put({
                    id: id,
                    data: json
                  });
                  return json;
              });
            })
          );
        }).then(finalResponse => {
          return new Response(JSON.stringify(finalResponse));
        }).catch(() => {
          return new Response('Error Fetching Data', { status: 500});
        })
      );
    };


    const handleNonAJAXEvent = (event, cacheRequest) => {
      event.respondWith(
        caches.match(cacheRequest).then(response => {
          return ( response || fetch(event.request).then(fetchResponse => {
                return caches.open(currentCacheName)
                  .then(cache => {
                    cache.put(event.request, fetchResponse.clone());
                    return fetchResponse;
                  });
            }).catch(error => {
              if (event.request.url.indexOf('.jpg') > -1) {
                return caches.match('/img/na.png');
              }
              return new Response (
                'Application is not connected', {
                  status: 404,
                  statusText: 'Application is not connected to the internet'
                }
              );
            })
          );
        })
      );
    };
