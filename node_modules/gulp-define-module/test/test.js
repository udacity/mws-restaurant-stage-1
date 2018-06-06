'use strict';

var defineModule = require('../');
var gutil = require('gulp-util');
var path = require('path');
var fs = require('fs');

require('mocha');
require('should');

var fixtureFile = function(filePath) {
  var fixturesDir = path.join('test', 'fixtures');
  var fixturePath = path.join(fixturesDir, filePath);
  var file = new gutil.File({
    path: fixturePath,
    cwd: fixturesDir,
    base: path.dirname(fixturePath),
    contents: fs.readFileSync(fixturePath)
  });
  return file;
};

var streamThroughDefineModule = function(type, options, filePath, cb) {
  var stream = defineModule(type, options);
  var file = fixtureFile(filePath);
  cb(stream);
  stream.write(file);
  stream.end();
};

var fileShouldMatchExpected = function(file, filePath) {
  var expectedDir = path.join('test', 'expected');
  var expectedPath = path.join(expectedDir, filePath);
  if (fs.existsSync(expectedPath + '.regex')) {
    var regex = new RegExp(fs.readFileSync(expectedPath + '.regex').toString());
    var match = file.contents.toString().match(regex);
    match.should.exist;
    if (typeof arguments[2] === 'function') {
      arguments[2](match);
    }
  }
  else {
    file.contents.toString().should.equal(fs.readFileSync(expectedPath).toString());
  }
};

describe('gulp-define-module', function() {
  describe('defineModule()', function() {

    var basic = function(type, options, variant) {
      return function(done) {
        streamThroughDefineModule(type, options, 'basic.js', function(stream) {
          stream.on('data', function(file) {
            var expectedName = 'basic_' + type;
            if (variant) { expectedName += '_' + variant; }
            fileShouldMatchExpected(file, expectedName + '.js');
            done();
          });
        });
      };
    };

    var amdNamingOptions = { name: function() { return 'path/module'; } };

    it('makes anonymous AMD modules', basic('amd'));
    it('makes named AMD modules', basic('amd', amdNamingOptions, 'named'));
    it('makes CommonJS modules', basic('commonjs'));
    it('makes ES6 modules', basic('es6'));
    it('makes Node modules', basic('node'));
    it('makes Hybrid modules', basic('hybrid'));
    it('makes plain modules', basic('plain'));

    it('throws when the the type is unsupported', function() {
      basic('invalid').should.throw(); // throws before it becomes async
    });

    var requireOptions = { require: { Library: 'library' } };
    it('handles require for AMD', basic('amd', requireOptions, 'require'));
    it('handles require for Node', basic('node', requireOptions, 'require'));
    it('handles require for CommonJS', basic('commonjs', requireOptions, 'require'));
    it('handles require for ES6', basic('es6', requireOptions, 'require'));
    it('handles require for Hybrid', basic('hybrid', requireOptions, 'require'));
    it('ignores require for plain', basic('plain', requireOptions));

    it('accepts wrapper option',
      basic('plain', { wrapper: 'App.TEMPLATES = TemplateWrapper(<%= contents %>)' }, 'wrapped'));

    it('accepts options.context as a string',
      basic('plain', {
        context: { customContents: '<%= contents %>' },
        wrapper: '<%= customContents %>'
      }));

    it('allows name to be overridden',
      // this isn't a recommended use of name. instead, the user should define
      // a wrapper, but it significantly simplifies the test setup.
      basic('plain', {
        context: { name: 'App["<%= name %>"] =' }
      }));

    it('accepts options.context as a function',
      basic('plain', {
        context: function(context) {
          return {
            customContents: 'App.TEMPLATES = TemplateWrapper(' + context.contents + ')'
          };
        },
        wrapper: '<%= customContents %>'
      }, 'wrapped'));

    it('accepts options through incoming file', function(done) {
      var stream = defineModule('amd');
      var file = fixtureFile('basic.js');
      file.defineModuleOptions = requireOptions;
      stream.on('data', function(file) {
        fileShouldMatchExpected(file, 'basic_amd_require.js');
        done();
      });
      stream.write(file);
      stream.end();
    });

    it('processes options for AMD both through invocation and incoming file', function(done) {
      // the options should be handled like this:
      // - require from `file.defineModuleOptions` should be used as base values, and the
      //   values from `defineModule` should be merged over top of them.
      // - context from `file.defineModuleOptions` should be processed first, then context
      //   from `defineModule`.
      // - wrapper from `defineModule` should override that of `file.defineModuleOptions`.
      // - any require from `defineModule` with the value of null should ignore the require
      var stream = defineModule('amd', {
        wrapper: 'Application.Library.TEMPLATES[\'<%= name %>\'] = <%= contents %>',
        context: function(context) {
          return { name: context.prefix + '.' + context.name };
        },
        require: { Application: 'application', Shared: 'shared-application-library', Vendor: null }
      });
      var file = fixtureFile('basic.js');
      file.defineModuleOptions = {
        wrapper: 'Library.TEMPLATES[\'<%= name %>\'] = <%= contents %>',
        context: { prefix: 'prefix' },
        require: { Library: 'library', Shared: 'shared-library', Vendor: 'shared-vendor-library' }
      };
      stream.on('data', function(file) {
        fileShouldMatchExpected(file, 'basic_amd_advanced_options.js', function(match) {
          match[1].split(',').sort().join(',').should.eql('"application","library","shared-application-library"');
          match[2].split(',').sort().join(',').should.eql('Application,Library,Shared');
        });
        done();
      });
      stream.write(file);
      stream.end();
    });

    it('processes options for CommonJS both through invocation and incoming file', function(done) {

      var stream = defineModule('commonjs', {
        wrapper: 'Application.Library.TEMPLATES[\'<%= name %>\'] = <%= contents %>',
        context: function(context) {
          return { name: context.prefix + '.' + context.name };
        },
        require: { Library: 'app-library', Vendor: null }
      });

      var file = fixtureFile('basic.js');
      file.defineModuleOptions = {
        wrapper: 'Library.TEMPLATES[\'<%= name %>\'] = <%= contents %>',
        context: { prefix: 'prefix' },
        require: { Library: 'app-library', Vendor: 'shared-vendor-library' }
      };

      stream.on('data', function(file) {
        fileShouldMatchExpected(file, 'basic_commonjs_advanced.js', function(match) {
          match[1].should.eql('Library');
          match[2].should.eql('app-library');
          done();
        });
      });

      stream.write(file);
      stream.end();

    });

    it('processes options for ES6 both through invocation and incoming file', function(done) {

      var stream = defineModule('es6', {
        wrapper: 'Application.Library.TEMPLATES[\'<%= name %>\'] = <%= contents %>',
        context: function(context) {
          return { name: context.prefix + '.' + context.name };
        },
        require: { Library: 'app-library', Vendor: null }
      });

      var file = fixtureFile('basic.js');
      file.defineModuleOptions = {
        wrapper: 'Library.TEMPLATES[\'<%= name %>\'] = <%= contents %>',
        context: { prefix: 'prefix' },
        require: { Library: 'app-library', Vendor: 'shared-vendor-library' }
      };

      stream.on('data', function(file) {
        fileShouldMatchExpected(file, 'basic_es6_advanced.js', function(match) {
          match[1].should.eql('Library');
          match[2].should.eql('app-library');
          done();
        });
      });

      stream.write(file);
      stream.end();

    });

    describe('wrapper context', function() {
      it('defines name', basic('plain', {
        wrapper: 'App["<%= name %>"] = <%= contents %>'
      }, 'context_name'));
      it('defines file', basic('plain', {
        wrapper: 'App["<%= file.path %>"] = <%= contents %>'
      }, 'context_file'));
      it('defines contents', basic('plain', {
        wrapper: '<%= contents %>'
      }));
      it('handles nested paths for name', function(done) {
        var stream = defineModule('plain', {
          wrapper: 'App["<%= name %>"] = <%= contents %>'
        });
        var file = fixtureFile('nested/basic.js');
        stream.on('data', function(file) {
          fileShouldMatchExpected(file, 'basic_plain_context_name.js');
          done();
        });
        stream.write(file);
        stream.end();
      });
    });
  });
});
