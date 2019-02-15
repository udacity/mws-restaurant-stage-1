if ('serviceWorker' in navigator) {
	navigator.serviceWorker.register('./serviceWorker.js')
	.then(function() {
		console.log('Successfully registered');
	})
	.catch(function() {
		console.log('Failed to register');
	});
}gi