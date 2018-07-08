// function registerServiceWorker() {
//     if (!('serviceWorker' in navigator)) {
//       console.log('This browser does not support Service Workers');
//       return false;
//     }
//     navigator.serviceWorker.register('sw.js')
//       .then((registration) => {
//         console.log(`ServiceWorker successfully registered: ${registration.scope}`);
//       })
//       .catch((err) => console.log(`ServiceWorker failed to register: ${err}`));
//   }
  
//   function getServiceWorkerController() {
//     if (!('serviceWorker' in navigator)) {
//       console.log('This browser does not support Service Workers');
//       return false;
//     }
//     const controller = navigator.serviceWorker.controller;
//     if (!controller) {
//       console.log('No Service Worker controller found!');
//     }
//     console.log(`Currently controlled by ${controller}`);
//   }
  
//   /**
//    * At load of the website, register our service worker
//    * and tell the user which Service worker Controller is running. 
//    */
//   window.addEventListener('load', () => {
//       registerServiceWorker();
//       getServiceWorkerController();
//   })
  