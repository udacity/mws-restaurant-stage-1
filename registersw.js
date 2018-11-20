if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').then(function(sw) {
      console.log('registration worked!');
    }).catch(function() {
      console.log('registration failed :(');
    });
}  