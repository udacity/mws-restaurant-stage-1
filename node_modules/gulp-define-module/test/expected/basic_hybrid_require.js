(function(definition) { if (typeof exports === 'object') { module.exports = definition(require("library")); } else if (typeof define === 'function' && define.amd) { define(["library"], definition); } else { definition(Library); } })(function(Library) { return function() {
  // this is a module definition file that includes this single module.
  this.property = "some property";
}; });