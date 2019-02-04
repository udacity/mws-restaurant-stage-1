//console.log('ServiceWorker:Registered');

const appName ='Restaurant-Reviews';
const staticCacheName = appName + '-v1.0';

//Aspects of code used from Lesson 13:"Introducing the Service Worker" in Udacity Classroom
//Also utilized concepts from "A Walkthrough by Alexandro Perez" at https://alexandroperez.github.io/mws-walkthrough/?1.23.registering-service-worker-and-caching-static-assets
self.addEventListener('install', function(event){
        
    event.waitUntil(
        caches.open(staticCacheName).then(function(cache){
            
        return cache.addAll([
                              //Utilized concept from Matthew Cranford's Restaurant Review App
        '/',
        'css/styles.css',
        'data/restaurants.json',
        'js/dbhelper.js',
        'js/index.js',
        'js/main.js',
        'js/restaurant_info.js',
        '/restaurant.html',
        '/img/2.jpg',
        '/img/3.jpg',
        '/img/4.jpg',
        '/img/5.jpg',
        '/img/6.jpg',
        '/img/7.jpg',
        '/img/.jpg',
        '/img/9.jpg',
        '/img/10.jpg'

            ]);    

        }) 
    );
});

////Structure of code used from Lesson 13:"Introducing the Service Worker" in Udacity Classroom
self.addEventListener('activate', function(event) {
    event.waitUntil(
      caches.keys().then(function(cacheNames) {
        return Promise.all(
          cacheNames.filter(function(cacheName) {
            return cacheName.startsWith(appName) &&
                   cacheName != staticCacheName;
          }).map(function(cacheName) {
            return caches.delete(cacheName);
          })
        );
      })
    );
  });

////Structure of code used from Lesson 13:"Introducing the Service Worker" in Udacity Classroom
  self.addEventListener('fetch', function(event) {
    event.respondWith(
      caches.match(event.request).then(function(response) {
        return response || fetch(event.request);
      })
    );
  });
  
  
  //References Include Udacity Classroom: Lesseon 13: Introducing the Service Worker, Matthew Cranford's Walkthrough at https://matthewcranford.com/category/blog-posts/walkthrough/restaurant-reviews-app/, and A Walkthrough by Alexandro Perez at https://alexandroperez.github.io/mws-walkthrough/?1.15.responsive-images
