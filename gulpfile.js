var gulp = require('gulp');
var babel = require('gulp-babel');
var autoprefixer = require('gulp-autoprefixer');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var cleanCSS = require('gulp-clean-css');
var imageResize = require('gulp-image-resize');
var sourcemaps = require('gulp-sourcemaps');
var uglify = require('gulp-uglify-es').default;
var gzip = require('gulp-gzip');
var browserSync = require('browser-sync').create();
var compression   = require("compression");


var paths = {
  styles: {
    src: 'css/**/*.css',
    dest: 'dist/css/'
  },
  scripts: {
    src: 'js/**/*.js',
    dest: 'dist/js/'
  },
  images: {
    src: 'img/*.*',
    dest: 'dist/img/',
    dest_dev: 'img/small/'
  },
  icons: {
    src: 'icons/**/*',
    dest: 'dist/icons/'
  }
};



gulp.task('default', gulp.series(create_smaller_images_dev,webserverRoot));

gulp.task('dist', gulp.parallel(copy_images,copy_icons,create_smaller_images_dist,styles,styles_gzip,scripts_main,scripts_main_gzip,scripts_restaurant,scripts_restaurant_gzip));

//gulp.task('dist-serve', gulp.series(copy_html,copy_images,copy_icons,create_smaller_images_dist,styles,styles_gzip,scripts,scripts_gzip,webserverDist));


function webserverRoot(){
  return  browserSync.init({
    server: {
        baseDir: './'
    },
    port: 8080
});
}

function webserverDist(){
  return browserSync.init({
    server: {
        baseDir: 'dist',
        middleware: compression()
    },
    port: 8080
});
}


function copy_html(){
	return gulp.src(['./manifest.json','./service-worker.js','./favicon.ico'])
		.pipe(gulp.dest('./dist'));
}

function copy_images(){
	return gulp.src(paths.images.src)
		.pipe(gulp.dest(paths.images.dest));
}
function copy_icons(){
	return gulp.src(paths.icons.src)
		.pipe(gulp.dest(paths.icons.dest));
}
function create_smaller_images_dist(){
	return gulp.src(paths.images.src)
        .pipe(imageResize({
          width : 500,
          crop : false,
          upscale : false
        }))
        .pipe(gulp.dest(`${paths.images.dest}/small/`));
}
function create_smaller_images_dev(){
	return gulp.src(paths.images.src)
        .pipe(imageResize({
          width : 500,
          crop : false,
          upscale : false
        }))
        .pipe(gulp.dest(paths.images.dest_dev));
}
function scripts(){
  return gulp.src(paths.scripts.src)
        .pipe(uglify())
      .pipe(gulp.dest(paths.scripts.dest));

}
function scripts_gzip(){
  return gulp.src(paths.scripts.src)
        .pipe(uglify())
        .pipe(gzip())
      .pipe(gulp.dest(paths.scripts.dest));
}

function scripts_main(){
    return gulp.src(['js/main.js','js/dbhelper.js','js/idb.js'])
        .pipe(uglify())
        .pipe(concat('main_all.js'))
      .pipe(gulp.dest(paths.scripts.dest));
}
function scripts_main_gzip(){
  return gulp.src(['js/main.js','js/dbhelper.js','js/idb.js'])
      .pipe(uglify())
      .pipe(concat('main_all.js'))
      .pipe(gzip())
    .pipe(gulp.dest(paths.scripts.dest));
}

function scripts_restaurant(){
  return gulp.src(['js/restaurant_info.js','js/dbhelper.js','js/idb.js'])
      .pipe(uglify())
      .pipe(concat('restaurant_info_all.js'))
    .pipe(gulp.dest(paths.scripts.dest));
}
function scripts_restaurant_gzip(){
return gulp.src(['js/restaurant_info.js','js/dbhelper.js','js/idb.js'])
    .pipe(uglify())
    .pipe(concat('restaurant_info_all.js'))
    .pipe(gzip())
  .pipe(gulp.dest(paths.scripts.dest));
}




function styles(){
	return gulp.src(paths.styles.src)
		.pipe(autoprefixer({
			browsers: ['last 2 versions']
		}))
    .pipe(cleanCSS())
		.pipe(gulp.dest(paths.styles.dest))
}
function styles_gzip(){
	return gulp.src(paths.styles.src)
		.pipe(autoprefixer({
			browsers: ['last 2 versions']
		}))
    .pipe(cleanCSS())
    .pipe(gzip())
		.pipe(gulp.dest(paths.styles.dest))
}



