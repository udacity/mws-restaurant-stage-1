let restaufiles = "restaureview-v1";
let restauImages = "restauimage-v1";
let cacheWhiteList = [restaufiles, restauImages];
self.addEventListener("install", event => {
    console.log('Installing service working...');
    event.waitUntil(
        caches.open(restaufiles).then(cache => {
            //add the files to be cached
            return cache.addAll([
                "./",
                "./index.html",
                "./restaurant.html",
                "./css/styles.css",
                "./js/dbhelper.js",
                "./js/main.js",
                "./js/restaurant_info.js",
                "https://unpkg.com/leaflet@1.3.1/dist/leaflet.js",
                "https://unpkg.com/leaflet@1.3.1/dist/leaflet.css",
                "https://unpkg.com/leaflet@1.3.1/dist/images/marker-icon-2x.png"
            ]);
        })
    );
});

self.addEventListener("activate", event =>{
    event.waitUntil(
        caches.keys().then(cacheNames =>{
            return Promise.all(cacheNames.map(cacheName =>{
                //loop through and delete caches not in my whitelist
                if(cacheWhiteList.indexOf(cacheName) === -1){
                    return caches.delete(cacheName);
                }
            }))
        })
    );
});

self.addEventListener("fetch", event =>{
    //get the response type of the requested asset and cache accordingly
    console.log(event.request.url);
    const destination = event.request.destination;
    console.log(destination);

        event.respondWith(
            caches.match(event.request).then(response =>{
                if(response){
                    return response;
                }
                //clone the request because it can only be consumed once
                fetchRequest = event.request.clone();
                return fetch(fetchRequest).then(response =>{
                    if(!response || response.status !== 200 || response.type !== 'basic') {
                        return response;
                    }
                    //clone the response as well
                    var responseToCache = response.clone();
                    //Add items to the image cache
                    caches.open(restauImages)
                      .then(cache => {
                        cache.put(event.request, responseToCache);
                      });
        
                    return response;
                });
            })
       );
    

});
