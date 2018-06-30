'use strict';

var through = require('through');
var path = require('path');
var gutil = require('gulp-util');
var _ = require('lodash');

function makeAMD(moduleContents, filePath, opts) {
  // define(['dependency'], function(Dependency) { return moduleObject; });
  var includes = [];
  var defines = [];
  _.each(opts.require, function(include, define) {
    if (include !== null) {
      includes.push(JSON.stringify(include));
      defines.push(define);
    }
  });

  var moduleName = opts.name ? '"' + opts.name(filePath) + '", ' : '';

  return 'define(' + moduleName + '[' + includes.join(',') + '], ' +
    'function(' + defines.join(',') + ') { return ' + moduleContents + '; });';
}

function makeCommonJS(moduleContents, filePath, opts) {
  // var Dependency = require('dependency');module.exports = moduleObject;
  var requires = _.map(opts.require, function(key, value) {
    if (key !== null) {
      return 'var ' + value + ' = require(' + JSON.stringify(key) + ');';
    }
  });
  return requires.join('') + 'module.exports = ' + moduleContents + ';';
}

function makeHybrid(moduleContents, filePath, opts) {
  // (function(definition) { if (typeof exports === 'object') { module.exports = definition(require('library')); }
  // else if (typeof define === 'function' && define.amd) { define(['library'], definition); } else { definition(Library); }
  // })(function(Library) { return moduleObject; });
  var includes = [];
  var requires = [];
  var defines = [];
  _.each(opts.require, function(include, define) {
    includes.push(JSON.stringify(include));
    requires.push('require(' + JSON.stringify(include) + ')');
    defines.push(define);
  });

  return '(function(definition) { ' +
    'if (typeof exports === \'object\') { module.exports = definition(' + requires.join(',') + '); } ' +
    'else if (typeof define === \'function\' && define.amd) { define([' + includes.join(',') + '], definition); } ' +
    'else { definition(' + defines.join(',') + '); } ' +
    '})(function(' + defines.join(',') + ') { return ' + moduleContents + '; });';
}

function makeEs6(moduleContents, filePath, opts) {
  var requires = _.map(opts.require, function(key, value) {
    if (key !== null) {
      return 'import ' + value + ' from ' + JSON.stringify(key) + ';';
    }
  });
  return requires.join('') + 'export default ' + moduleContents + ';';
}

function makePlain(moduleContents, filePath, opts) {
  // moduleObject;
  return moduleContents + ';';
}

module.exports = function(type, options) {
  return through(function(file) {
    if (file.isNull()) { return this.queue(file); } // pass along
    if (file.isStream()) { return this.emit('error', new gutil.PluginError('gulp-define-module', 'Streaming not supported')); }

    var opts = _.defaults({}, options, file.defineModuleOptions);
    opts.context = _([file.defineModuleOptions, options])
      .filter(_.identity).pluck('context')
      .filter(_.identity).value();
    opts.require = _.merge.apply(null, _([file.defineModuleOptions, options, { require: {} }])
      .filter(_.identity).pluck('require')
      .filter(_.identity).value());

    var contents = file.contents.toString();
    var name = path.basename(file.path, path.extname(file.path));
    var context = {
      name: name,
      file: file,
      contents: contents
    };
    if (opts.wrapper) {
      opts.context.forEach(function(extensions) {
        if (!extensions) { return; }
        if (typeof extensions === 'function') {
          extensions = extensions(context);
        }
        _.merge(context, _(extensions).map(function(value, key) {
          return [key, _.template(value)(context)];
        }).object().value());
      });

      contents = _.template(opts.wrapper)(context);
    }

    if (type === 'amd') { contents = makeAMD(contents, file.path, opts); }
    else if (type === 'commonjs' || type === 'node') { contents = makeCommonJS(contents, file.path, opts); }
    else if (type === 'hybrid') { contents = makeHybrid(contents, file.path, opts); }
    else if (type === 'plain') { contents = makePlain(contents, file.path, opts); }
    else if (type === 'es6') { contents = makeEs6(contents, file.path, opts); }
    else {
      throw new Error('Unsupported module type for gulp-define-module: ' + type);
    }

    file.path = gutil.replaceExtension(file.path, '.js');
    file.contents = new Buffer(contents);
    this.queue(file);
  });
};
