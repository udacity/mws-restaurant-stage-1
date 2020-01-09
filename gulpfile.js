const gulp = require('gulp');
const del = require('del');
const replace = require('gulp-replace');
const uglify = require('gulp-uglify-es').default;
const cleanCSS = require('gulp-clean-css');
const gulpIf = require('gulp-if');
const useref = require('gulp-useref');
const autoprefixer = require('gulp-autoprefixer');
const htmlclean = require('gulp-htmlclean');
const browserSync = require('browser-sync').create();

/*
const gzip = require('gulp-gzip');
const concat = require('gulp-concat');
const sourcemaps = require('gulp-sourcemaps');
const babel = require('gulp-babel');
const gzip = require('gulp-gzip');
const runSequence = require('run-sequence');
const sourcemaps = require('gulp-sourcemaps');
const concat = require('gulp-concat');
const cache = require('gulp-cache');
const rename = require('gulp-rename');
const imagemin = require('gulp-imagemin');
*/

require('dotenv').config();
const RESTDB_API_KEY = process.env.RESTDB_API_KEY;


// const path = {
//   css: {
//     src: 'app/css/**/*.css',
//     dest: 'dist/css/'
//   },
//   js: {
//     src: 'app/js/**/*.js',
//     dest: 'dist/js/'
//   },
//   images: {
//     src: 'app/imgs/**/*.{jpg,jpeg,png}',
//     dest: 'dist/images/'
//   }
// };

function clean() {
  return del([ 'dist/**/*', '!dist' ]);
}

// Create minified HTML, CSS and JS for distribution
function minifyFiles() {
  return gulp.src('app/*.html')
    .pipe(useref())
    
    //   Minify and create Sourcemap for JS files
    
    // .pipe(gulpIf('*.js', sourcemaps.init()))
    .pipe(gulpIf('*.js', replace('<CORS API key>', RESTDB_API_KEY)))
    .pipe(gulpIf('*.js', uglify()))
    // .pipe(gulpIf('*.js', sourcemaps.write('.')))

    //   Minify and create Sourcemap for CSS files
    .pipe(gulpIf('*.css', autoprefixer({ browsers: ['> 1%', 'last 2 versions', 'Firefox ESR'] })))
    .pipe(gulpIf('*.css', cleanCSS()))

    //    Minify HTML files
    .pipe(gulpIf('*.html', htmlclean()))
    .pipe(gulp.dest('dist'))
}

// Copy manifest and favicon
function copy() {
  return gulp.src([
    'app/favicon.ico',
    'app/sw.js',
    'app/manifest.json'
  ])
  .pipe(gulp.dest('dist'))
  .pipe(gulp.dest('dist'));
}

// Copy images
function images() {
  return gulp.src('app/images/**')
    .pipe(gulp.dest('dist/images'));
};

// Copy icons
function icons() {
  return gulp.src('app/icons/**')
    .pipe(gulp.dest('dist/icons'));
};

// serve original files
function serveApp () {
  browserSync.init({
    server: {
      baseDir: 'app'
    }
  })
}

// Serve optimized files
function serveDist () {
  browserSync.init({
    server: 'dist',
    open: false,
    port: 8001
  });
}

// Process HTML files
function html() {
  return gulp.src('app/*.html')
    .pipe(htmlclean())
    .pipe(gulp.dest('dist'));
}

// TEST Imagemin
function image() {
  return gulp.src('app/images/**/*')
    .pipe(imagemin({optimizationLevel: 5}))
    //.pipe(cache(imagemin({optimizationLevel: 5})))
    .pipe(gulp.dest('dist/images'));
}

// Reloads the browser whenever HTML, CSS or JS files change
function watch() {
  gulp.watch('app/*.html', browserSync.reload);
  gulp.watch('app/css/**/*.css', browserSync.reload);
  gulp.watch('app/js/**/*.js', browserSync.reload); 
}

// const build = gulp.series(clean, minifyFiles, copy, images);
const build = gulp.series(clean, gulp.parallel(minifyFiles, copy, images, icons));
const serve = gulp.series(build, serveDist);

// // Build optimized files
// gulp.task('build', (callback) => {
//   runSequence('clean:dist', ['useref', 'copy', 'images'], callback)
// })

// // Build and serve optimized site
// gulp.task('serve', ['build'], (callback) => {
//   runSequence(['serve:dist'], callback)
// })

exports.clean = clean;
exports.copy = copy;
exports.minifyFiles = minifyFiles;
exports.images = images;
exports.icons = icons;
exports.serve = serve;
exports.build = build;

exports.default = build;
