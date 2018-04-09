# gulp-define-module

[![NPM version][npm-image]][npm-url] [![Build status][travis-image]][travis-url] [![Code Climate][codeclimate-image]][codeclimate-url] [![Coverage Status][coverage-image]][coverage-url] [![Dependencies][david-image]][david-url] [![devDependencies][david-dev-image]][david-dev-url]

The gulp define module plugin produces modules from an input source. It allows
[other plugins](https://github.com/wbyoung/gulp-ember-emblem) to offload module definition
to a separate plugin. For consistency, the input source should contain a single JavaScript
expression and should not contain a trailing semicolon.

An example input file to create a callable module:

```javascript
{
  start: function() {},
  end: function() {},
  version: "1.0"
}
```

Transformed to **CommonJS/Node** (`defineModule('commonjs')` or `defineModule('node')`):

```javascript
module.exports = {
  start: function() {},
  end: function() {},
  version: "1.0"
};
```

Transformed to **AMD** (`defineModule('amd')`):

```javascript
define([], function() {
  return {
    start: function() {},
    end: function() {},
    version: "1.0"
  };
});
```

Transformed to **ES6** (`defineModule('es6')`):

```javascript
export default {
  start: function() {},
  end: function() {},
  version: "1.0"
};
```

Transformed to **Hybrid** (`defineModule('hybrid')`):

```javascript
(function(definition) {
  if (typeof exports === 'object') { module.exports = definition(); } // CommonJS
  else if (typeof define === 'function' && define.amd) { define([], definition); } // AMD
  else { definition(); } // Browser
})(function() {
  return {
    start: function() {},
    end: function() {},
    version: "1.0"
  };
});
```

Transformed to **Plain** (`defineModule('plain')`):

```javascript
{
  start: function() {},
  end: function() {},
  version: "1.0"
};
```

To use the module simply include it in your gulp pipeline:

```javascript
var emberEmblem = require('gulp-ember-emblem');
var defineModule = require('gulp-define-module');

gulp.task('templates', function(){
  gulp.src(['client/templates/*.hbs'])
    .pipe(emberEmblem())
    .pipe(defineModule('commonjs'))
    .pipe(gulp.dest('build/templates/'));
});
```


## API

### defineModule(type, [options])

#### type
Type: `String`  
Default: `bare`

The desired output type. One of the following:

* `commonjs` - Produce CommonJS modules
* `node` - Produce Node modules (alias for `commonjs`)
* `amd` - Produce AMD modules
* `es6` - Produce ES6 modules
* `hybrid` - Produce hybrid modules that can be used in most environments
* `plain` - Return an unmolested function definition


#### options.require

Type: `Object`  
Default: `{}`

An object containing dependencies that should be imported for this module. This option is only
supported for `commonjs`, `node`, `amd`, `es6` and `hybrid` modules. For other systems, you will have
to manage the dependency loading in another way.

The property name in the object should be the value of the variable that the
dependency will be accessed from, and the property value should be the name
of the dependency.

For instance, `{ Library: 'library' }` will produce:

**CommonJS/Node**

```javascript
var Library = Library || require('library');

module.exports = {};
```


**AMD**

```javascript
define(['library'], function(Library) {
  return {};
});
```

**ES6**

```javascript
import Library from "library";
```

**Hybrid**

```javascript
(function(definition) {
  if (typeof exports === 'object') { module.exports = definition(require('library')); } // CommonJS
  else if (typeof define === 'function' && define.amd) { define(['library'], definition); } // AMD
  else { definition(Library); } // Browser
})(function(Library) {
  return {};
});
```



#### options.wrapper

Type: `String`  
Default: `false`

Wrapper in which to wrap input modules. This wrapper will be processed
through [lodash.template] with the following context:

[gulp-handlebars], for instance, sets a wrapper of `"Handlebars.template(<%= contents %>)"`.

#### options.context

Type: `Object` or `Function`  
Default: `undefined`

Extend the context that's used to process the wrapper. If you pass an object, it will simply
be merged with the default context.

A function argument should have the signature `function(context) { return {}; }`. The
default context will be passed to your function and you can return new values to add
to the context. For instance, you can create complex definitions on a per-file basis.

```js
defineModule('plain', {
  wrapper: 'MyApp.templates["<%= templateName %>"] = <%= contents %>',
  context: function(context) {
    var file = context.file;
    var name = path.relative(file.cwd, file.path)
      .slice(0, -path.extname(file.path).length)
      .split(path.sep).join('.');
    return { templateName: name };
  }
})
```

This will result in a template file, `app/view.js` with an empty function, `function() {}`, being compiled to
`MyApp.templates["app.view"] = function() {};`.

#### options.name
Type: `Function`  
Default: `undefined`

*This option **only** works with `defineModule('amd',...)` and therefore has no effect on other module types.*

This function receives the file path as argument and should return a
[name for the `amd` module](http://requirejs.org/docs/whyamd.html#namedmodules). For example:

```js
defineModule('amd', {
  name: function(filePath) { return "moduleName"; }
})
```

If no naming function is present, an
[anonymous `amd` module](http://requirejs.org/docs/whyamd.html#definition) will be created.

This can be used with Hogan, for example:

```js
gulp.src('client/templates/**/*.mustache')
  .pipe(hoganCompiler())
  .pipe(rename(function(filePath) { filePath.extname = '.mustache.js' })
  .pipe(defineModule('amd', {
    require: {
      Hogan: 'hogan'
    },
    name: function(filePath) {
      return filePath.split(process.cwd() + '/')[1].replace('.js', '')
    }
  }))
  .pipe(gulp.dest('build/templates/'));
```

This will result in the following template file:
```js
define("build/templates/path/to/template.mustache", ["hogan"], function(Hogan) { ... })
```


## For gulp plugin developers

Plugin developers can pass options on to this plugin so that users don't have to define
values that may be the most common setup for modules.

To do so set the `defineModuleOptions` on the [`file`](https://github.com/gulpjs/gulp-util#new-fileobj)
object. This object will be merged with options that users pass in to their `defineModule` pipe
(user's options take precedence). It's recommended that if you define _wrapper_ in these options,
that you make it a single value from the _context_ for usage simplicity.

For an example, see [gulp-ember-emblem].


## License

This project is distributed under the MIT license.


[travis-url]: http://travis-ci.org/wbyoung/gulp-define-module
[travis-image]: https://secure.travis-ci.org/wbyoung/gulp-define-module.png?branch=master
[npm-url]: https://npmjs.org/package/gulp-define-module
[npm-image]: https://badge.fury.io/js/gulp-define-module.png
[codeclimate-image]: https://codeclimate.com/github/wbyoung/gulp-define-module.png
[codeclimate-url]: https://codeclimate.com/github/wbyoung/gulp-define-module
[coverage-image]: https://coveralls.io/repos/wbyoung/gulp-define-module/badge.png
[coverage-url]: https://coveralls.io/r/wbyoung/gulp-define-module
[david-image]: https://david-dm.org/wbyoung/gulp-define-module.png?theme=shields.io
[david-url]: https://david-dm.org/wbyoung/gulp-define-module
[david-dev-image]: https://david-dm.org/wbyoung/gulp-define-module/dev-status.png?theme=shields.io
[david-dev-url]: https://david-dm.org/wbyoung/gulp-define-module#info=devDependencies

[gulp-define-module]: https://github.com/wbyoung/gulp-define-module
[gulp-handlebars]: https://github.com/lazd/gulp-handlebars
[gulp-ember-emblem]: https://github.com/wbyoung/gulp-ember-emblem
[lodash.template]: http://lodash.com/docs#template
