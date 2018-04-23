//////////
const staticCacheName = "restaurant-static-v1"
const pictureCacheName = "restaurant-content-imgs"
let allCaches = [
    staticCacheName,
    pictureCacheName
]

self.addEventListener('install',(event)=>{  // do things when the service worker installs
    event.waitUntil(
        caches.open(staticCacheName).then((cache)=>{
            return cache.addAll([
                '/',
                '/restaurant.html',
                '/js/main.js',
                '/js/dbhelper.js',
                '/js/restaurant_info.js',
                '/js/RegisterSW.js',
                '/js/modal.js',
                '/css/styles.css',
                '/css/over450.css',
                '/data/restaurants.json'
            ])
        })
    )
})


self.addEventListener('activate', (event)=>{   // when active -delete the outdated caches
    // delte the caches that arn't the current one
    event.waitUntil(
        caches.keys().then((cacheNames)=>{
            return Promise.all(
                cacheNames.filter((cacheName)=>{
                    return cacheName.startsWith('restaurant') &&
                        !allCaches.includes(cacheName)
                }).map((cacheName)=>{
                    return caches.delete(cacheName)
                })
            )
        })
    )
})

self.addEventListener('fetch', (event)=>{   // listening for calls to fetch
    const requestUrl = new URL(event.request.url)
    
    // == get things from cache first || get from network if not in the cache
    if(requestUrl.origin === location.origin){  // if the request is to the site source
        if(requestUrl.pathname.startsWith('/img/')){ // if the request if from our image store
            event.respondWith(servePhoto(event.request))
            return;
        }else if(requestUrl.pathname.startsWith('/restaurant.html')){ // check to see if we need to serve the restaurants page
            event.respondWith(
                caches.match('restaurant.html').then((response)=>{
                    return response || fetch(event.request)
                })
            )
        }else{
            event.respondWith(
                caches.match(event.request).then((response)=>{  // look in the caches for the response
                    return response || fetch(event.request) // if no response - get it from the network
                })
            )
        }
    }
        

})

self.addEventListener('get', ()=>{
    console.log("Getting the page")
})

function servePhoto(request){
    const storageUrl = request.url.replace(/-\d+_\d+x.jpg$/, '');

    return caches.open(pictureCacheName).then(function(cache){
        return cache.match(storageUrl).then(function(response){
            if(response){
                return response;
            } 

            return fetch(request).then(function(networkResponse){
                cache.put(storageUrl, networkResponse.clone());
                return networkResponse;
            })
        })
    })
}


self.addEventListener('message', (event)=>{ // listening to messages to service worker

    // if a message has been sent to have the installed service worker stop waiting
    if(event.data.action == 'skipWaiting'){
        self.skipWaiting()  // tell the service worker to install itself
    }
})