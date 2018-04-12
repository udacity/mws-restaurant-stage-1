var gulp = require('gulp');
var eslint = require('gulp-eslint');
var browserSync = require('browser-sync').create();
var browserify = require('browserify');
var babelify = require('babelify');
var sourcemaps = require('gulp-sourcemaps');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');

gulp.task('js', function() {
  // Restaurants list
  browserify({entries: ['./js/main.js'], debug: true})
    .transform("babelify", { presets: ["es2015"] })
    .bundle()
    .on('error', function(err) { console.error(err); this.emit('end'); })
    .pipe(source('bundle.js'))
    .pipe(buffer())
    .pipe(sourcemaps.init())
    //.pipe(uglify())
    .pipe(sourcemaps.write('./maps'))
    .pipe(gulp.dest('dist/js'));
  // Restaurant detail
  browserify({entries: ['./js/restaurant_info.js'], debug: true})
    .transform("babelify", { presets: ["es2015"] })
    .bundle()
    .on('error', function(err) { console.error(err); this.emit('end'); })
    .pipe(source('bundleDetail.js'))
    .pipe(buffer())
    .pipe(sourcemaps.init())
    //.pipe(uglify())
    .pipe(sourcemaps.write('./maps'))
    .pipe(gulp.dest('dist/js'));
});

gulp.task('styles', function() {
  gulp.src('css/**/*.css')
    .pipe(gulp.dest('dist/css'))
});

gulp.task('html', function () {
  gulp.src('*.html')
    .pipe(gulp.dest('dist'));
});

gulp.task('manifest', function () {
  gulp.src('manifest.json')
    .pipe(gulp.dest('dist'));
});

gulp.task('sw', function () {
  browserify({entries: ['./sw.js'], debug: true})
    .transform("babelify", { presets: ["es2015"] })
    .bundle()
    .on('error', function(err) { console.error(err); this.emit('end'); })
    .pipe(source('sw.js'))
    .pipe(buffer())
    .pipe(gulp.dest('dist'));
});

gulp.task('img', function() {
  gulp.src('img/**/*.{gif,jpg,jpeg,png,svg}')
    .pipe(gulp.dest('dist/img'));
});

gulp.task('lint', () => {
  return gulp.src(['js/**/*.js'])
    .pipe(eslint())
    .pipe(eslint.format())
    .pipe(eslint.failOnError());
});

gulp.task('copy', ['html', 'styles', 'js', 'manifest', 'sw', 'img']);
gulp.task('build', ['copy']);

gulp.task('default', ['lint'], function() {

  browserSync.init({
    browser: ["google chrome"],
    server: "./dist"
  });
  // TODO
  //gulp.watch('js/**/*.js', ['lint']);
});