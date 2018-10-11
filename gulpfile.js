const gulp = require('gulp');
const del = require('del');
const babel = require('gulp-babel');
const uglify = require('gulp-uglify-es').default;
const cleanCSS = require('gulp-clean-css');
const gulpIf = require('gulp-if');
const useref = require('gulp-useref');
const sourcemaps = require('gulp-sourcemaps');
const autoprefixer = require('gulp-autoprefixer');
const htmlclean = require('gulp-htmlclean');
const browserSync = require('browser-sync').create();
const runSequence = require('run-sequence');

//var cssnano = require('gulp-cssnano');
//var concat = require('gulp-concat');
//var cache = require('gulp-cache');
//const rename = require('gulp-rename');
//var imagemin = require('gulp-imagemin');



// serve original files
gulp.task('serve:app', () => {
  browserSync.init({
    server: {
      baseDir: 'app'
    }
  })
})

// Serve optimized files
gulp.task('serve:dist', () => {
  browserSync.init({
    server: 'dist',
    open: false,
    port: 8001
  });
})

// Copy manifest and favicon
gulp.task('copy', () => {
  return gulp.src([
    'app/favicon.png',
    'app/sw.js',
    'app/manifest.json'
  ])
  .pipe(gulp.dest('dist'))
  .pipe(gulp.dest('dist'));
});

// Copy images
gulp.task('images', () => {
  return gulp.src('app/images/**')
    .pipe(gulp.dest('dist/images'));
});

// Process HTML files
gulp.task('html', function () {
  return gulp.src('app/*.html')
    .pipe(htmlclean())
    .pipe(gulp.dest('dist'));
});

// TEST Imagemin
gulp.task('image', () => {
  return gulp.src('app/images/**/*')
    .pipe(imagemin({optimizationLevel: 5}))
    //.pipe(cache(imagemin({optimizationLevel: 5})))
    .pipe(gulp.dest('dist/images'));
})

/*
// Copy SW
gulp.task('sw', () => {
  return gulp.src('./sw.js')
    .pipe(uglify())
    .pipe(gulp.dest('dist/'));
});


// Process JS files
gulp.task('js', () => {
  return gulp.src('app/js/main.js', { sourcemaps: true })
  //.pipe(sourcemaps.init())
  .pipe(babel())
  .pipe(uglify())
  
  //.pipe(sourcemaps.write('.'))
  .pipe(gulp.dest('dist/js'));
});
*/

// Create minified HTML, CSS and JS for distribution
gulp.task('useref', () => {
  return gulp.src('app/*.html')
    .pipe(useref())
    
    /**   Minify and create Sourcemap for JS files    **/
    .pipe(gulpIf('*.js', sourcemaps.init()))
    .pipe(gulpIf('*.js', uglify()))
    .pipe(gulpIf('*.js', sourcemaps.write('.')))

    /**   Minify and create Sourcemap for CSS files   **/
    .pipe(gulpIf('*.css', sourcemaps.init()))
    .pipe(gulpIf('*.css', autoprefixer({ browsers: ['> 1%', 'last 2 versions', 'Firefox ESR'] })))
    .pipe(gulpIf('*.css', cleanCSS()))
    .pipe(gulpIf('*.css', sourcemaps.write('.')))

    /**    Minify HTML files    **/
    .pipe(gulpIf('*.html', htmlclean()))
    .pipe(gulp.dest('dist'))
});

// Reloads the browser whenever HTML, CSS or JS files change
gulp.task('watch', ['serve:app'], () => {
  gulp.watch('app/*.html', browserSync.reload);
  gulp.watch('app/css/**/*.css', browserSync.reload);
  gulp.watch('app/js/**/*.js', browserSync.reload); 
});

// Delete all files in Distribution directory
gulp.task('clean:dist', () => {
  return del.sync('dist/**/*');
})

// Build optimized files
gulp.task('build', (callback) => {
  runSequence('clean:dist', ['useref', 'copy', 'images'], callback)
})

// Build and serve optimized site
gulp.task('serve', ['build'], (callback) => {
  runSequence(['serve:dist', 'watch'], callback)
})