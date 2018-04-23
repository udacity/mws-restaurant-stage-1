/*!
 * modify-error-event | MIT (c) Shinnosuke Watanabe
 * https://github.com/shinnn/modify-error-event
*/
'use strict';

var modifyEvent = require('modify-event');

module.exports = function modifyErrorEvent(eventEmitter, fn) {
  return modifyEvent(eventEmitter, 'error', fn);
};
