
const version= '1';
const staticCacheName = "review-v" + version;
const staticFiles = [
    "index.html",
    "restaurant.html",
    "css/styles.css",
    "data/restaurants.json",
    "js/dbhelper.js",
    "js/restaurant_info.js"
];

// install
self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(staticCacheName).then((cache) => {
            return cache.addAll(staticFiles);
        })
    );
});

// activate 
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then ((cacheNames)=>{
      return Promise.all (
        cacheNames.filter().filter(function(cacheName){
        return cacheName != staticCacheName;
        }).map(function (cacheName){
          return caches.delete(cacheName);
        })
      )  
    })
  );
});
fetch
self.addEventListener('fetch', (event)=>{
    event.respondWith(    
        caches.match(event.request).then(response=>{
            // return the orininal request to network
            return response || fetch(event.request);
            })
        );
    });

// message
self.addEventListener ('message', function (event){

    if(event.data.action == 'skipwaiting'){
        self.skipWaiting();
    }
});