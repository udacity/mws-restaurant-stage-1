(function(definition) { if (typeof exports === 'object') { module.exports = definition(); } else if (typeof define === 'function' && define.amd) { define([], definition); } else { definition(); } })(function() { return function() {
  // this is a module definition file that includes this single module.
  this.property = "some property";
}; });