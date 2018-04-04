const staticCacheName = "restaurant-static-v1"

self.addEventListener('install',(event)=>{  // do things when the service worker installs
    event.waitUntil(
        caches.open(staticCacheName).then((cache)=>{
            return cache.addAll([
                '/',
                '/restaurant.html',
                '/js/main.js',
                '/js/dbhelper.js',
                '/js/restaurant_info.js',
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
                            cacheName != staticCacheName
                }).map((cacheName)=>{
                    return caches.delete(cacheName)
                })
            )
        })
    )
})

// TODO: The resources are cached but not being fetched from cache when offline
self.addEventListener('fetch', (event)=>{   // listening for calls to fetch
    const requestUrl = new URL(event.request.url)
    
    // == get things from cache first || get from network if not in the cache
    event.respondWith(
        caches.match(event.request).then((response)=>{  // look in the caches for the response
            return response || fetch(event.request) // if no response - get it from the network
        })
    )

})

self.addEventListener('message', (event)=>{ // listening to messages to service worker

    // if a message has been sent to have the installed service worker stop waiting
    if(event.data.action == 'skipWaiting'){
        self.skipWaiting()  // tell the service worker to install itself
    }
})