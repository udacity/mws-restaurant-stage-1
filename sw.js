// Copyright 2016 Google Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

var cacheName = 'restaurantData-v1';
var filesToCache = [
    '/',
    'sw.js',
    'js/main.js',
    'js/dbhelper.js',
    'js/restaurant_info.js',
    'data/restaurants.json',
    'css/styles.css',
    'index.html',
    'restaurant.html'
];

self.addEventListener('install', function(event) {
    console.log('Attempting to install sw and cache static assets');
    filesToCache ;
    event.waitUntil(
        caches.open('mws-restaurant-v1').then(function(cache) {
            return cache.addAll(filesToCache);
        })
    );
});

self.addEventListener('fetch', function(event) {
    if (event.request.url.indexOf('restaurant.html') > -1) {
        event.respondWith(caches.match('restaurant.html'));
    }
    else
    event.respondWith(
        caches.match(event.request)
            .then(function(response) {
                if (response) return response;
                return fetch(event.request);
            })
            .catch(function(error) {
                console.error('Error in caches.match');
                console.error(error);
                console.error(event.request);
            })
    );
});

