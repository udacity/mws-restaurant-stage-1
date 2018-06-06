var sys = require('sys'),
    fs = require('fs'),
    im = require('../index.js'),
	path = require('path'),
	srcPath = path.normalize(__dirname + '/img.jpg'),
	dstPath = path.normalize(__dirname + '/cropped.jpg'),
	timeStarted = new Date();

im.crop({
  srcPath: srcPath,
  dstPath: dstPath,
  width: 2000,
  height: 900,
  quality: 1
}, function(err, stdout, stderr){
  if (err) return sys.error(err.stack || err);
  
  sys.puts('real time taken for convert: ' + (new Date() - timeStarted) + ' ms')
  
  im.identify(['-format', '%b', dstPath], function(err, r){
    if (err) throw err;
    sys.puts('size: ' + r.substr(0, r.length-2) + ' Bytes');
  })
})
