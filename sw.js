/**
 * Service Worker configurations
 */

const APP_VERSION = 'v2';
var staticCacheName = `mws-static-${APP_VERSION}`;
var mapCacheName = `msw-map-${APP_VERSION}`;

const GOOGLE_MAPS_URL = 'https://maps.googleapis.com/maps/api/js?key=AIzaSyCpOS0fLi4JISp3kekVBcJGvzkXvgM1KZw&libraries=places&callback=initMap';
const GOOGLE_MAPS_COMMON_URL = 'https://maps.googleapis.com/maps-api-v3/api/js/33/6a/common.js';
const GOOGLE_MAPS_UTIL_URL = 'https://maps.googleapis.com/maps-api-v3/api/js/33/6a/util.js';
const GOOGLE_MAPS_MAP_URL = 'https://maps.googleapis.com/maps-api-v3/api/js/33/6a/map.js';

var allCaches = [staticCacheName, mapCacheName];


  self.addEventListener('install', function(event) {
    event.waitUntil(
      caches.open(staticCacheName).then(function(cache) {

        return cache.addAll([
          'sw.js',
          '/index.html',
          'restaurant.html',
          'dist/js/dbhelper.js',
          'dist/js/idb.js',
          'dist/js/main.js',
          'dist/js/restaurant_info.js',
          'dist/js/vendor/idb.js',
          'css/breakpoints.css',
          'css/styles.css',
          
          '',
          ''
        ])/* .then(function(){
          return caches.open('OpaqueCache').then(function(opaqueCache) {
            fetch(GOOGLE_MAPS_URL, {mode:'no-cors'}).then(function(response) {
                return opaqueCache.put(GOOGLE_MAPS_URL, response);
            });
            fetch(GOOGLE_MAPS_COMMON_URL, {mode:'no-cors'}).then(function(response) {
              return opaqueCache.put(GOOGLE_MAPS_COMMON_URL, response);
            });
            fetch(GOOGLE_MAPS_UTIL_URL, {mode:'no-cors'}).then(function(response) {
              return opaqueCache.put(GOOGLE_MAPS_UTIL_URL, response);
            });
            fetch(GOOGLE_MAPS_MAP_URL, {mode:'no-cors'}).then(function(response) {
              return opaqueCache.put(GOOGLE_MAPS_MAP_URL, response);
            });            
          });     
        })*/
      })
    );
  });

  self.addEventListener('activate', function(event) {
    event.waitUntil(
      caches.keys().then(function(cacheNames) {
        return Promise.all(
          cacheNames.filter(function(cacheName) {
            return cacheName.startsWith('mws-') &&
                   !allCaches.includes(cacheName);
          }).map(function(cacheName) {
            return caches.delete(cacheName);
          })
        );
      })
    );
  });

self.addEventListener('fetch', function(event) {
    var requestUrl = new URL(event.request.url);
  
    if (requestUrl.origin === location.origin) {
      if (requestUrl.pathname === '/') {
        event.respondWith(caches.match('index.html'));
        return;
      }
      //TODO Check if this is really needed
      if (requestUrl.pathname.includes('restaurant.html')) {
        event.respondWith(caches.match('restaurant.html'));
        return;
      } 
    }
  
    event.respondWith(
      caches.match(event.request).then(function(response) {
        return response || fetch(event.request);
      })
    );
  });
  