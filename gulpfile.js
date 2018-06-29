var gulp = require('gulp');
const babel = require('gulp-babel');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');

gulp.task('default', ['scripts'],  defaultTask);
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