import './scss/main.scss';
import { initHome } from './js/main';

initHome();
/*
Register the service worker
*/
if ('serviceWorker' in navigator){
    navigator.serviceWorker.register('/js/sw.js', {scope: './js/'})
        .then(registration => {
            console.log("[ServiceWorker] registration completed", registration.scope);
    }).catch(err => {
        console.log("[ServiceWorker] registration failed", err);
    });
} else {
    console.log("[ServiceWorker]  is not supported in this browser");
}
