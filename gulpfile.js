const gulp = require('gulp');
const babel = require('gulp-babel');
// const rename = require("gulp-rename");
const eslint = require('gulp-eslint');
const concat = require('gulp-concat');
const cleanCSS = require('gulp-clean-css');
const sourcemaps = require('gulp-sourcemaps');
const responsive = require('gulp-responsive');
const uglify = require('gulp-uglify-es').default;
const autoprefixer = require('gulp-autoprefixer');
const browserSync = require('browser-sync').create();


/*
============= TODOS =============
- Add gzip compression to text based files
- Add lazy loading
- create a HTTP/2 server to serve content
- fallback HTTP/1 server
*/

/**
 * abstracting away file paths for every task
 * so that we don't have to change every occurence
 * of that path
 */

const paths = {
  styles: {
    src: 'src/css/**/*.css',
    dest: 'build/css'
  },
  js: {
    main: {
      src: [
        'src/scripts/js/dbhelper.js',
        'src/scripts/js/main.js',
        '!node_modules/**'
      ],
      dest: 'build/scripts/js',
      fileName: 'main.js'
    },
    inside: {
      src: [
        'src/scripts/js/dbhelper.js',
        'src/scripts/js/restaurant_info.js',
        '!node_modules/**'
      ],
      dest: 'build/scripts/js',
      fileName: 'inside.js'
    }
  },
  mjs: {
    src: ['src/scripts/mjs/*.mjs','!node_modules/**'],
    dest: 'build/scripts/mjs'
  },
  lint: {
    // linting files with both .js and .mjs extensions
    src: ['src/scripts/**/*.{mjs,js}','!node_modules/**']
  },
  imgs: {
    src: 'src/img/**',
    dest: 'build/img',
    // widths to generate images
    // if src_image_width > generated_img_width
    // set object with value as width value
    // and enlarge property to true
    widths: [
      300,
      400,
      500,
      600,
      800,
      {value: 1000, enlarge: true},
      {value: 1200, enlarge: true}
    ]
  },
  data: {
    src: 'src/data/**/*.json',
    dest: 'build/data'
  }
};

/******************
    Styles tasks
******************/

function stylesTask() {
  return gulp.src(paths.styles.src)
    .pipe(
      autoprefixer({
        browsers: ['last 2 versions']
      })
    )
    .pipe(gulp.dest(paths.styles.dest))
    .pipe(browserSync.stream());
}


exports.styles = stylesTask;

function stylesProdTask() {
  return gulp.src(paths.styles.src)
    .pipe(sourcemaps.init())
    // auto prefexing
    .pipe(
      autoprefixer({
        browsers: ['last 2 versions']
      })
    )
    .pipe(cleanCSS({debug: true}, (details) => {
      console.log(`${details.name}: ${details.stats.originalSize}`);
      console.log(`${details.name}: ${details.stats.minifiedSize}`);
    }))
    .pipe(sourcemaps.write())
    .pipe(gulp.dest(paths.styles.dest));
}

exports['styles-prod'] = stylesProdTask;


/******************
    Linting tasks
******************/

function lintTask() {
  return gulp.src(paths.lint.src)
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
 * concat scripts
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
  concatScript(paths.js.main);
  concatScript(paths.js.inside);
  done();
}

exports['js-scripts'] = jsScriptsTask;

/**
 * concat and uglify scripts
 */
function concatAndUglifyScript(details) {
  gulp.src(details.src)
    .pipe(sourcemaps.init())
    .pipe(babel({
      presets: ['@babel/preset-env']
    }))
    .pipe(concat(details.fileName))
    .pipe(uglify())
    .pipe(sourcemaps.write())
    .pipe(gulp.dest(details.dest));
}

function jsScriptsProdTask(done) {
  concatAndUglifyScript(paths.js.main);
  concatAndUglifyScript(paths.js.inside);
  done();
}

exports['js-scripts-prod'] = jsScriptsProdTask;


/*======= modules =======*/

function mjsScriptsTask() {
  return gulp.src(paths.mjs.src)
    .pipe(gulp.dest(paths.mjs.dest));
}

exports['mjs-scripts'] = mjsScriptsTask;

function mjsScriptsProdTask() {
  return gulp.src(paths.mjs.src)
    .pipe(sourcemaps.init())
    .pipe(uglify())
    .pipe(sourcemaps.write())
    .pipe(gulp.dest(paths.mjs.dest));
}

exports['mjs-scripts-prod'] = mjsScriptsProdTask;


/*======= Both =======*/

exports['scripts'] = gulp.parallel(jsScriptsTask, mjsScriptsTask);

exports['scripts-prod'] = gulp.parallel(jsScriptsProdTask, mjsScriptsProdTask);


/******************
    images tasks
******************/

/**
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
  return gulp.src(paths.imgs.src)
    .pipe(responsive(
      getResponsiveConfig(paths.imgs.widths)
    ))
    .pipe(gulp.dest(paths.imgs.dest));
}

exports['optimize-images'] = optImgsTask;

/******************
    Copy tasks
******************/

function copyImgsTask() {
  return gulp.src(paths.imgs.src)
    .pipe(gulp.dest(paths.imgs.dest));
}

exports['copy-images'] = copyImgsTask;

function copyDataTask() {
  return gulp.src(paths.data.src)
    .pipe(gulp.dest(paths.data.dest));
}

exports['copy-data'] = copyDataTask;


/******************
    dev task
******************/

function devTask(done) {
  gulp.watch(paths.styles.src, stylesTask);
  gulp.watch(paths.lint.src, lintTask);

  // listening for changes in the html file
  // and reloading browserSync on changes
  gulp.watch('./*.html')
    .on('change', browserSync.reload);

  browserSync.init({
    server: {
      baseDir: './'
    }
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
exports.build = gulp.parallel(
  optImgsTask,
  stylesProdTask,
  copyDataTask,
  gulp.series(
    lintTask,
    gulp.parallel(jsScriptsProdTask, mjsScriptsProdTask)
  )
);

/******************
    default task
******************/

exports.default = gulp.series(
  gulp.parallel(
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