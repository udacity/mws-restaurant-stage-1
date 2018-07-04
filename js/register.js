if (navigator.serviceWorker) {
    navigator.serviceWorker.register(`/sw.js`)
        .then(reg => {
            console.log(`Registration ok: ${reg.scope}`);
        })
        .catch(error => {
            console.log(`Registration failed: ${error}`);
        });
}