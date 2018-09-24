
import idb from "idb";

const dbPromise = idb.open("mws-restaurant-review", 3, upgradeDB => {
  switch (upgradeDB.oldVersion) {
    case 0:
      upgradeDB.createObjectStore("restaurants", { keyPath: "id" });
    case 1:
    {
      const reviewsStore = upgradeDB.createObjectStore("reviews", { keyPath: "id" });
      reviewsStore.createIndex("restaurant_id", "restaurant_id");
    }
    case 2:
    upgradeDB.createObjectStore("queuedData", {keyPath: "id", autoIncrement: true});
  }
});
const cacheName = 'mws-restautrant-cache-v3',
  filesToCache = [
    '/',
    '/index.html',
    '/restaurant.html',
    '/css/styles.css',
    // '/data/restaurants.json',
    // '/img/1.jpg',
    // '/img/2.jpg',
    // '/img/3.jpg',
    // '/img/4.jpg',
    // '/img/5.jpg',
    // '/img/6.jpg',
    // '/img/7.jpg',
    // '/img/8.jpg',
    // '/img/9.jpg',
    '/img/ImageN-A.png',
    '/js/dbhelper.js',
    '/js/register.js',
    '/js/main.js',
    '/js/restaurant_info.js'
  ];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(cacheName).then(cache => {
      return cache.addAll(filesToCache);
    })
      .then(() => {
        return self.skipWaiting();
      })
      .catch(
        error => {
          console.log('Cache failed: ')
          console.log(error)
        })
  );
});

self.addEventListener('activate', event => {
  console.log("Activating ...", event);
  event.waitUntil(
    caches.keys().then(keyList => {
      return Promise.all(
        keyList.filter(key => {
          return key.startsWith('mws-') && key != cacheName;
        }).map(keyList => {
          return caches.delete(keyList);
        })
      )
    })
  )
  return self.clients.claim();
});


self.addEventListener('fetch', event => {
  console.log("Fetching cache ...", event);
  // let cacheRequest = event.request;
  let cacheURLObj = new URL(event.request.url);
  // if (event.request.url.indexOf("restaurant.html") > -1) {
  //   cacheRequest = new Request("restaurant.html");
  // }

  if (cacheURLObj.port === "1337") {
    const UrlPart = cacheURLObj.pathname.split('/');
    const id =
    UrlPart[UrlPart.length - 1] === "restaurants"
        ? "-1"
        : UrlPart[UrlPart.length - 1];
    handleAPIRequest(event, id);
  }
  else {
    handleNonAPIRequest(event);
  }
});

const handleAPIRequest = (event, id) => {
  if (event.request.method !== "GET") {
    return fetch(event.request)
      .then(response => response.json())
      .then(json => {return json});
  }
 
  if (event.request.url.indexOf("reviews") > -1) {
    event.respondWith(dbPromise.then(db => {
    return db
      .transaction("reviews")
      .objectStore("reviews")
      .index("restaurant_id")
      .getAll(id);
  }).then(data => {
    return (data.length && data) || fetch(event.request)
      .then(fetchResponse => fetchResponse.json())
      .then(data => {
        return dbPromise.then(idb => {
          const trnx = idb.transaction("reviews", "readwrite");
          const store = trnx.objectStore("reviews");
          data.forEach(review => {
            store.put({id: review.id, "restaurant_id": review["restaurant_id"], data: review});
          })
          return data;
        })
      })
  }).then(response => {
    if (response[0].data) {
      const mapResponse = response.map(review => review.data);
      return new Response(JSON.stringify(mapResponse));
    }
    return new Response(JSON.stringify(response));
  }).catch(error => {
    return new Response("Error fetching data", {status: 500})
  }))
  } else {
    handleRestaurantAPIRequest(event, id);
  }
}

const handleRestaurantAPIRequest = (event, id) => {
  event.respondWith(
    dbPromise
      .then(db => {
        return db
          .transaction("restaurants")
          .objectStore("restaurants")
          .get(id);
      })
      .then(data => {
        return (
          (data && data.data) ||
          fetch(event.request)
            .then(fetchResponse => fetchResponse.json())
            .then(json => {
              return dbPromise.then(db => {
                const tx = db.transaction("restaurants", "readwrite");
                tx.objectStore("restaurants").put({
                  id: id,
                  data: json
                });
                return json;
              });
            })
        );
      })
      .then(finalResponse => {
        return new Response(JSON.stringify(finalResponse));
      })
      .catch(error => {
        return new Response("Error fetching data", { status: 500 });
      })
  );
};


const handleNonAPIRequest = (event) => {
  event.respondWith(
    caches.match(event.request).then(response => {
      if (response) return response;
      return fetch(event.request)
        .then(networkResponse => {
          if (networkResponse === 404) return;
          return caches.open(cacheName)
            .then(cache => {
              cache.put(event.request.url, networkResponse.clone());
              return networkResponse;
            })
        })
    })
      .catch(error => {
        if (event.request.url.indexOf(".jpg") > -1) {
          return caches.match("/img/ImageN-A.png");
        }
        console.log('Error in the fetch event: ', error);
        return;
      })
  )
}