var gulp = require('gulp');
var concat = require('gulp-concat');

gulp.task('default', defaultTask);
gulp.task('scripts', scripts);

function defaultTask(done) {
	done();
}

function scripts() {
	gulp.src('js/**/*.js')
		.pipe(gulp.dest('dist/js'));
}

function scriptsDist() {
	console.log('todo');
}