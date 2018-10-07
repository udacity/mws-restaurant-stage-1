const gulp = require('gulp');
// used to delete folders and files
const rimraf = require('rimraf');
// config contains all file build paths, image sizes and all
const config = require('./config');
// used to convert files to es5
const babel = require('gulp-babel');
// used to lint code for syntax errors
const eslint = require('gulp-eslint');
// used to rename files
const rename = require('gulp-rename');
// used to combine a set of defined files into one big file
const concat = require('gulp-concat');
// used to replace string
const replace = require('gulp-replace');
// used to minify css
const cleanCSS = require('gulp-clean-css');
// used to generate source map
const sourcemaps = require('gulp-sourcemaps');
// used to generate/optimize images
const responsive = require('gulp-responsive');
// used to minify .js files (compatible with es6)
const uglify = require('gulp-uglify-es').default;
// used to autoprefix css
const autoprefixer = require('gulp-autoprefixer');
// used to do live editing in the browser
const browserSync = require('browser-sync').create();
const compression = require('compression');

/******************
    Styles tasks
******************/

function stylesTask() {
  return gulp.src(config.styles.src)
    .pipe(
      autoprefixer({
        browsers: ['last 2 versions']
      })
    )
    .pipe(cleanCSS({debug: true}, (details) => {
      console.log(`${details.name}: ${details.stats.originalSize}`);
      console.log(`${details.name}: ${details.stats.minifiedSize}`);
    }))
    .pipe(gulp.dest(config.styles.dest))
    .pipe(sourcemaps.write())
    .pipe(browserSync.stream());
}

exports.styles = stylesTask;

function stylesProdTask() {
  return gulp.src(config.styles.src)
    .pipe(sourcemaps.init())
    // auto prefexing
    .pipe(
      autoprefixer({
        browsers: ['last 2 versions']
      })
    )
    .pipe(cleanCSS())
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest(config.styles.dest));
}

exports['styles-prod'] = gulp.series(function(cb) {
  rimraf(config.styles.dest, cb);
}, stylesProdTask);


/******************
    Linting tasks
******************/

function lintTask() {
  return gulp.src(config.lint.src)
    // eslint() attaches the lint output to the 'eslint' property
    // of the file object so it can be used by other modules.
    .pipe(eslint())
    // eslint.format() outputs the lint results to the console.
    // Alternatively use eslint.formatEach() (see Docs).
    .pipe(eslint.formatEach())
    // To have the process exit with an error code (1) on
    // lint error, return the stream and pipe to failAfterError last.
    .pipe(eslint.failAfterError());
}

exports.lint = lintTask;

/******************
    Scripts tasks
******************/

/*======= bundled scripts =======*/

/**
 * concat scripts and transpile to es5
 */
function concatScript(details) {
  gulp.src(details.src)
    .pipe(sourcemaps.init())
    .pipe(babel({
      presets: ['@babel/preset-env']
    }))
    .pipe(concat(details.fileName))
    .pipe(sourcemaps.write())
    .pipe(gulp.dest(details.dest));
}

function jsScriptsTask(done){
  concatScript(config.js.main);
  concatScript(config.js.inside);
  done();
}

exports['js-scripts'] = jsScriptsTask;

/**
 * concat, uglify and transpile (to es5) scripts
 */
function concatAndUglifyScript(details) {
  gulp.src(details.src)
    .pipe(sourcemaps.init())
    .pipe(babel({
      presets: ['@babel/preset-env']
    }))
    .pipe(concat(details.fileName))
    .pipe(uglify())
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest(details.dest));
}

function jsScriptsProdTask(done) {
  concatAndUglifyScript(config.js.main);
  concatAndUglifyScript(config.js.inside);
  done();
}

exports['js-scripts-prod'] = jsScriptsProdTask;


/*======= modules =======*/

function mjsScriptsTask() {
  return gulp.src(config.mjs.src)
    .pipe(rename({
      extname: '.mjs'
    }))
    .pipe(gulp.dest(config.mjs.dest));
}

exports['mjs-scripts'] = mjsScriptsTask;

function mjsScriptsProdTask() {
  return gulp.src(config.mjs.src)
    .pipe(replace('//<<-!->>', ''))
    .pipe(replace('//<<-!->>', ''))
    .pipe(rename({
      extname: '.mjs'
    }))
    .pipe(sourcemaps.init())
    .pipe(uglify())
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest(config.mjs.dest));
}

exports['mjs-scripts-prod'] = mjsScriptsProdTask;


/*======= service worker =======*/

function copySWTask() {
  return gulp.src(config.sw.src)
    .pipe(gulp.dest(config.sw.dest));
}

exports['sw-script'] = copySWTask;

/*======= Both =======*/

exports['scripts'] = gulp.parallel(jsScriptsTask, mjsScriptsTask);

exports['scripts-prod'] = gulp.parallel(jsScriptsProdTask, mjsScriptsProdTask);


/******************
    images tasks
******************/

/**
 * PS. I can honestly say that I have wasted
 * more time writing this helper than I have saved
 * or will ever save
 *
 * generate gulp-responsive configuration object
 * @param {Array} widths - image widths to genrate.
 *  if element is an object, must provide 'width'
 *  property && (optional) 'enlarge' which is the opposite of
 * 'withoutEnlargement' option, defaults to 'false'.
 * check: http://sharp.dimens.io/en/stable/api-resize/#withoutenlargement
 * @param {string} ext - extension to generate this for, defaults to 'jpg'
 */
function getResponsiveConfig(widths, ext = 'jpg') {
  const arr = [];
  for(const width of widths) {
    let w, enlarge = false;
    if(typeof width === 'number') {
      w = width;
    } else if (typeof width === 'object' &&
              width.hasOwnProperty('value')) {
      w = width.value;
      enlarge = Boolean(width.enlarge);
    }
    arr.push({
      width: w,
      rename: {
        suffix: `-${w}w`,
      },
      progressive: true,
      withoutEnlargement: !enlarge
    });
  }
  return {[`*.${ext}`]: arr};
}

/**
 * generates images for given widths
 */
function optImgsTask() {
  return gulp.src(config.imgs.src)
    .pipe(responsive(
      getResponsiveConfig(config.imgs.widths)
    ))
    .pipe(gulp.dest(config.imgs.dest));
}

exports['optimize-images'] = optImgsTask;

/******************
    Copy tasks
******************/

function copyImgsTask() {
  return gulp.src(config.imgs.src)
    .pipe(gulp.dest(config.imgs.dest));
}

exports['copy-images'] = copyImgsTask;

function copyHTMLTask() {
  return gulp.src(config.html.src)
    .pipe(gulp.dest(config.html.dest));
}

exports['copy-html'] = copyHTMLTask;

function copyDataTask() {
  return gulp.src(config.data.src)
    .pipe(gulp.dest(config.data.dest));
}

exports['copy-data'] = copyDataTask;


/******************
    dev task
******************/

function devTask(done) {
  gulp.watch(config.styles.src, stylesTask);
  gulp.watch(config.lint.src, lintTask);
  // listening for changes in the html file
  // and reloading browserSync on changes
  gulp.watch(config.html.src)
    .on('change', browserSync.reload);

  browserSync.init({
    server: {
      baseDir: './app/'
    },
    middleware: [compression()]
  });
  done();
}

exports.dev = devTask;

/******************
    prod task
******************/

/**
 * running all tasks in parallel
 * for the exception of the linting task
 * that runs before the scripts task
 */
exports.build = gulp.series(
  function (cb) {
    rimraf('./app', cb);
  },
  gulp.parallel(
    optImgsTask,
    stylesProdTask,
    copyDataTask,
    copyHTMLTask,
    // the reason why these tasks are in series
    // because we shouldn't do one before the other
    // if we have a syntax error we want to be notified
    gulp.series(
      lintTask,
      gulp.parallel(jsScriptsProdTask, mjsScriptsProdTask)
    )
  )
);

/******************
    default task
******************/


exports.default = gulp.series(
  gulp.parallel(
    function (cb) {
      rimraf('./app', cb);
    },
    optImgsTask,
    stylesTask,
    copyDataTask,
    gulp.series(
      lintTask,
      gulp.parallel(jsScriptsTask, mjsScriptsTask)
    )
  ),
  devTask
);