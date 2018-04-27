/*!
 * modify-event | MIT (c) Shinnosuke Watanabe
 * https://github.com/shinnn/modify-event
*/
'use strict';

var util = require('util');

module.exports = function modifyEvent(eventEmitter, targetEventName, fn) {
  if (!eventEmitter || typeof eventEmitter.emit !== 'function') {
    throw new TypeError(
      util.inspect(eventEmitter) +
      ' doesn\'t have "emit" method.' +
      ' The first argument to modify-event must be an instance of EventEmitter' +
      ' or its inheritance.'
    );
  }

  if (typeof targetEventName !== 'string') {
    throw new TypeError(
      util.inspect(targetEventName) +
      ' is not a string. The second argument to modify-event must be an event name.'
    );
  }

  if (typeof fn !== 'function') {
    throw new TypeError(
      util.inspect(fn) +
      ' is not a function. The third argument to modify-event must be a function.'
    );
  }

  var originalEmit = eventEmitter.emit.bind(eventEmitter);

  eventEmitter.emit = function modifiedEmit(eventName, val) {
    if (eventName === targetEventName) {
      val = fn(val);
    }

    return originalEmit(eventName, val);
  };

  return eventEmitter;
};
