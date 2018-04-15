var gulp = require('gulp'),
    eslint = require('gulp-eslint'),
    browserSync = require('browser-sync').create(),
    browserify = require('browserify'),
    babelify = require('babelify'),
    sourcemaps = require('gulp-sourcemaps'),
    source = require('vinyl-source-stream'),
    buffer = require('vinyl-buffer'),
    argv = require('yargs').argv,
    uglify = require('gulp-uglify'),
    watchify = require('watchify'),
    noop = require('gulp-noop'),
    gutil = require('gulp-util');

var config = {
  development: {
    paths: {
      src: {
        js: {
          all: './src/js/**/*.js',
          main: './src/js/main.js',
          detail: './src/js/restaurant_info.js'
        },
        css: './src/css/**/*.css',
        html: './src/*.html',
        manifest: './src/manifest.json',
        sw: './src/sw.js',
        img: './src/img/**/*.{gif,jpg,jpeg,png,svg}'
      },
      dst: {
        js: {
          all: './dev/js',
          main: {
            bundleName: 'bundle.js'
          },
          detail: {
            bundleName: 'bundleDetail.js'
          }
        },
        css: './dev/css',
        html: './dev',
        manifest: './dev',
        sw: './dev',
        img: './dev/img'
      }
    },
    plugins: {
      browserify: {
        cache: {},
        packageCache: {},
        debug: true,
        plugin: [watchify]
      }
    }
  },
  production: {
    paths: {
      src: {
        js: {
          all: './src/js/**/*.js',
          main: './src/js/main.js',
          detail: './src/js/restaurant_info.js'
        },
        css: './src/css/**/*.css',
        html: './src/*.html',
        manifest: './src/manifest.json',
        sw: './src/sw.js',
        img: './src/img/**/*.{gif,jpg,jpeg,png,svg}'
      },
      dst: {
        js: {
          all: './dist/js',
          main: {
            bundleName: 'bundle.js'
          },
          detail: {
            bundleName: 'bundleDetail.js'
          }
        },
        css: './dist/css',
        html: './dist',
        manifest: './dist',
        sw: './dist',
        img: './dist/img'
      }
    },
    plugins: {
      browserify: {
        cache: {},
        packageCache: {},
        debug: false
      },
      uglify: {
        mangle: true
      }
    }
  }
};

var env = argv.production ? 'production' : 'development';
var configEnv = config[env];
var paths = configEnv.paths;
var plugins = configEnv.plugins;

gulp.task('js', function() {
  var restaurantsBundler = getBundler([paths.src.js.main]);
  var restaurantDetailBundler = getBundler([paths.src.js.detail]);
  if(env == 'development') {
    restaurantsBundler.on('update', function(){
      bundle(restaurantsBundler, paths.dst.js.main.bundleName);
    });
    restaurantsBundler.on('log', gutil.log);
    restaurantDetailBundler.on('update', function(){
      bundle(restaurantDetailBundler, paths.dst.js.detail.bundleName);
    });
    restaurantDetailBundler.on('log', gutil.log);
  }
  bundle(restaurantsBundler, paths.dst.js.main.bundleName);
  bundle(restaurantDetailBundler, paths.dst.js.detail.bundleName);
});

gulp.task('js-watch', function () {

});

function getBundler(entries) {
  return browserify(Object.assign({}, configEnv.plugins.browserify, { entries: entries }))
}

function bundle(bundler, bundleName) {
  bundler.transform("babelify", { presets: ["es2015"] })
    .bundle()
    .on('error', function(err) { console.error(err); this.emit('end'); })
    .pipe(source(bundleName))
    .pipe(buffer())
    .pipe(sourcemaps.init())
    .pipe(env == 'production' ? uglify(plugins.uglify) : noop())
    .pipe(sourcemaps.write('./maps'))
    .pipe(gulp.dest(paths.dst.js.all));
}

gulp.task('styles', function() {
  gulp.src(paths.src.css)
    .pipe(gulp.dest(paths.dst.css))
});

gulp.task('html', function () {
  gulp.src(paths.src.html)
    .pipe(gulp.dest(paths.dst.html));
});

gulp.task('manifest', function () {
  gulp.src(paths.src.manifest)
    .pipe(gulp.dest(paths.dst.manifest));
});

gulp.task('sw', function () {
  browserify({entries: [paths.src.manifest], debug: true})
    .transform("babelify", { presets: ["es2015"] })
    .bundle()
    .on('error', function(err) { console.error(err); this.emit('end'); })
    .pipe(source('sw.js'))
    .pipe(buffer())
    .pipe(gulp.dest(paths.dst.sw));
});

gulp.task('img', function() {
  gulp.src(paths.src.img)
    .pipe(gulp.dest(paths.dst.img));
});

gulp.task('lint', () => {
  return gulp.src([paths.src.js.all])
    .pipe(eslint())
    .pipe(eslint.format())
    .pipe(eslint.failOnError());
});

gulp.task('copy', ['html', 'styles', 'js', 'manifest', 'sw', 'img']);
gulp.task('build', ['copy']);

gulp.task('serve', ['lint', 'build'], function() {
  browserSync.init({
    browser: ["google chrome"],
    server: "./dev"
  });
  // TODO
  //gulp.watch('js/**/*.js', ['lint']);
});