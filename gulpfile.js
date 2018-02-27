var gulp = require('gulp');
var $ = require('gulp-load-plugins')();

gulp.task('images', function () {
  return gulp.src('img_src/*.{jpg,png}')
    .pipe($.responsive({
      // Convert all images to JPEG format
      '*': [{
        width: 400,
        rename: {
          suffix: '_small',
          extname: '.jpg',
        },
      }, {
        width: 600,
        rename: {
          suffix: '_medium',
          extname: '.jpg',
        },
      }, {
        width: 800,
        rename: {
          suffix: '_large',
          extname: '.jpg',
        },
      }],
    }))
    .pipe(gulp.dest('img'));
});