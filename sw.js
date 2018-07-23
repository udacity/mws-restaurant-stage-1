importScripts('https://storage.googleapis.com/workbox-cdn/releases/3.0.0/workbox-sw.js');

console.log('this is my custom service worker');

workbox.routing.registerRoute(
    new RegExp('http://localhost:1337/restaurants'),
    workbox.strategies.cacheFirst()
  );

workbox.precaching.precacheAndRoute([
  {
    "url": "app/index.html",
    "revision": "53759c8e6d281da10cec3b970223612a"
  },
  {
    "url": "app/package.json",
    "revision": "978ad496231e35cfb48949289ced285e"
  },
  {
    "url": "app/README.md",
    "revision": "6ff09e6a5d35fc25a3aafcb80bb5b5d9"
  },
  {
    "url": "app/restaurant.html",
    "revision": "adfce529efe44ea428bd6813f3fa33e5"
  },
  {
    "url": "css/styles.css",
    "revision": "d2c57ca5a38bb86e21719c2bb87ec663"
  },
  {
    "url": "data/restaurants.json",
    "revision": "500a3defff288a163f63f80b48025716"
  },
  {
    "url": "img/1-1x.jpg",
    "revision": "ea9783e8e7d65c24b0b18aad30da6e9e"
  },
  {
    "url": "img/1-2x.jpg",
    "revision": "cc074688becddd2725114187fba9471c"
  },
  {
    "url": "img/10-1x.jpg",
    "revision": "08e2d3bd600dc3113f91d1925f62833e"
  },
  {
    "url": "img/10-2x.jpg",
    "revision": "2bd68efbe70c926de6609946e359faa2"
  },
  {
    "url": "img/2-1x.jpg",
    "revision": "245df3c26862dd60ff32981c6dd1a4c0"
  },
  {
    "url": "img/2-2x.jpg",
    "revision": "759b34e9a95647fbea0933207f8fc401"
  },
  {
    "url": "img/3-1x.jpg",
    "revision": "8d662589ff017d63e7087ec4a600f8c2"
  },
  {
    "url": "img/3-2x.jpg",
    "revision": "81ee36a32bcfeea00db09f9e08d56cd8"
  },
  {
    "url": "img/4-1x.jpg",
    "revision": "50c34627d183a429c61014a3329eafeb"
  },
  {
    "url": "img/4-2x.jpg",
    "revision": "23f21d5c53cbd8b0fb2a37af79d0d37f"
  },
  {
    "url": "img/5-1x.jpg",
    "revision": "83cfc7559dc308670790ba3d8d77c2fa"
  },
  {
    "url": "img/5-2x.jpg",
    "revision": "0a166f0f4e10c36882f97327b3835aec"
  },
  {
    "url": "img/6-1x.jpg",
    "revision": "9ccbdd2b5e20027b2a6a2b26eb8d1de6"
  },
  {
    "url": "img/6-2x.jpg",
    "revision": "eaf1fec4ee66e121cadc608435fec72f"
  },
  {
    "url": "img/7-1x.jpg",
    "revision": "f1134263830d888fe55dcf94a34c68e5"
  },
  {
    "url": "img/7-2x.jpg",
    "revision": "bd0ac197c58cf9853dc49b6d1d7581cd"
  },
  {
    "url": "img/8-1x.jpg",
    "revision": "4f0623bd31dc1e37dcef8636e9b01319"
  },
  {
    "url": "img/8-2x.jpg",
    "revision": "6e0e6fb335ba49a4a732591f79000bb4"
  },
  {
    "url": "img/9-1x.jpg",
    "revision": "d4fa7bbc61e3627095b0a60fd94f7e91"
  },
  {
    "url": "img/9-2x.jpg",
    "revision": "ba4260dee2806745957f4ac41a20fa72"
  },
  {
    "url": "index.html",
    "revision": "a0e76e994210051b653ca556e1376d18"
  },
  {
    "url": "js/accessibility_helper.js",
    "revision": "ba1bcc38adc7380a316edca852848c9c"
  },
  {
    "url": "js/common_functions.js",
    "revision": "11bc061504883e82723b27b4849ebeb9"
  },
  {
    "url": "js/dbhelper.js",
    "revision": "057afd1bfbae9c1ba8c618c1dc28f68d"
  },
  {
    "url": "js/main.js",
    "revision": "4096e52c614cec981cf85c960b0069aa"
  },
  {
    "url": "js/register_sw.js",
    "revision": "f8a2ee17c7a00782ae8160439a114e5c"
  },
  {
    "url": "js/restaurant_info.js",
    "revision": "b0cba32afc7e0de3d8bcbfe8cc8791ae"
  },
  {
    "url": "package.json",
    "revision": "978ad496231e35cfb48949289ced285e"
  },
  {
    "url": "README.md",
    "revision": "6ff09e6a5d35fc25a3aafcb80bb5b5d9"
  },
  {
    "url": "restaurant.html",
    "revision": "9d63025665ad12af8c1c296188fbd7c7"
  }
]);

