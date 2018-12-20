const registerServiceWorker = () => {
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("./../sw.js").then(
        registration => {
          // Registration was successful
          console.log(
            "ServiceWorker registration successful with scope: ",
            registration.scope
          );
          if (!navigator.serviceWorker.controller) {
            return;
          }

          if (reg.waiting) {
            _updateReady(reg.waiting);
            return;
          }

          if (reg.installing) {
            _trackInstalling(reg.installing);
            return;
          }

          reg.addEventListener("updatefound", function() {
            _trackInstalling(reg.installing);
          });
        },
        err => {
          // registration failed :(
          console.log("ServiceWorker registration failed: ", err);
        }
      );
    });

    let refreshing;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (refreshing) return;
      window.location.reload();
      refreshing = true;
    });
  } else {
    console.log("Service Worker is not supported by browser.");
  }
};

const _trackInstalling = worker => {
  worker.addEventListener("statechange", () => {
    if (worker.state == "installed") {
      _updateReady(worker);
    }
  });
};

const _updateReady = worker => {
  let newWorker;
  const notification = document.getElementById("notification");
  notification.className = "show";
  // The click event on the pop up notification
  document.getElementById("reload").addEventListener("click", () => {
    worker.postMessage({ action: "skipWaiting" });
  });
};
registerServiceWorker();
IndexController();
