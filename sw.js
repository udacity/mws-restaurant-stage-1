var staticCacheName='mws-restaurant-v7';
// Service worker install built upon code used for Wittr project
self.addEventListener('install', function(event) {
  // console.log('install');
  event.waitUntil(
    caches.open(staticCacheName).then(function(cache) {
      // console.log('caching all');
      return cache.addAll([
        '/index.html',
        '/restaurant.html',
        '/review.html',
        'js/dbhelper.js',
        'js/idb.js',
        'js/main.js',
        'js/register.js',
        'js/restaurant_info.js',
        'js/review.js',
        'css/styles.css',
        'img/normal-heart.svg',
        'img/favorite-heart.svg'
      ]);
    })
  );
});
//Fetch code build upon code from my Wittr project
self.addEventListener('fetch', function(event) {
  var requestUrl = new URL(event.request.url);
// for now do simple cache of all requests 
// console.log('in fetch for ',requestUrl,'path',requestUrl.pathname);

if (requestUrl.origin === location.origin) {
  // for unspecified offline access redirect to cached index.html
  if (requestUrl.pathname === '/') {
    event.respondWith(caches.match('/index.html'));
    return;
  }
  // return general images from cache or network
  if (requestUrl.pathname.startsWith('/img/')) {
    event.respondWith(servePhoto(event.request));
    return;
  }

  // restaurant detail pages 
  if (requestUrl.pathname.startsWith('/restaurant.html')) {
    event.respondWith(serveDetails(event.request));
    return;
  }
}
//any other pages check cache & fetch if needed
event.respondWith(
  caches.open(staticCacheName).then(function(cache) {
    //ignore search so we match to base page regardless of restaurant viewing (such as review.html?restaurant_id=3)
    return cache.match(event.request,{ignoreSearch: true}).then(function (response) {
      if (response) {
        // console.log('found match returning',event.request);
        return response;
      }
      // console.log('no match doing a fetch',event.request);
      return fetch(event.request);
    });

    }).catch(function(e) {
       console.log('fetch promise failed for ',e);
    })
  );
});


// copied/adapted from my wittr project code
function servePhoto(request) {
  // console.log('main img url',request.url);
  var storageUrl = request.url.replace(/-\-sm|-med|-lg\.jpg$/, '');
  // console.log('storage url',storageUrl);
  return caches.open(staticCacheName).then(function(cache) {
    return cache.match(storageUrl).then(function(response) {
      if (response) return response;

      return fetch(request).then(function(networkResponse) {
        cache.put(storageUrl, networkResponse.clone());
        return networkResponse;
      });
    });
  });
}

// copied/adapted from my wittr project code
function serveDetails(request) {
  // console.log('main detail url',request.url);

  return caches.open(staticCacheName).then(function(cache) {
    //ignore search so we match to base page regardless of restaurant viewing
    return cache.match(request.url, {ignoreSearch: true}).then(function(response) {
      if (response) return response;

      return fetch(request).then(function(networkResponse) {
        cache.put(request.url, networkResponse.clone());
        return networkResponse;
      });
    });
  });
}
