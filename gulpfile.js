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
    gutil = require('gulp-util'),
    sass = require('gulp-sass'),
    imagemin = require('gulp-imagemin'),
    pngquant = require('imagemin-pngquant'),
    imageminMozjpeg = require('imagemin-mozjpeg');

var config = {
  development: {
    paths: {
      src: {
        js: {
          all: './src/js/**/*.js',
          main: './src/js/main.js',
          detail: './src/js/restaurant_info.js'
        },
        scss: './src/scss/**/*.scss',
        html: './src/*.html',
        manifest: './src/manifest.json',
        sw: './src/sw.js',
        img: './src/img/**/*.{gif,jpg,jpeg,png,svg}'
      },
      dst: {
        root: './dev',
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
      },
      sass: {},
      imagemin: [
        pngquant(),
        imageminMozjpeg({
          progressive: true,
          quality: 65
        })
      ]
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
        scss: './src/scss/**/*.scss',
        html: './src/*.html',
        manifest: './src/manifest.json',
        sw: './src/sw.js',
        img: './src/img/**/*.{gif,jpg,jpeg,png,svg}'
      },
      dst: {
        root: './dist',
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
      },
      sass: {
        outputStyle: 'compressed'
      },
      imagemin: [
        pngquant(),
        imageminMozjpeg({
          progressive: true,
          quality: 65
        })
      ]
    }
  }
};

var env = argv.env || 'development',
    configEnv = config[env],
    paths = configEnv.paths,
    plugins = configEnv.plugins;

gulp.task('js', function() {
  var restaurantsBundler = getBundler([paths.src.js.main]);
  var restaurantDetailBundler = getBundler([paths.src.js.detail]);
  if(env == 'development') {
    restaurantsBundler.on('update', function(){
      bundle(restaurantsBundler, paths.dst.js.main.bundleName);
      browserSync.reload();
    });
    restaurantsBundler.on('log', gutil.log);
    restaurantDetailBundler.on('update', function(){
      bundle(restaurantDetailBundler, paths.dst.js.detail.bundleName);
      browserSync.reload();
    });
    restaurantDetailBundler.on('log', gutil.log);
  }
  bundle(restaurantsBundler, paths.dst.js.main.bundleName);
  bundle(restaurantDetailBundler, paths.dst.js.detail.bundleName);
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
    .pipe(env == 'development' ? sourcemaps.init() : noop())
    .pipe(env == 'production' ? uglify(plugins.uglify) : noop())
    .pipe(env == 'development' ? sourcemaps.write('./maps') : noop())
    .pipe(gulp.dest(paths.dst.js.all));
}

gulp.task('styles', function() {
  gulp.src(paths.src.scss)
    .pipe(sass(plugins.sass).on('error', sass.logError))
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
  browserify({entries: [paths.src.sw], debug: true})
    .transform("babelify", { presets: ["es2015"] })
    .bundle()
    .on('error', function(err) { console.error(err); this.emit('end'); })
    .pipe(source('sw.js'))
    .pipe(buffer())
    .pipe(gulp.dest(paths.dst.sw));
});

gulp.task('img', function() {
  gulp.src(paths.src.img)
    .pipe(imagemin(plugins.imagemin))
    .pipe(gulp.dest(paths.dst.img));
});

gulp.task('lint', function() {
  return gulp.src([paths.src.js.all])
    .pipe(eslint())
    .pipe(eslint.format())
    .pipe(eslint.failOnError());
});

gulp.task('browserSyncReload', function(){
  browserSync.reload();
});

gulp.task('build', ['html', 'styles', 'js', 'manifest', 'sw', 'img']);

gulp.task('serve', ['lint', 'build'], function() {
  browserSync.init({
    browser: ["google chrome"],
    server: paths.dst.root
  });
  gulp.watch(paths.src.js.all, ['lint']);
  gulp.watch(paths.src.html, ['html', 'browserSyncReload']);
  gulp.watch(paths.src.scss, ['styles', 'browserSyncReload']);
});