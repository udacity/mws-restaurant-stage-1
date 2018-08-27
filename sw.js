self.addEventListener('fetch' , function(event){
    event.respondWith(
        caches.match(event.request).then(function(response){
            return response || 
            caches.open('c1').then(function(cache){
                cache.add(event.request.url);
                return fetch(event.request);                
            }).catch(function(err){
                console.log(err);
            });             
        })
    );  
})
