const gulp = require('gulp');
const imagemin = require('gulp-imagemin');
const webp = require('gulp-webp');
 
gulp.task('images:compress', () =>
    gulp.src('img/*.{gif,jpg,png,svg}')
        .pipe(imagemin({
        	progressive: true
        }))
        .pipe(webp())
        .pipe(gulp.dest('img/min'))
);

