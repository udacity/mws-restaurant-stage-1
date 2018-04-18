const serviceWorkerHelper = function ServiceWorkerHelper(workerLocation, openUICallback){
    if (!navigator.serviceWorker) throw new Error("service worker not supported")
  
    let activeWorker;

    // register the service worker
    navigator.serviceWorker.register(workerLocation).then((reg)=>{
        
        // check if service worker loaded the page - if it didn't return (as service worker is the latest)
        if (!navigator.serviceWorker.controller) return
        
        // if there is one waiting - there was a service worker installed on the last refresh and its waiting
        if(reg.waiting){

            activeWorker = reg.waiting
            openUICallback()

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
  
                activeWorker = worker;
                openUICallback()  // show the UI
            }
        })
    }
    
    const workerSkipWaiting = ()=>{
        if(activeWorker == undefined) throw new Error("no active worker")
        return activeWorker.postMessage({action: 'skipWaiting'});
    }

    return {
        workerSkipWaiting
    }
}//('./sw.js', openModal);
