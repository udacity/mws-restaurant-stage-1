var gulp = require('gulp');

gulp.task('default', defaultTask);

function defaultTask(done) {

	gulp.watch('index.html', ['trackChanges']);

	done();
}

gulp.task('trackChanges', trackChanges);

function trackChanges() {
	console.log('index changed');
}