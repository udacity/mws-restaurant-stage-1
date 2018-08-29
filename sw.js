const staticCacheName = 'Restaurant-static-v1'; 
//const imageCacheName = 'Restaurant-images-v1';
const dynamicCacheName = 'Restaurant-dynamic-v1';

const allCaches = [ staticCacheName, dynamicCacheName];

const filesToCache = [
    './',
    './index.html',
    './restaurant.html',
    './css/styles.css',
    './js/dbhelper.js',
    './js/main.js',
    './js/restaurant_info.js',
    './data/restaurants.json',
    //'https://fonts.googleapis.com/css?family=Lato',
    //'https://fonts.gstatic.com/s/lato/v14/S6uyw4BMUTPHjx4wXiWtFCc.woff2',
    'https://unpkg.com/leaflet@1.3.1/dist/leaflet.css',
    'https://unpkg.com/leaflet@1.3.1/dist/leaflet.js',
    'https://unpkg.com/leaflet@1.3.1/dist/images/marker-icon.png',
    'https://unpkg.com/leaflet@1.3.1/dist/images/marker-icon-2x.png',
    'https://unpkg.com/leaflet@1.3.1/dist/images/marker-shadow.png'
]

// Install service worker and cache essential files
self.addEventListener('install', event => {
    console.log('ServiceWorker Installing');
    event.waitUntil(
        caches.open(staticCacheName).then(cache => {
            console.log('ServiceWorker installed');
            cache.addAll(filesToCache);
        }).catch(error => console.log('failed to cache files' + error))
    );
});
// Activate service worker and delete old static caches
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cachesNames => {
            return Promise.all(
                cacheNames.filter(cacheName => {
                    return cacheName.startsWith('Restaurant-') && !allCaches.includes(cacheName);
                }).map(cacheName => {
                    return caches.delete(cacheName);
                    console.log(cacheName);
                    console.log('SW activated');
                })
            );
        })
    );
});

// intercept requests
self.addEventListener('fetch', event => {
    let requestUrl = new URL(event.request.url);
    if (requestUrl.origin === location.origin) {
        if (requestUrl.pathname === './') {
            event.respondWith(caches.match('./index.html'));
            return;
        }
        if (requestUrl.pathname === '/restaurant.html') {
            event.respondWith(caches.match('./restaurant.html'));
            return;
        }
    }
    else if (requestUrl.pathname.includes('v4/mapbox.streets/')) {
        event.respondWith(getImages(event.request));
    }
    else if (requestUrl.pathname.includes('./images')) {
        event.respondWith(getImages(event.request));
    }
    else {
        event.respondWith(getResources(event.request));
    }
});
/*** Fetch images from cache or get from network ***/   
getImages = request => {
    const imageUrl = request.url;
    return caches.open(dynamicCacheName).then(cache =>{
        return cache.match(imageUrl).then(response =>{
            if(response) {
                return response;
            } else {
                return fetch(request).then(networkResponse =>{
                    cache.put(imageUrl, networkResponse.clone());
                    return networkResponse;
                });
            }
      });
    });
}; 
/*** Fetch resources from cache or get from network ***/  
getResources = request => {
    const storageUrl = request.url;
    return caches.open(staticCacheName).then(cache =>{
        return cache.match(storageUrl).then(response =>{
            if(response) {
                return response;
            } else {
                return fetch(request).then(networkResponse =>{
                    cache.put(storageUrl, networkResponse.clone());
                    return networkResponse;
                });
            }
      });
    });
};
/*
event.respondWith(
        caches.open(staticCacheName).then(cache => {
            cache.match(event.request).then(response => {
                if (response) {
                    return response
                } 
                else {
                    fetch(event.request).then( netResponse => {
                    cache.put(requestUrl, netResponse.clone());
                    return netResponse;
                    });
                }
            });
        })
    );
*/
self.addEventListener('message', event => {
    if (event.data.action === 'skipWaiting') {
        self.skipWaiting();
    }
});