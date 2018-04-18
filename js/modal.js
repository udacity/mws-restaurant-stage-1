// store the last thing focused so you can return there
let focusedElementBeforeModal;

// get a reference to the modal on the page
let modal = document.querySelector('.modal');
let updateInstallButton = document.querySelector('.update-dialog .install-update');
let updateDismissButton = document.querySelector('.update-dialog .dismiss-update');

const openModal = ()=>{
    
  // function to handle the tab key inside the modal
  const trapTabKey = (e)=>{
    if(e.keyCode === 9){ // if tab pressed
      if(e.shiftKey){ // if shift is reversing the direction
        if(document.activeElement === firstTabStop){ // if on the first element
          e.preventDefault(); // stop the normal operation
          lastTabStop.focus(); // focus the last thing in modal instead
        }
      }else{
        if(document.activeElement === lastTabStop){
            e.preventDefault(); // stop normal operation
            firstTabStop.focus();
        }
      }
    }

    if(e.keyCode === 27){ // listen for the escape key
      closeModal()
    }
  }

  // show the modal and overlay
  modal.classList.add('active');
  modal.setAttribute('aria-hidden', false);
  updateInstallButton.setAttribute('tabindex',0);
  updateDismissButton.setAttribute('tabindex',0);


  const focusableElementsString = `a[href], area[href], input:not([disabled]), select:not([disabled])
  textarea:not([disabled]), button:not([disabled]), iframe, object, embed, [tabindex="0"], [contenteditable]`;

  let focusableElements = modal.querySelectorAll(focusableElementsString);
  
  // convert nodeList to array
  focusableElements = Array.prototype.slice.call(focusableElements);

  let firstTabStop = focusableElements[0];
  let lastTabStop = focusableElements[focusableElements.length -1];

  
  // store the last focused thing
  focusedElementBeforeModal = document.activeElement;

  // focus the first tab stop
  firstTabStop.focus();

  // listen for tabbing inside the modal
  modal.addEventListener('keydown', trapTabKey);
}



const closeModal = ()=>{
    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', true);
    focusedElementBeforeModal.focus();
    
    updateInstallButton.setAttribute('tabindex',-1);
    updateDismissButton.setAttribute('tabindex',-1);
}

updateInstallButton.addEventListener('click',()=>{
    serviceWorkerHelper.workerSkipWaiting();
});

updateDismissButton.addEventListener('click',()=>{
    closeModal();
});