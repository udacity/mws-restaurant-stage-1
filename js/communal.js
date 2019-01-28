const _registerServiceWorker = () => {
  if (!navigator.serviceWorker) return;

  navigator.serviceWorker.register('/sw.js');
  // TODO: extend service worker
};

_registerServiceWorker();
