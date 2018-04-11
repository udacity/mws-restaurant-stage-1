var gulp = require('gulp'),
eslint = require('gulp-eslint');

gulp.task('default', ['lint'], function() {
  gulp.watch('js/**/*.js', ['lint']);
});

gulp.task('lint', () => {
  return gulp.src(['js/**/*.js'])
    .pipe(eslint())
    .pipe(eslint.format())
    .pipe(eslint.failOnError());
});