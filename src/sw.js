const cacheVersion = 'mws-restaurant-stage1-v5';
const filesToCache = [
    '/',
    '/restaurant.html',
    '/js/details.js',
    '/js/main.js',
    '/styles/main.css',
    '/data/restaurants.json',
    '/img/1.jpg',
    '/img/2.jpg',
    '/img/3.jpg',
    '/img/4.jpg',
    '/img/5.jpg',
    '/img/6.jpg',
    '/img/7.jpg',
    '/img/8.jpg',
    '/img/9.jpg',
    '/img/10.jpg',
    '/img/1.webp',
    '/img/2.webp',
    '/img/3.webp',
    '/img/4.webp',
    '/img/5.webp',
    '/img/6.webp',
    '/img/7.webp',
    '/img/8.webp',
    '/img/9.webp',
    '/img/10.webp',

    '/img/1-medium.jpg',
    '/img/2-medium.jpg',
    '/img/3-medium.jpg',
    '/img/4-medium.jpg',
    '/img/5-medium.jpg',
    '/img/6-medium.jpg',
    '/img/7-medium.jpg',
    '/img/8-medium.jpg',
    '/img/9-medium.jpg',
    '/img/10-medium.jpg',
    '/img/1-medium.webp',
    '/img/2-medium.webp',
    '/img/3-medium.webp',
    '/img/4-medium.webp',
    '/img/5-medium.webp',
    '/img/6-medium.webp',
    '/img/7-medium.webp',
    '/img/8-medium.webp',
    '/img/9-medium.webp',
    '/img/10-medium.webp',

    '/img/1-large.jpg',
    '/img/2-large.jpg',
    '/img/3-large.jpg',
    '/img/4-large.jpg',
    '/img/5-large.jpg',
    '/img/6-large.jpg',
    '/img/7-large.jpg',
    '/img/8-large.jpg',
    '/img/9-large.jpg',
    '/img/10-large.jpg',
    '/img/1-large.webp',
    '/img/2-large.webp',
    '/img/3-large.webp',
    '/img/4-large.webp',
    '/img/5-large.webp',
    '/img/6-large.webp',
    '/img/7-large.webp',
    '/img/8-large.webp',
    '/img/9-large.webp',
    '/img/10-large.webp',
];

/**
 * Installing Service Worker
 */
self.addEventListener('install', event => {
    console.log('[ServiceWorker] Installed version', cacheVersion);
    event.waitUntil(precache());
});

/**
 * @returns {Promise<void>}
 */
function precache() {
    return caches.open(cacheVersion)
        .then(cache => cache.addAll(filesToCache));
}

/**
 * Activating Service Worker
 * `onactivate` is usually called after a worker was installed and the page
 * got refreshed.
 */
self.addEventListener('activate', event => {
    console.log('[ServiceWorker] activate:', event);
   listAllClients(self);
    event.waitUntil(
        // Delete old cache entries that don't match the current version.
        caches.keys()
            .then(cacheNames => deleteOldCaches(cacheNames))
            .then(() => claimClient())
    );
});

/**
 * @param target
 */
function listAllClients(target) {
    // Just for debugging, list all controlled clients.
    target.clients.matchAll({
        includeUncontrolled: true
    }).then(clientList => {
        let urls = clientList.map(client => client.url);
        console.log('[ServiceWorker] Matching clients:', urls.join(', '));
    });
}

/**
 *
 * @param cacheNames
 * @returns {Promise<[any , any , any , any , any , any , any , any , any , any]>}
 */
function deleteOldCaches(cacheNames) {
    return Promise.all(
        cacheNames.map(cacheName => {
            if (cacheName !== cacheVersion) {
                console.log('[ServiceWorker] Deleting old cache:', cacheName);
                return caches.delete(cacheName);
            }
        })
    );
}

/**
 * `claim()` sets this worker as the active worker for all clients that
 * match the workers scope and triggers an `oncontrollerchange` event for
 * the clients.
 * @returns {Promise<void>}
 */
function claimClient(){
    console.log('[ServiceWorker] Claiming clients for version', cacheVersion);
    return self.clients.claim();
}

/**
 * Fetching Request
 */
self.addEventListener('fetch', event => {
    console.log('[ServiceWorker] fetch:', event.request.url);
    event.respondWith(fromCache(evt.request));
});

/**
 * @param request
 * @returns {Promise<Response>}
 */
function fromCache(request) {
    return caches.open(cacheVersion)
        .then(cache => cache.match(request)
                .then(matching => matching || fetch(request)));
}
