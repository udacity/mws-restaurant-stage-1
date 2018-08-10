(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
var CACHE_NAME = 'my-restaurant-cache-v1';
var urlsToCache = ['/', 'js/dbhelper.js', 'js/main.js', 'js/restaurant_info.js', 'css/styles.css', 'img/1.jpg', 'img/2.jpg', 'img/3.jpg', 'img/4.jpg', 'img/5.jpg', 'img/6.jpg', 'img/7.jpg', 'img/8.jpg', 'img/9.jpg', 'img/10.jpg'];

self.addEventListener('install', function (event) {
  // Perform install steps
  event.waitUntil(caches.open(CACHE_NAME).then(function (cache) {
    console.log('Opened cache');
    return cache.addAll(urlsToCache);
  }));
});

self.addEventListener('fetch', function (event) {
  event.respondWith(caches.match(event.request).then(function (response) {
    if (response) return response;
    return fetch(event.request);
  }));
});

},{}]},{},[1])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJhcHAvc3cuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQSxJQUFJLGFBQWEsd0JBQWpCO0FBQ0EsSUFBSSxjQUFjLENBQ2hCLEdBRGdCLEVBRWhCLGdCQUZnQixFQUdoQixZQUhnQixFQUloQix1QkFKZ0IsRUFLaEIsZ0JBTGdCLEVBTWhCLFdBTmdCLEVBT2hCLFdBUGdCLEVBUWhCLFdBUmdCLEVBU2hCLFdBVGdCLEVBVWhCLFdBVmdCLEVBV2hCLFdBWGdCLEVBWWhCLFdBWmdCLEVBYWhCLFdBYmdCLEVBY2hCLFdBZGdCLEVBZWhCLFlBZmdCLENBQWxCOztBQWtCQSxLQUFLLGdCQUFMLENBQXNCLFNBQXRCLEVBQWlDLFVBQVMsS0FBVCxFQUFnQjtBQUMvQztBQUNBLFFBQU0sU0FBTixDQUNFLE9BQU8sSUFBUCxDQUFZLFVBQVosRUFDRyxJQURILENBQ1EsVUFBUyxLQUFULEVBQWdCO0FBQ3BCLFlBQVEsR0FBUixDQUFZLGNBQVo7QUFDQSxXQUFPLE1BQU0sTUFBTixDQUFhLFdBQWIsQ0FBUDtBQUNELEdBSkgsQ0FERjtBQU9ELENBVEQ7O0FBV0EsS0FBSyxnQkFBTCxDQUFzQixPQUF0QixFQUErQixVQUFTLEtBQVQsRUFBZ0I7QUFDN0MsUUFBTSxXQUFOLENBQ0UsT0FBTyxLQUFQLENBQWEsTUFBTSxPQUFuQixFQUNHLElBREgsQ0FDUSxVQUFTLFFBQVQsRUFBbUI7QUFDdkIsUUFBSSxRQUFKLEVBQWMsT0FBTyxRQUFQO0FBQ2QsV0FBTyxNQUFNLE1BQU0sT0FBWixDQUFQO0FBQ0QsR0FKSCxDQURGO0FBT0QsQ0FSRCIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uKCl7ZnVuY3Rpb24gcihlLG4sdCl7ZnVuY3Rpb24gbyhpLGYpe2lmKCFuW2ldKXtpZighZVtpXSl7dmFyIGM9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZTtpZighZiYmYylyZXR1cm4gYyhpLCEwKTtpZih1KXJldHVybiB1KGksITApO3ZhciBhPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIraStcIidcIik7dGhyb3cgYS5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGF9dmFyIHA9bltpXT17ZXhwb3J0czp7fX07ZVtpXVswXS5jYWxsKHAuZXhwb3J0cyxmdW5jdGlvbihyKXt2YXIgbj1lW2ldWzFdW3JdO3JldHVybiBvKG58fHIpfSxwLHAuZXhwb3J0cyxyLGUsbix0KX1yZXR1cm4gbltpXS5leHBvcnRzfWZvcih2YXIgdT1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlLGk9MDtpPHQubGVuZ3RoO2krKylvKHRbaV0pO3JldHVybiBvfXJldHVybiByfSkoKSIsInZhciBDQUNIRV9OQU1FID0gJ215LXJlc3RhdXJhbnQtY2FjaGUtdjEnO1xudmFyIHVybHNUb0NhY2hlID0gW1xuICAnLycsXG4gICdqcy9kYmhlbHBlci5qcycsXG4gICdqcy9tYWluLmpzJyxcbiAgJ2pzL3Jlc3RhdXJhbnRfaW5mby5qcycsXG4gICdjc3Mvc3R5bGVzLmNzcycsXG4gICdpbWcvMS5qcGcnLFxuICAnaW1nLzIuanBnJyxcbiAgJ2ltZy8zLmpwZycsXG4gICdpbWcvNC5qcGcnLFxuICAnaW1nLzUuanBnJyxcbiAgJ2ltZy82LmpwZycsXG4gICdpbWcvNy5qcGcnLFxuICAnaW1nLzguanBnJyxcbiAgJ2ltZy85LmpwZycsXG4gICdpbWcvMTAuanBnJ1xuXTtcblxuc2VsZi5hZGRFdmVudExpc3RlbmVyKCdpbnN0YWxsJywgZnVuY3Rpb24oZXZlbnQpIHtcbiAgLy8gUGVyZm9ybSBpbnN0YWxsIHN0ZXBzXG4gIGV2ZW50LndhaXRVbnRpbChcbiAgICBjYWNoZXMub3BlbihDQUNIRV9OQU1FKVxuICAgICAgLnRoZW4oZnVuY3Rpb24oY2FjaGUpIHtcbiAgICAgICAgY29uc29sZS5sb2coJ09wZW5lZCBjYWNoZScpO1xuICAgICAgICByZXR1cm4gY2FjaGUuYWRkQWxsKHVybHNUb0NhY2hlKTtcbiAgICAgIH0pXG4gICk7XG59KTtcblxuc2VsZi5hZGRFdmVudExpc3RlbmVyKCdmZXRjaCcsIGZ1bmN0aW9uKGV2ZW50KSB7XG4gIGV2ZW50LnJlc3BvbmRXaXRoKFxuICAgIGNhY2hlcy5tYXRjaChldmVudC5yZXF1ZXN0KVxuICAgICAgLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2UpIHtcbiAgICAgICAgaWYgKHJlc3BvbnNlKSByZXR1cm4gcmVzcG9uc2U7XG4gICAgICAgIHJldHVybiBmZXRjaChldmVudC5yZXF1ZXN0KTtcbiAgICAgIH0pXG4gICk7XG59KTtcbiJdfQ==
