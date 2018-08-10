# modify-error-event

[![NPM version](https://img.shields.io/npm/v/modify-error-event.svg)](https://www.npmjs.com/package/modify-error-event)
[![Build Status](https://travis-ci.org/shinnn/modify-error-event.svg?branch=master)](https://travis-ci.org/shinnn/modify-error-event)
[![Build status](https://ci.appveyor.com/api/projects/status/s8nn7eflwuqml299?svg=true)](https://ci.appveyor.com/project/ShinnosukeWatanabe/modify-error-event)
[![Coverage Status](https://img.shields.io/coveralls/shinnn/modify-error-event.svg)](https://coveralls.io/r/shinnn/modify-error-event)
[![Dependency Status](https://img.shields.io/david/shinnn/modify-error-event.svg?label=deps)](https://david-dm.org/shinnn/modify-error-event)
[![devDependency Status](https://img.shields.io/david/dev/shinnn/modify-error-event.svg?label=devDeps)](https://david-dm.org/shinnn/modify-error-event#info=devDependencies)

Modify the value of the specific object's `error` [event](https://nodejs.org/api/events.html)

```javascript
var EventEmitter = require('events').EventEmitter;
var modifyErrorEvent = require('modify-error-event');

var emitter = new EventEmitter();

modifyErrorEvent(emitter, function(err) {
  err.message = 'bar';
  return err;
});

emitter.on('error', function(err) {
  err.message; //=> 'bar'
});

emitter.emit('error', new Error('foo'));
```

## Installation

[Use npm.](https://docs.npmjs.com/cli/install)

```
npm install modify-error-event
```

## API

```javascript
var modifyErrorEvent = require('modify-error-event');
```

### modifyErrorEvent(*eventEmitter*, *modifier*)

*eventEmitter*: `Object` (an instance of [`EventEmitter`](https://nodejs.org/api/events.html#events_class_events_eventemitter) or its inheritance e.g. [`Stream`](https://nodejs.org/api/stream.html#stream_stream))  
*modifier*: `Function`  
Return: `Object` (Same as the first argument)

It changes the first argument of the `error` event listeners in response to the return value of the *modifier* function.

```javascript
var EventEmitter = require('events').EventEmitter;
var modifyErrorEvent = require('modify-error-event');

var emitter = new EventEmitter();

modifyErrorEvent(emitter, function(err) {
  err.message += 'b';
  return err;
});

modifyErrorEvent(emitter, function(val) {
  err.message += 'c';
  return err;
});

emitter
.on('error', listener)
.emit('error', new Error('a'));

function listener(err) {
  err.message; //=> 'abc'
}
```

## License

Copyright (c) 2015 [Shinnosuke Watanabe](https://github.com/shinnn)

Licensed under [the MIT License](./LICENSE).
