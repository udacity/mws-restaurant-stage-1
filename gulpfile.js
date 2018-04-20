var gulp = require('gulp');
var browserSync = require('browser-sync').create();
var responsive = require('gulp-responsive');

gulp.task('watch', function () {
    browserSync.init({
        server: "./",
        port: 8000
    });
    let files = ["css/*.css", "js/*.js", "index.html"];

    files.forEach((file) => {
        gulp.watch(file).on('change', browserSync.reload);
    });
});

gulp.task('images', function () {
    return gulp.src('img/*.jpg')
        .pipe(responsive({
            '*.jpg': [
                {
                    width: 320,
                    rename: {suffix: '-320w'}
                },
                {
                    width: 320,
                    rename: {suffix: '-320w'}
                },
                {
                    width: 480,
                    rename: {suffix: '-480w'}
                },
                {
                    width: 560,
                    rename: {suffix: '-560w'}
                },
                {
                    width: 800,
                    rename: {suffix: '-800w'}
                },

            ]
        }, {
            quality: 80,
            progressive: true,
            withMetadata: false
        })
        )
        .pipe(gulp.dest('images'));
});

gulp.task('default', []);

