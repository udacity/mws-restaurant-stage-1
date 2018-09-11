const staticCacheName = 'Restaurant-static-v1'; 
const filesToCache = [
    './',
    './index.html',
    './restaurant.html',
    './css/styles.css',
    './js/dbhelper.js',
    './js/main.js',
    './js/restaurant_info.js',
    './data/restaurants.json',
    './favicon.png',
    //'https://fonts.googleapis.com/css?family=Lato',
    //'https://fonts.gstatic.com/s/lato/v14/S6uyw4BMUTPHjx4wXiWtFCc.woff2',
    'https://unpkg.com/leaflet@1.3.1/dist/leaflet.css',
    'https://unpkg.com/leaflet@1.3.1/dist/leaflet.js',
    'https://unpkg.com/leaflet@1.3.1/dist/images/marker-icon.png',
    'https://unpkg.com/leaflet@1.3.1/dist/images/marker-icon-2x.png',
    'https://unpkg.com/leaflet@1.3.1/dist/images/marker-shadow.png'
];

/*
 *   Install service worker and cache essential files 
 */
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(staticCacheName).then(cache => {
          console.log('Service Worker caching essential files');
          return cache.addAll(filesToCache); 
        })
    );
});

/*
 *   Activate service worker and delete old cache 
 */
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.filter(cacheName => {
          return cacheName.startsWith('Restaurant-static-') && cacheName !== staticCacheName;
        }).map(cacheName => {
            console.log('Service Worker Removed old cache:', cacheName);
              return caches.delete(cacheName);
          })
      );
    })
  );
});

/**  Activate Service Worker immediately  **/
//self.skipWaiting();

/*   
 *   Fetch resources from cache or get from network if unavailable in cache then save a copy of response for future  
 */
self.addEventListener('fetch', event => {
  const requestUrl = new URL(event.request.url);
  console.log(event.request);
    if (requestUrl.pathname === './') {
        event.respondWith(caches.match('./index.html'));
        return;
    }
    if (requestUrl.pathname.includes('/restaurant.html')) {
      event.respondWith(caches.match('./restaurant.html'));
      return;
    }
    if (requestUrl.pathname.includes('/data/restaurants.json')) {
      event.respondWith(caches.match('./data/restaurants.json'));
      return;
    }
/** fetch from catch or network **/
  event.respondWith(
    caches.match(requestUrl).then(response => {
      return response || fetch(event.request).then(fetchResponse => { 
        return caches.open(staticCacheName).then(cache => {           
          cache.put(requestUrl, fetchResponse.clone());            
          return fetchResponse;                                       
        });                                                           
      });                                                             
    })
  );
});