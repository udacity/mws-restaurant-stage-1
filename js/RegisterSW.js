let updateDialog = document.querySelector('.update-dialog');
let updateInstallButton = document.querySelector('.update-dialog .install-update');
let updateDismissButton = document.querySelector('.update-dialog .dismiss-update')

const serviceWorkerHelper = function ServiceWorkerHelper(workerLocation, updateUI, updateTriggerEl, dismissButton){
    if (!navigator.serviceWorker) throw new Error("service worker not supported")
  
    const updateTriggerElement = updateTriggerEl;
  
    // register the service worker
    navigator.serviceWorker.register(workerLocation).then((reg)=>{
        
        // check if service worker loaded the page - if it didn't return (as service worker is the latest)
        if (!navigator.serviceWorker.controller) return
        
        // if there is one waiting - there was a service worker installed on the last refresh and its waiting
        if(reg.waiting){
            updateUI.classList.add('active');

            updateTriggerElement.addEventListener('click', ()=>{ // add click event to the UI
                reg.waiting.postMessage({action: 'skipWaiting'})
            });

            return;
        }
  
        // if there is a service worker installing
        if(reg.installing){
            trackInstalling(reg.installing)
            return;
        }
  
        // listen for future workers installing
        reg.addEventListener('updatefound', ()=>{
            trackInstalling(reg.installing)
        })
  
  
    }).catch((err)=>{
        throw new Error(`Service worker didn't register: ${err.message}`)
    })
  
    // listen for changeover of service worker - reload page if a new one took over
    navigator.serviceWorker.addEventListener('controllerchange', ()=>{
        window.location.reload()
    })
  
  
    // listen to installing service worker && show user when its waiting
    const trackInstalling = (worker)=>{
  
        worker.addEventListener('statechange', ()=>{
            if(worker.state == 'installed'){
  
                updateTriggerElement.addEventListener('click', ()=>{ // add click event to the UI
                    worker.postMessage({action: 'skipWaiting'})
                })
  
                updateUI.classList.add('active')  // show the UI
            }
        })
    }

    dismissButton.addEventListener('click',()=>{
        updateUI.classList.remove('active');
    })
  
}//('./sw.js', updateDialog, updateInstallButton, updateDismissButton);
