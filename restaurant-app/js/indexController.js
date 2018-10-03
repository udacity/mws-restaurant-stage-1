if (navigator.serviceWorker) {
    navigator.serviceWorker.register('/sw.js').then(function(reg) {
        console.log('Worker registered!');
        console.log(reg);
    }).catch(function(err) {
        console.log(err);
    });

}