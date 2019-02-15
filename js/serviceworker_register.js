

/*check if the browser supports service workers.*/
if ('serviceWorker' in navigator) {
	
	/*Register a service worker*/
	navigator.serviceWorker.register('./serviceWorker.js')
	.then(function() {
		console.log('Successfully registered');
	})
	.catch(function() {
		console.log('Failed to register');
	});
}gi