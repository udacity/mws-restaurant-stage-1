var gulp = require('gulp');
var babel = require('gulp-babel');
var autoprefixer = require('gulp-autoprefixer');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var cleanCSS = require('gulp-clean-css');




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
    src: 'img/**/*',
    dest: 'dist/img/'
  }
};





gulp.task('default', gulp.series(function(done) {    
    // task code here
    done();
}));



gulp.task('dist', gulp.parallel(copy_html,copy_images,styles,scripts));



function copy_html(){
	return gulp.src(['./index.html','./manifest.json','./restaurant.html','./service-worker.js'])
		.pipe(gulp.dest('./dist'));
}

function copy_images(){
	return gulp.src(paths.images.src)
		.pipe(gulp.dest(paths.images.dest));
}
function scripts(){
  return gulp.src(paths.scripts.src)
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



