const gulp = require('gulp');
const sass = require('gulp-sass');
const autoprefixer = require('gulp-autoprefixer');
const minifyCss = require('gulp-minify-css');
const runSequence = require('run-sequence');
const del = require('del');
const concat = require('gulp-concat');
const sourcemaps = require('gulp-sourcemaps');
const eslint = require('gulp-eslint');
const plumber = require('gulp-plumber');
const uglify = require('gulp-uglify');
const babel = require('gulp-babel');
const shell = require('gulp-shell');
const gConfig = require('./gulp.config.js');


//Default task
gulp.task('default', function (callback) {
    runSequence('start', ['lint', 'watch'], callback);
});

gulp.task('start', function (callback) {
    runSequence('clean', 'copy-start', callback); //run clean first, then copy-build
});

gulp.task('build', function (callback) {
    runSequence('clean', 'copy-build', callback); //run clean first, then copy-build
});

gulp.task('clean', function (callback) {
    return del([gConfig.build.dir], {force: true}, callback);
});

gulp.task('copy-start', ['styles', 'copy-html', 'scripts:main', 'scripts:restaurant', 'scripts-sw', 'copy-data']);

gulp.task('copy-build', ['styles', 'copy-html', 'copy-imgs', 'scripts-dist:main', 'scripts-dist:restaurant', 'scripts-sw', 'copy-data']);

gulp.task('styles', function () {
    gulp.src(gConfig.app_file.scss_src)
        .pipe(sass({outputStyle: 'compressed'}).on('error', sass.logError))
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
    return gulp.src(['**/*.js', '!node_modules/**'])
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

gulp.task('scripts:main', function () {
    gulp.src(gConfig.app_file.js_main_src)
        .pipe(plumber())
        .pipe(babel({
            presets: ['env']
        }))
        .pipe(concat('main.js'))
        .pipe(gulp.dest(gConfig.build.build_js))
});

gulp.task('scripts:restaurant', function () {
    gulp.src(gConfig.app_file.js_restaurant_src)
        .pipe(plumber())
        .pipe(babel({
            presets: ['env']
        }))
        .pipe(concat('restaurant_info.js'))
        .pipe(gulp.dest(gConfig.build.build_js))
});

gulp.task('scripts-dist:main', function () {
    gulp.src(gConfig.app_file.js_main_src)
        .pipe(plumber())
        .pipe(sourcemaps.init())
        .pipe(babel({
            presets: ['env']
        }))
        .pipe(concat('main.js'))
        .pipe(uglify())
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest(gConfig.build.build_js));
});

gulp.task('scripts-dist:restaurant', function () {
    gulp.src(gConfig.app_file.js_restaurant_src)
        .pipe(plumber())
        .pipe(sourcemaps.init())
        .pipe(babel({
            presets: ['env']
        }))
        .pipe(concat('restaurant_info.js'))
        .pipe(uglify())
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest(gConfig.build.build_js))
});

gulp.task('scripts-sw', function () {
    gulp.src('./sw.js')
        .pipe(gulp.dest(gConfig.build.dir));
});

gulp.task('copy-html', function () {
    gulp.src(gConfig.app_file.html_src)
        .pipe(gulp.dest(gConfig.build.build_html));
});

gulp.task('copy-imgs', shell.task('grunt'));

gulp.task('copy-data', function () {
    gulp.src(gConfig.app_file.data_src)
        .pipe(gulp.dest(gConfig.build.build_data))
});

gulp.task('watch', function () {
    gulp.watch(gConfig.app_file.scss_src, ['styles']);
    gulp.watch(gConfig.app_file.js_main_src, ['lint']);
    gulp.watch(gConfig.app_file.js_restaurant_src, ['lint']);
    gulp.watch(gConfig.app_file.html_src, ['copy-html']);
    gulp.watch(gConfig.app_file.img_src, ['copy-imgs']);
});