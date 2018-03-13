const gulp = require('gulp');
const $ = require('gulp-load-plugins')();
const imagemin = require('gulp-imagemin');

// TODO: Check why this is not working
// gulp.task('images', gulp.series('compress', 'resize'));

// gulp.task('compress', () => {
//   return gulp.src('img_src/*.jpg')
//       .pipe(imagemin({
//           progressive: true
//       }))
//       .pipe(gulp.dest('img_src_temp'));       
// });

gulp.task('resize', () => {
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