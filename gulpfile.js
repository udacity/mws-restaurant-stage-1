var gulp = require('gulp');
const babel = require('gulp-babel');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var imagemin = require('gulp-imagemin');
var pngquant = require('imagemin-pngquant');
const imageminMozjpeg = require('imagemin-mozjpeg');

gulp.task('default', ['images', 'scripts'],  defaultTask);
gulp.task('images', images);
gulp.task('scripts', scripts);
gulp.task('scripts-dist', scriptsDist);

function defaultTask(done) {
	done();
}

function scripts() {
	gulp.src('js/**/*.js')
		//.pipe(babel({presets: ['env']}))
		//.pipe(concat('scripts.js'))
		.pipe(gulp.dest('dist/js'));
}

function scriptsDist() {
	gulp.src('js/**/*.js')
		//.pipe(babel({presets: ['env']}))
		//.pipe(concat('scripts.js'))
		//.pipe(uglify())
		.pipe(gulp.dest('dist/js'));
}

function images(){

	gulp.src('img/icon.png')
		.pipe(gulp.dest('dist/img'));

	gulp.src('img/*.jpg')
 		.pipe(imagemin({
			progressive: true,
			use: [pngquant()]
		}))
		.pipe(imagemin([imageminMozjpeg({
			quality: 85
	
		})]))		
		.pipe(gulp.dest('dist/img'));

	gulp.src('img/thumbnails/*.jpg')
 		.pipe(imagemin({
			progressive: true,
			use: [pngquant()]
		}))
		.pipe(imagemin([imageminMozjpeg({
			quality: 50
	
		})]))		
		.pipe(gulp.dest('dist/img/thumbnails'));
}