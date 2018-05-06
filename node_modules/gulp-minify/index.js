'use strict';
var through = require('through2'),
  uglify = require('uglify-es'),
  gutil = require('gulp-util'),
  minimatch = require('minimatch'),
  path = require('path'),
  PluginError = gutil.PluginError,
  reSourceMapComment = /\n\/\/# sourceMappingURL=.+?$/,
  pathSeparatorRe = /[\/\\]/g;


function parseExt(ext) {
  var _ext = {};

  if (!ext) {
    _ext = {
      min: "-min.js",
      src: ".js"
    }
  } else if (typeof ext == "string") {
    _ext = {
      min: ext,
      src: ".js"
    }
  } else {
    _ext = {
      min: ext.min || "-min.js",
      src: ext.src || ".js"
    }
  }
  return _ext;
}

function formatError(error, file) {
  var relativePath = '',
    filePath = error.file === 'stdin' ? file.path : error.file,
    message = '';

  filePath = filePath ? filePath : file.path;
  relativePath = path.relative(process.cwd(), filePath);

  message += gutil.colors.underline(relativePath) + '\n';
  message += error.message + ' (line: ' + error.line  + ', col: ' + error.col + ', pos: ' + error.pos;
  error.message = gutil.colors.red(message);
  return error;
}

module.exports = function(opt) {
  var options = opt || {},
    ext = parseExt(options.ext);

  options.output =  options.output ||  {};
  function minify(file, encoding, callback) {

    if (file.isNull()) {
      this.push(file);
      return callback();
    }

    if (file.isStream()) {
      this.emit('end');
      return new callback(PluginError('gulp-minify', 'Streaming not supported:' + file.path));
    }

    var ignore = false;

    if (options.exclude) {
      ignore = options.exclude.some(function(item) {
        return path.dirname(file.path).split(pathSeparatorRe).some(function(pathName) {
          return minimatch(pathName, item);
        });
      });
    }

    if (!ignore && options.ignoreFiles) {
      ignore = options.ignoreFiles.some(function(item) {
        return minimatch(path.basename(file.path), item);
      });
    }

    if (ignore || path.extname(file.path) != '.js') {
      this.push(file);
      return callback();
    }

    var mangled,
      originalSourceMap;

    if (file.sourceMap) {
      options.outSourceMap = file.relative;
      if (file.sourceMap.mappings !== '') {
        options.inSourceMap = file.sourceMap;
      }
      originalSourceMap = file.sourceMap;
    }

    if (options.preserveComments === 'all') {
      options.output.comments = true;
    } else if (options.preserveComments === 'some') {

      options.output.comments = /^!|@preserve|@license|@cc_on/i;
    } else if (typeof options.preserveComments === 'function') {
      options.output.comments = options.preserveComments;
    }
    options.fromString = options.hasOwnProperty("fromString") ? options.fromString : true;

    var min_file = new gutil.File({
      path: Array.isArray(ext.min) ? file.path.replace(ext.min[0], ext.min[1]) : file.path.replace(/\.js$/, ext.min),
      base: file.base
    });

    var uglifyOptions = {
        mangle   : options.mangle   !== undefined ? options.mangle : true,
        output   : options.output   !== undefined ? options.output : null,
        compress : options.compress !== undefined ? options.compress : {},
        sourceMap: !!file.sourceMap
    };

    try {
      mangled = uglify.minify(String(file.contents), uglifyOptions);
      min_file.contents = new Buffer(mangled.code.replace(reSourceMapComment, ''));
    } catch (e) {
      this.emit('end');
      return callback(new PluginError('gulp-minify', formatError(e, file)));
    }

    if (file.sourceMap) {
      min_file.sourceMap = JSON.parse(mangled.map);
      min_file.sourceMap.sourcesContent = originalSourceMap.sourcesContent;
      min_file.sourceMap.sources = originalSourceMap.sources;
    }

    this.push(min_file);

    if (!options.noSource) {
      file.path = file.path.replace(/\.js$/, ext.src);
      this.push(file);
    }
    callback();
  }

  return through.obj(minify);
};
