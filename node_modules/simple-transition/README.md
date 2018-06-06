# simple-transition

A small library for controlling transitions with JavaScript.

## Installation

```shell
npm install --save-dev simple-transition
```

## Usage

```js
var transition = require('simple-transition');
var el = document.querySelector('.whatever');

transition(el, {
  opacity: 0.5
}, 1000, 'ease-in-out').then(function() {
  console.log('done!');
});
```