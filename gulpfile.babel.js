import gulp from 'gulp';
import responsive from 'gulp-responsive';
import uglify from 'gulp-uglify';
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
import c from 'ansi-colors';

const browserSync = require('browser-sync').create();

const paths = {
    responsive: {
      src: 'src/images/**/*.jpg',
      dest: 'dist/img/'
    },
    js: {
      src: 'src/**/*.js',
      dest: 'dist/',
      bundles: ['js/main.js', 'js/restaurant_info.js','sw.js']
    }
  };

  const copy = {
    src: ['src/**/*.*'],
    dest: 'dist/'
  };

  const jsBundles = {};

  ///Populates jsBundles
  paths.js.bundles.forEach(bundle => {
  jsBundles[bundle] = createBundle(`./src/${bundle}`);
});

  ///Creates array of source paths to move into the build and puts them in copy.src
  Object.keys(paths).forEach(prop => {
    let src = [].concat(paths[prop].src);
    src = src.filter(path => path[0] !== "!").map(path => `!${path}`);
    copy.src = copy.src.concat(src);
  });

  Object.keys(jsBundles).forEach(function(key) {
    var b = jsBundles[key];
    b.on('update', function() {
      bundle(b, key);
    });
  });

///Responsive images
gulp.task('responsive:images', function(){
    log(c.cyan('Creating Responsive images...')); /// hah nice this is fancy
    return gulp.src(paths.responsive.src)
    .pipe(responsive({
        '**/*.jpg': [{
            width: 800,
            quality: 70,
            rename: { suffix: '-large'}
        }, {
            width: 600,
            quality: 50,
            rename: { suffix: '-medium'}
        },{
            width: 300,
            quality: 40,
            rename: { suffix: '-small'}
        }]
    },))
    .pipe(gulp.dest(paths.responsive.dest));
});

///bundle js files
gulp.task('js:bundle', function (done) {
    return mergeStream.apply(null,
      Object.keys(jsBundles).map(function(key) {
        return bundle(jsBundles[key], key)
      })
    );
  });

  /// Build Tasks
  gulp.task('clean', function(done){
    return del(['img/'], done)
});

///Copies array of src files into dist
gulp.task('copy', function() {
    log(c.cyan('Copying all files from following sources: '), c.yellow(copy.src));
    return gulp.src(copy.src)
      .pipe(newer(copy.dest)) // only copy file if it hasn't been copied already.
      .pipe(gulp.dest(copy.dest));
  });

  ///Deletes previous build then runs image compression and copy of js files
  gulp.task('build', function(done) {
    return runSequence(
      'clean',
      ['responsive:images', 'js:bundle'],
      'copy',
      done
    )
  });



gulp.task('sync', ['build'], function() {
    browserSync.init({
      port: 8000,
      server: {
        baseDir: './dist'
      }
    })
});



// set sync task as default
gulp.task('default', ['sync']);

gulp.watch(paths.responsive.src, ['responsive:images']).on('change', browserSync.reload);
gulp.watch(copy.src, ['copy']).on('change', browserSync.reload);

/// Bundle functions, object and task 
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
      .pipe(buffer())
      .pipe(uglify())
      .pipe(gulp.dest(paths.js.dest + outputDir))
      .pipe(browserSync.stream()); // call browserSync.stream() to refresh browser when using sync task
  }
