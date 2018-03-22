const gulp = require('gulp');
const sass = require('gulp-sass');
const autoprefixer = require('gulp-autoprefixer');
const minifyCss = require('gulp-minify-css');
const runSequence = require('run-sequence');
const del = require('del');
const sourcemaps = require('gulp-sourcemaps');
const eslint = require('gulp-eslint');
const gConfig = require('./gulp.config.js');

//Default task
gulp.task('default', function(callback) {
    runSequence('build', ['lint', 'watch'], callback);
});

gulp.task('build', function (callback) {
    runSequence('clean', 'copy-build', callback); //run clean first, then copy-build
});

gulp.task('clean', function (callback) {
    return del([gConfig.build.build_css], {force: true}, callback);
});

gulp.task('copy-build', ['styles']);

gulp.task('styles', function () {
    gulp.src(gConfig.app_file.scss_src)
        .pipe(sass().on('error', sass.logError))
        .pipe(autoprefixer({
            browsers: ['last 2 versions'],
            cascade: false
        }))
        .pipe(minifyCss())
        .pipe(sourcemaps.write())
        .pipe(gulp.dest(gConfig.build.build_css));
});

gulp.task('lint', () => {
    // ESLint ignores files with "node_modules" paths.
    // So, it's best to have gulp ignore the directory as well.
    // Also, Be sure to return the stream from the task;
    // Otherwise, the task may end before the stream has finished.
    return gulp.src(['**/*.js','!node_modules/**'])
    // eslint() attaches the lint output to the "eslint" property
    // of the file object so it can be used by other modules.
        .pipe(eslint())
        // eslint.format() outputs the lint results to the console.
        // Alternatively use eslint.formatEach() (see Docs).
        .pipe(eslint.format())
        // To have the process exit with an error code (1) on
        // lint error, return the stream and pipe to failAfterError last.
        .pipe(eslint.failAfterError());
});

gulp.task('watch', function () {
    gulp.watch(gConfig.app_file.scss_src, ['styles']);
    gulp.watch(gConfig.app_file.js_src, ['lint']);
});