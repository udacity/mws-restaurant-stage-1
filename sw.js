console.log('start sw');

// When a new version of the cache is needed, we'll update the version in the name over here
const cacheName = 'restaurant-review-v1';
const filesToCache = [
    '/',
    '/index.html',
    '/restaurant.html',
    '/js/main.js',
    '/js/restaurant_info.js',
    '/css/styles.css',
    '/data/restaurants.json',
    '/fonts/pt-sans-v9-latin-regular.eot',
    '/fonts/pt-sans-v9-latin-regular.svg',
    '/fonts/pt-sans-v9-latin-regular.ttf',
    '/fonts/pt-sans-v9-latin-regular.woff',
    '/fonts/pt-sans-v9-latin-regular.woff2',
    '/img/1-247px.jpg',
    '/img/1-451px.jpg',
    '/img/1-670px.jpg',
    '/img/2-247px.jpg',
    '/img/2-451px.jpg',
    '/img/2-670px.jpg',
    '/img/3-247px.jpg',
    '/img/3-451px.jpg',
    '/img/3-670px.jpg',
    '/img/4-247px.jpg',
    '/img/4-451px.jpg',
    '/img/4-670px.jpg',
    '/img/5-247px.jpg',
    '/img/5-451px.jpg',
    '/img/5-670px.jpg',
    '/img/6-247px.jpg',
    '/img/6-451px.jpg',
    '/img/6-670px.jpg',
    '/img/7-247px.jpg',
    '/img/7-451px.jpg',
    '/img/7-670px.jpg',
    '/img/8-247px.jpg',
    '/img/8-451px.jpg',
    '/img/8-670px.jpg',
    '/img/9-247px.jpg',
    '/img/9-451px.jpg',
    '/img/9-670px.jpg',
    '/img/10-247px.jpg',
    '/img/10-451px.jpg',
    '/img/10-670px.jpg'
  ];

// when installing this service worker, we'll cache all resources
self.addEventListener('install', function(event) {
    console.log('installing service worker, caching files...')
    event.waitUntil(
        caches.open(cacheName)
        .then(cache => {
            return cache.addAll(filesToCache)
            .then(() => self.skipWaiting());
        })
    );
});

self.addEventListener('fetch', function(event) {
    console.log('test');
  });


// Prior to fetching website content, we'll check whether there's an entry
// in our cache. If zo, we load that one instead.
self.addEventListener('fetch', function(event) {
    console.log('Fetch event for ', event.request.url);
    event.respondWith(
      caches.match(event.request).then(function(response) {
        if (response) {
          console.log('Found ', event.request.url, ' in our cache...');
          return response;
        }
        console.log('New network request for ', event.request.url);
        return fetch(event.request)
      })
    );
});