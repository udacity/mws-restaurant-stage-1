if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js', {scope: '/'})
    .then(reg => {
      // registration worked
      console.log('Registration succeeded. Scope is ' + reg.scope);
    }).catch(error => {
      // registration failed
      console.log('Registration failed with ' + error);
    });
  }