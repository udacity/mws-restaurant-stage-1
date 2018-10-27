import gulp from 'gulp';
import responsive from 'gulp-responsive';
import del from 'del';
import newer from 'gulp-newer';
import runSequence from 'run-sequence';
import babelify from 'babelify';
import assign from 'lodash/assign';
import browserify from 'browserify';
import watchify from 'watchify';
import source from 'vinyl-source-stream';
import buffer from 'vinyl-buffer';
import log from 'fancy-log';
import mergeStream from 'merge-stream';
import sourcemaps from 'gulp-sourcemaps';
import c from 'ansi-colors';

const browserSync = require('browser-sync').create();

// Add src and dest paths to files you will handle in tasks here. For js files, also add bundles to create
const paths = {
  responsive: {
    src: 'src/img/**/*.jpg',
    dest: 'dist/img/'
  },
  js: {
    src: 'src/**/*.js',
    dest: 'dist/',
    // don't add the src folder to path. Use a path relative to the src folder. Use array even if only one bundle.
    bundles: ['js/main.js', 'js/restaurant_info.js', 'sw.js']
  }
};

// This object will serve as the source of all files that need to be copied
const copy = {
  src: ['src/**/*.*'],
  dest: 'dist/'
};
// copy.src will exclude all sources in paths object. 'copy' task will log the sources used.
Object.keys(paths).forEach(prop => {
  let src = [].concat(paths[prop].src);
  src = src.filter(path => path[0] !== "!").map(path => `!${path}`);
  copy.src = copy.src.concat(src);
});

// task for cleaning dist folder (by deleting its contents)
gulp.task('clean', function(done) {
  log(c.cyan('Deleting all files in dist folder'));
  return del(['dist/'], done);
});

// task for creating responsive images
gulp.task('responsive:images', function() {
  log(c.cyan('Creating Responsive images...'));
  return gulp.src(paths.responsive.src)
    .pipe(responsive({
      // Here is where you can change sizes and suffixes to fit your needs. Right now 
      // we are resizing all jpg images to three different sizes: 300, 600 and 800 px wide.

      '**/*.jpg': [{
        width: 800,
        quality: 70,
        rename: { suffix: '-large'}
      }, {
        width: 600,
        quality: 50,
        rename: { suffix: '-medium'}
      }, {
        width: 300,
        quality: 40,
        rename: { suffix: '-small'}
      }]
    },))
    .pipe(gulp.dest(paths.responsive.dest));
});

// task for copying all files not handled by other tasks. copy.src is used on this task
gulp.task('copy', function() {
  log(c.cyan('Copying all files from following sources: '), c.yellow(copy.src));
  return gulp.src(copy.src)
    .pipe(newer(copy.dest)) // only copy file if it hasn't been copied already.
    .pipe(gulp.dest(copy.dest));
});

// build task
gulp.task('build', function(done) {
  return runSequence(
    'clean',
    ['responsive:images', 'js:bundle'],
    'copy', // copy is done last, so is easy to see what's been copied.
    done
  )
});

// Browser sync task to use in development.
gulp.task('sync', ['build'], function() {
  browserSync.init({
    port: 8000,
    server: {
      baseDir: './dist'
    }
  });

  gulp.watch(paths.responsive.src, ['responsive:images']).on('change', browserSync.reload);
  gulp.watch(copy.src, ['copy']).on('change', browserSync.reload);

  // each bundle on 'update' will call browserSync.stream() at the end of the pipe
  Object.keys(jsBundles).forEach(function(key) {
    var b = jsBundles[key];
    b.on('update', function() {
      bundle(b, key); // do not use return, or else only one bundle will be created
    });
  });
});

// set sync task as default
gulp.task('default', ['sync']);

/** Bundle functions, object and task *******************************************************/
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

  b.transform("babelify", {presets: ["@babel/preset-env"]});

  b.on('log', log);
  return b;
}

function bundle(b, outputPath) {
  var splitPath = outputPath.split('/');
  var outputFile = splitPath[splitPath.length - 1];
  var outputDir = splitPath.slice(0, -1).join('/');

  return b.bundle()
    .on('error', function(err) {
      log.error( c.red(err) );
    })
    .on('end', function() {
      log(c.green(`${outputFile} bundle done`));
    })
    .pipe(source(outputFile))
    // optional, remove if you don't need to buffer file contents
    .pipe(buffer())
    // optional, remove if you dont want sourcemaps
    .pipe(sourcemaps.init({loadMaps: true})) // loads map from browserify file
    // Add transformation tasks to the pipeline here.
    .pipe(sourcemaps.write('./')) // writes .map file
    .pipe(gulp.dest(paths.js.dest + outputDir))
    .pipe(browserSync.stream()); // call browserSync.stream() to refresh browser when using sync task
}

// this object will use the paths found in the paths.js.bundles array to create bundles
const jsBundles = {};
paths.js.bundles.forEach(bundle => {
  jsBundles[bundle] = createBundle(`./src/${bundle}`);
});

// task to create bundles.
gulp.task('js:bundle', function (done) {
  return mergeStream.apply(null,
    Object.keys(jsBundles).map(function(key) {
      return bundle(jsBundles[key], key);
    })
  );
});