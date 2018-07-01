if (navigator.serviceWorker) {
  navigator.serviceWorker.register('sw.js')
    .then(() => {
      navigator.serviceWorker.addEventListener('message', message => {
        message.data.action === 'send-reviews' &&
          DBHelper.sendStoredReviews()
      })
    })
}
