const appName ='Restaurant-Reviews';


//Aspects of code used from Lesson 13:"Introducing the Service Worker" in Udacity Classroom
//Also utilized concepts from "A Walkthrough by Alexandro Perez" at https://alexandroperez.github.io/mws-walkthrough/?1.23.registering-service-worker-and-caching-static-assets
self.addEventListener('install', function(event){
        
    event.waitUntil(caches.open(appName).then(function(cache){
        console.log('Caches found');    
         cache.addAll([
                              //Utilized concept from Matthew Cranford's Restaurant Review App
        '/',
        'css/styles.css',
        'data/restaurants.json',
        'js/dbhelper.js',
        'js/index.js',
        'js/main.js',
        'js/restaurant_info.js',
        '/restaurant.html',
        '/register-sw.js',
        '/index.html',
        '/img/2.jpg',
        '/img/3.jpg',
        '/img/4.jpg',
        '/img/5.jpg',
        '/img/6.jpg',
        '/img/7.jpg',
        '/img/.jpg',
        '/img/9.jpg',
        '/img/10.jpg',
        'https://unpkg.com/leaflet@1.3.1/dist/leaflet.css',
        'https://unpkg.com/leaflet@1.3.1/dist/leaflet.js',

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
                   cacheName != appName;
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
        if (response){
          console.log('Found', event.request, 'in cache');
          return response;
        } 
      fetchRequest(event)

          })
    )
  });


    function fetchRequest(event){
    var requestClone = event.request.clone();
    return fetch(requestClone).then(function(res){
        //if not a valid response send the error
        if(!res || res.status !== 200 || res.type !== 'basic'){
            return res;
        }

        var response = res.clone();

        caches.open(appName).then(function(cache){
            cache.put(event.request, response);
        });

        return res;
    })
}
  
        
  
  
  //References Include Udacity Classroom: Lesseon 13: Introducing the Service Worker, Matthew Cranford's Walkthrough at https://matthewcranford.com/category/blog-posts/walkthrough/restaurant-reviews-app/, and A Walkthrough by Alexandro Perez at https://alexandroperez.github.io/mws-walkthrough/?1.15.responsive-images
