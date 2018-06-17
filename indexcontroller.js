IndexCOntroller.prototype._registerServiceWorker = function() {
    if ( !navigator.serviceWorker ) return;

    navigation.serviceWorker.register( '/sw.js' ).then( function() {
        console.log( )
    })
}