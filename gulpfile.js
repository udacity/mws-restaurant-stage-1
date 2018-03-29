var gulp        = require('gulp');
var browserSync = require('browser-sync').create();

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

gulp.task('default', []);

