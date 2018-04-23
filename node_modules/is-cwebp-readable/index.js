'use strict';

var fileType = require('file-type');

module.exports = function isCwebpReadable(buf) {
  var type = fileType(buf);

  if (!type) {
    return false;
  }

  var ext = type.ext;

  return ext === 'png' || ext === 'jpg' || ext === 'tif' || ext === 'webp';
};
