if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        navigator.serviceWorker.register('/sw.js', {scope: '/'}).then(function(registration) {
            // Registration was successful
            if(registration.installing) {
                console.log('Service worker installing');
            } else if(registration.waiting) {
                console.log('Service worker installed');
            } else if(registration.active) {
                console.log('Service worker active');
            }
            console.log('ServiceWorker registration successful with scope: ', registration.scope);
        }, function(err) {
            // registration failed :(
            console.log('ServiceWorker registration failed: ', err);
        });
    });
}
