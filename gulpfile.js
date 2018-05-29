const gulp = require('gulp');
const htmlmin = require('gulp-htmlmin');        // minifies html files
const sass = require('gulp-sass');              // compiles sass and minifies html
const postcss = require('gulp-postcss');        // required by the autoprefixer
const autoprefixer = require('autoprefixer');   // adds vendor prefixes to html for better browser compatibility
const critical = require('critical');           // inlines critical css
const browserify = require('browserify');       // transpiles ES6 to ES5
const babelify = require('babelify');           // transpiles ES6 to ES5
const source = require('vinyl-source-stream');  // makes it easier to work with browserify
const buffer = require('vinyl-buffer');         // makes it easier to work with browserify
const uglify = require('gulp-uglify');          // minifies js code
const sourcemaps = require('gulp-sourcemaps');  // generates source maps
const browserSync = require('browser-sync').create();   // development server
const del = require('del');                     // deletes a file or folder
const size = require('gulp-size');              // displays the size of the project
const rename = require('gulp-rename');          // renames a file
const runSequence = require('run-sequence');    // runs tasks sequentially (they run asynchronously by default)

// clean the dist directory
gulp.task('del', done =>
    del(['dist'], done)
);

/* ====================  HTML  ==================== */

// copy html files
gulp.task('html-copy', () =>
    gulp.src('src/**/*.html')
        .pipe(gulp.dest('./dist'))
);

// minify html files
gulp.task('html-minify', () =>
    gulp.src('dist/**/*.html')
        .pipe(htmlmin({
            removeComments: true,
            collapseWhitespace: true,
            cssmin: true
        }))
        .pipe(gulp.dest('./dist'))
);

// inline critical styles
gulp.task('critical', function (cb) {
    const filePaths = ['index.html', 'restaurant.html'];
    let stream;

    for (const filePath of filePaths) {
        stream = critical.generate({
            base: './',
            inline: true,
            src: `src/${filePath}`,
            css: ['dist/css/styles.css'],
            dimensions: [{
                width: 320,
                height: 480
            }, {
                width: 768,
                height: 1024
            }, {
                width: 1280,
                height: 960
            }, {
                width: 1920,
                height: 1080
            }],
            dest: `dist/${filePath}`,
            minify: true,
            extract: false,
            ignore: ['font-face']
        });
    }

    return stream;
});

gulp.task('html', done =>
    runSequence('html-copy', 'critical', 'html-minify', () => done())
);

// watch html files
gulp.task('html:watch', () =>
    gulp.watch('src/**/*.html', ['html'])
        .on('change', browserSync.reload)
);

/* ====================  SASS  ==================== */

/**
 * Bundles a sass file from a given entry path to a given output path
 * @param {*} param0 
 * @param {String} param0.entry - path to the entry file
 * @param {String} param0.output - path to the output file
 */
function bundleSASS({ entry, ouput } = { entry: 'src/sass/styles.scss', ouput: 'dist/css/styles.css' }) {
    const splitPath = ouput.split('/');
    const outputFile = splitPath[splitPath.length - 1];
    const outputDir = splitPath.slice(0, -1).join('/');

    return gulp.src(entry)
        .pipe(sourcemaps.init())
        .pipe(sass({ outputStyle: 'compressed' }).on('error', sass.logError))
        .pipe(postcss([autoprefixer('last 2 version', '>= 5%')]))
        .pipe(rename(outputFile))
        .pipe(sourcemaps.write('.'))
        .pipe(size())
        .pipe(gulp.dest(outputDir));
}

// build sass files
gulp.task('sass', () =>
    bundleSASS({
        entry: 'src/sass/styles.scss',
        ouput: 'dist/css/styles.css'
    }).pipe(browserSync.stream())
);

// watch sass files
gulp.task('sass:watch', () =>
    gulp.watch('src/sass/**/*.scss', ['sass'])
);

/**
 * Bundles a JavaScript file from a given entry path to a given output path
 * @param {*} param0 
 * @param {String} param0.entry - path to the entry file
 * @param {String} param0.output - path to the output file
 */
function bundleJS({ entry, ouput } = { entry: 'src/js/main.js', ouput: 'dist/js/main.js' }) {
    const splitPath = ouput.split('/');
    const outputFile = splitPath[splitPath.length - 1];
    const outputDir = splitPath.slice(0, -1).join('/');

    return browserify(entry)
        .transform(babelify, { presets: ['env'] })
        .bundle()
        .pipe(source(outputFile))
        .pipe(buffer())
        .pipe(sourcemaps.init())
        .pipe(uglify())
        .pipe(size())
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest(outputDir));
}

/* ====================  JAVASCRIPT  ==================== */

// main.js - main script
gulp.task('main', () =>
    bundleJS({
        entry: 'src/js/main.js',
        ouput: 'dist/js/main.js'
    })
);

// main.js - restaurant_info script
gulp.task('restaurant_info', () =>
    bundleJS({
        entry: 'src/js/restaurant_info.js',
        ouput: 'dist/js/restaurant_info.js'
    })
);

// sw.js - service worker script
gulp.task('sw', () =>
    bundleJS({
        entry: 'src/sw.js',
        ouput: 'dist/sw.js'
    })
);

// buld js files
gulp.task('js', ['main', 'restaurant_info', 'sw']);

// watch js files
gulp.task('js:watch', () =>
    gulp.watch('src/js/**/*.js', ['js'])
        .on('change', browserSync.reload)
);

/* ====================  IMAGES  ==================== */

// build images for development
gulp.task('images', () =>
    gulp.src('src/img/**')
        .pipe(gulp.dest('dist/img'))
);

// watch images
gulp.task('images:watch', () =>
    gulp.watch('src/img/**', ['images'])
        .on('change', browserSync.reload)
);

/* ====================  BROWSER-SYNC  ==================== */

// development server
gulp.task('browser-sync', () =>
    browserSync.init({
        server: {
            baseDir: 'dist'
        },
        port: 8000
    })
);

/* ====================  SCRIPTS  ==================== */

// build
gulp.task('build', done =>
    runSequence('del', 'sass', ['html', 'js', 'images'], () => done())
);

// watch
gulp.task('watch', done =>
    runSequence('build', ['html:watch', 'js:watch', 'sass:watch', 'images:watch', 'browser-sync'], () => done())
);