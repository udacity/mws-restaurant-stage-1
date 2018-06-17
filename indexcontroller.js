IndexController.prototype._registerServiceWorker = function() {
    if (!navigator.serviceWorker) return;

    var indexController = this;

    navigator.serviceWorker.register('/sw.js').then(function(register) { 
        if (!navigator.serviceWorker.controller) { return; }

        if ( register.waiting ) {
            indexController._updateReady();
            return;
        }

        if ( register.installing ) {
            indexController._trackInstalling( register.installing );
            return;
        }

        register.addEventListener( 'updatefound', function() {
            indexController._trackInstalling( register.installing );
            return;
        });
    });
};

IndexController.prototype._trackInstalling = function(worker) {
    var indexController = this;

    worker.addEventListener( 'statechange', function() {
        if ( worker.state === 'installed' ) {
            indexController._updateReady();
        }
    });
};

IndexController.prototype._updateReady = function(worker) {
    var toast = this._toastsView.show("New version available", {
        buttons: [ 'refresh', 'dismiss']
    });

    toast.answer.then(function(answer) {
        if (answer !== 'refresh') return;
        worker.postMessage({ action: 'skipWaiting' });
    });
};