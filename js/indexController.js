if (navigator.serviceWorker) {
    navigator.serviceWorker.register('/sw.js').then(function(reg) {
        console.log('Worket registered!');
    }).catch(function(err) {
        console.log(err);
    });

}