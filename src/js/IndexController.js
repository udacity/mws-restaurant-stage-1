
/**
 *  @wip
 *  CURRENTLY NOT IN USE
 * */
export default function IndexController(container) {
    this._container = container;
    this._registerServiceWorker();
    let indexController = this;
}

IndexController.prototype._registerServiceWorker = function () {
    console.log('_registerServiceWorker1');

    if (!navigator.serviceWorker || !navigator.serviceWorker.register) {
        console.log("This browser doesn't support service workers");
        return;
    }

    let indexController = this;

    console.log('_registerServiceWorker2');
    navigator.serviceWorker.register('http://localhost:8000/js/sw.js').then(function (reg) {
        console.log('_registerServiceWorker31: ', reg);
        console.log('_registerServiceWorker32: ', navigator.serviceWorker);
        if (!navigator.serviceWorker.controller) {
            console.log('_registerServiceWorker4');
            return;
        }

        console.log('_registerServiceWorker5');
        if (reg.waiting) {
            console.log('_registerServiceWorker-waiting');
            indexController._updateReady(reg.waiting);
            return;
        }
        if (reg.installing) {
            console.log('_registerServiceWorker-installing');
            indexController._trackInstalling(reg.installing);
            return;
        }

        console.log('_registerServiceWorker-updatefound');
        reg.addEventListener('updatefound', function () {
            indexController._trackInstalling(reg.installing);
        });
    }).catch(function(error) {
        console.log("Service worker registration failed: " + error.message);
    });

    // Ensure refresh is only called once.
    // This works around a bug in "force update on reload".
    let refreshing;
    navigator.serviceWorker.addEventListener('controllerchange', function () {
        if (refreshing) return;
        window.location.reload();
        refreshing = true;
    });
};

IndexController.prototype._updateReady = function (worker) {
    console.log('Worker._updateReady: ', worker);
};

IndexController.prototype._trackInstalling = function (worker) {
    console.log('Worker._trackInstalling: ', worker);
    let indexController = this;
    worker.addEventListener('statechange', function () {
        if (worker.state === 'installed') {
            indexController._updateReady(worker);
        }
    });
};