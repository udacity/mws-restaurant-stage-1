var imagemagick = require('../index'),
	path = require('path'),
	image = path.normalize(__dirname + '/img.jpg');

imagemagick.identify(image, function(err, res){
	console.log(err);
	console.log(res);
});
