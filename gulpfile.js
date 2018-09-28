let gulp = require('gulp');
let concat = require('gulp-concat');
let useref = require('gulp-useref');
let uglify = require('gulp-uglify');
let pump = require('pump');

gulp.task('default', defaultTask);

gulp.task('concat', function(){
  return gulp.src(['https://unpkg.com/leaflet@1.3.1/dist/leaflet.js', './js/idb.js', './js/dbhelper.js', './js/main.js', './js/restaurant_info.js'])
             .pipe(concat('all.js'))
             .pipe(gulp.dest('./js/'));
})

gulp.task('concatenate', function(){
    return gulp.src('./index.html')
              .pipe(useref())
              .pipe(gulp.dest('./'));
})

function defaultTask(done) {
  // place code for your default task here
  done();
}