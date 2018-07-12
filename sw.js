/**
 * Service Worker configurations
 */

const APP_VERSION = 'v1';
var staticCacheName = `mws-static-${APP_VERSION}`;
var externalCacheName = `mws-external-${APP_VERSION}`;
var imagesCacheName = `mws-images-${APP_VERSION}`;

const GOOGLE_MAPS_URL = 'https://maps.googleapis.com/maps/api/js?key=AIzaSyCpOS0fLi4JISp3kekVBcJGvzkXvgM1KZw&libraries=places&callback=initMap';
const GOOGLE_MAPS_COMMON_URL = 'https://maps.googleapis.com/maps-api-v3/api/js/33/6a/common.js';
const GOOGLE_MAPS_UTIL_URL = 'https://maps.googleapis.com/maps-api-v3/api/js/33/6a/util.js';
const GOOGLE_MAPS_MAP_URL = 'https://maps.googleapis.com/maps-api-v3/api/js/33/6a/map.js';

var allCaches = [staticCacheName, externalCacheName, imagesCacheName];


  self.addEventListener('install', function(event) {
    event.waitUntil(
      caches.open(staticCacheName).then(function(cache) {
        return cache.addAll([
          'sw.js',
          'index.html',
          'restaurant.html',
          'dist/js/dbhelper.js',
          'dist/js/idb.js',
          'dist/js/main.js',
          'dist/js/restaurant_info.js',
          'dist/js/vendor/idb.js',
          'dist/css/breakpoints.css',
          'dist/css/styles.css'
        ])
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

    //Always serve local content from cache
    if (requestUrl.origin === location.origin) {      
      if (requestUrl.pathname === '/') {
        event.respondWith(caches.match('index.html'));
        return;
      }
      if (requestUrl.pathname.includes('restaurant.html')) {
        event.respondWith(caches.match('restaurant.html'));
        return;
      }
      if (requestUrl.pathname.includes('.jpg') || requestUrl.pathname.includes('.png')) {
        //for images, first check the cache
        caches.match(requestUrl).then(function(response) {
          if (response) {
            return response;
          }
          else {
            return fetch(requestUrl).then(function(response) {
              return caches.open(imagesCacheName).then(function(cache) {                
                let clonedResponse = response.clone();
                cache.put(requestUrl, clonedResponse);                
                return response;
              });
            });
          }
        })        
      }
      event.respondWith(
        caches.match(requestUrl).then(function(response) {
          return response || fetch(requestUrl);
        })
      );
    } else {
      let requestHeader = {};
      if (requestUrl.host === 'maps.googleapis.com' || requestUrl.host === 'maps.gstatic.com') {
        requestHeader.mode = 'no-cors';
      }

      event.respondWith(

        //Try to serve external content from the web, if it fails, try the cache
        fetch(requestUrl, requestHeader).then(function(response) {
          //if successful fetch, save a copy in the cache
          return caches.open(externalCacheName).then(function(cache) {
              let clonedResponse = response.clone();
              cache.put(requestUrl, clonedResponse);                
              return response;
            });
        }).catch(function(response) {
          console.log('error fetching from server.', response);
          return caches.match(requestUrl).then(function(response) {
            console.log('fetching from cache')
            return response;
          });           
        })
      );
    }
  });
  