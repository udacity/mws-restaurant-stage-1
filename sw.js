/*var log = console.log.bind(console);
var version = "0.0.2";
var cacheName = "sw";
var cache = cacheName + "-" + version;
var filesToCache = [
    '/',
    '/index.html',
    '/restaurant.html',
    '/img',
    '/css/styles.css',
    '/js/main.js',
    '/js/restaurant_info.js',
    '/data/restaurant.json'
];*/

var CACHE = 'cache-only';

 
self.addEventListener('install', function(evt) {
  console.log('The service worker is being installed.');


 
  evt.waitUntil(precache());
});


 
self.addEventListener('fetch', function(evt) {
  console.log('The service worker is serving the asset.');
  evt.respondWith(fromCache(evt.request));
});

 
function precache() {
  return caches.open(CACHE).then(function (cache) {
    return cache.addAll([
      './controlled.html',
      './asset'
    ]);
  });
}

 
function fromCache(request) {
  return caches.open(CACHE).then(function (cache) {
    return cache.match(request).then(function (matching) {
      return matching || Promise.reject('no-match');
    });
  });
}