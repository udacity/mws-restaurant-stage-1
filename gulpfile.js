var gulp = require('gulp');
var plugins = require('gulp-load-plugins')();
var assign = require('lodash/object/assign');
var browserify = require('browserify');
var watchify = require('watchify');
var babelify = require('babelify');
var hbsfy = require('hbsfy');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
var mergeStream = require('merge-stream');

var args = process.argv.slice(3);

gulp.task("copy", function() {
	gulp.src('src/css/*.css').pipe(gulp.dest("./css"));
	gulp.src('src/responsive_images/*.jpg').pipe(gulp.dest("./responsive_images"));
	gulp.src('src/js/*.js').pipe(gulp.dest("./js"));
	gulp.src('src/index.html').pipe(gulp.dest("./"));
	gulp.src('src/restaurant.html').pipe(gulp.dest("./"));
		
});

function createBundle(src) {
  if (!src.push) {
    src = [src];
  }

  var customOpts = {
    entries: src,
    debug: true
  };
  var opts = assign({}, watchify.args, customOpts);
  var b = watchify(browserify(opts));

  b.transform(babelify.configure({
    stage: 1
  }));

  b.transform(hbsfy);
  b.on('log', plugins.util.log);
  return b;
}

function bundle(b, outputPath) {
  var splitPath = outputPath.split('/');
  var outputFile = splitPath[splitPath.length - 1];
  var outputDir = '';

  return b.bundle()
    // log errors if they happen
    .on('error', plugins.util.log.bind(plugins.util, 'Browserify Error'))

    .pipe(source(outputFile))
    // optional, remove if you don't need to buffer file contents
    // .pipe(buffer())
    // optional, remove if you dont want sourcemaps
    // .pipe(plugins.sourcemaps.init({loadMaps: true})) // loads map from browserify file
       // Add transformation tasks to the pipeline here.
    // .pipe(plugins.sourcemaps.write('./')) // writes .map file
    .pipe(gulp.dest(outputDir));
}

var jsBundles = {
  'sw.js': createBundle('src/sw.js')
};

gulp.task('js:browser', function () {
  return mergeStream.apply(null,
    Object.keys(jsBundles).map(function(key) {
      return bundle(jsBundles[key], key);
    })
  );
});

// gulp.task('js:server', function () {
//   return gulp.src('src/**/*.js')
//     .pipe(plugins.sourcemaps.init())
//     .pipe(plugins.babel({stage: 1}))
//     .on('error', plugins.util.log.bind(plugins.util))
//     .pipe(plugins.sourcemaps.write('.'))
//     .pipe(gulp.dest('./'));
// });

gulp.task('default', ['copy', 'js:browser']);
