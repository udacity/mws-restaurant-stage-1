// app for service worker help sources include https://developers.google.com/web/fundamentals/primers/service-workers/

// if able, register service worker and success message
if ('serviceWorker' in navigator) {
	window.addEventListener('load', () => {
		navigator.serviceWorker.register('/sw.js', {scope: './'}).then((registration) => {
			// successful
			console.log('Service Worker -Registered- With scope: ', registration.scope);
		}, (err) => {
			// registration failed
			console.log('Service Worker -Failed to Register-', err);
		});
	});
}
