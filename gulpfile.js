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
var runSequence = require('run-sequence');
var del = require('del');
var cleanCSS = require('gulp-clean-css');
var concat = require('gulp-concat');
var minify = require('gulp-minify');

var args = process.argv.slice(3);

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

gulp.task('compress:js', function() {
  gulp.src(['src/js/main.js','src/js/dbhelper.js'])
    .pipe(concat('main.js'))
    .pipe(gulp.dest('./js'))
    .pipe(minify({
      ext: {
        min: '.js'
      },
      noSource: true
    }))
    .pipe(gulp.dest('./js'));

   gulp.src(['src/js/restaurant_info.js','src/js/dbhelper.js'])
    .pipe(concat('restaurant_info.js'))
    .pipe(gulp.dest('./js'))
    .pipe(minify({
      ext: {
        min: '.js'
      },
      noSource: true
    }))
    .pipe(gulp.dest('./js'));
});

// gulp.task('compress:js', function() {
//   gulp.src('src/js/*.js')
//     .pipe(minify({
//       noSource: true
//     }))
//     .pipe(gulp.dest('./js'))
// });

gulp.task('minify:css', () => {
  return gulp.src('src/css/*.css')
    .pipe(cleanCSS())
    .pipe(gulp.dest('./css'));
});

gulp.task('clean', function (done) {
  del(['./js', './css', './icons', './responsive_images'], done);
});

gulp.task("copy", function() {
  // gulp.src('src/css/*.css').pipe(gulp.dest("./css"));
  gulp.src('src/responsive_images/*.jpg').pipe(gulp.dest("./responsive_images"));
  gulp.src('src/index.html').pipe(gulp.dest("./"));
  gulp.src('src/404.html').pipe(gulp.dest("./"));
  gulp.src('src/restaurant.html').pipe(gulp.dest("./"));
  gulp.src('src/manifest.json').pipe(gulp.dest("./"));
  gulp.src('src/icons/*.png').pipe(gulp.dest("./icons"));
  gulp.src('src/icons/*.ico').pipe(gulp.dest("./icons"));
});


gulp.task('default', function(callback) {
  runSequence('clean', ['copy', 'js:browser', 'compress:js', 'minify:css'], callback);
});
