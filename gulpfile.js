const gulp = require('gulp');
const concat = require('gulp-concat');
const uglify = require('gulp-uglify-es').default;
const pump = require('pump');
const gzip = require('gulp-gzip');
const sourcemaps = require('gulp-sourcemaps');


gulp.task('default' , function ( ) { 
    console.log('Gulp is working ');
    
});




gulp.task('scripts', function(cd){
    pump([
	gulp.src('./js/*.js')
		// ,sourcemaps.init()
		,uglify()
		// ,sourcemaps.write()
        ,gulp.dest('./js/uglified')
    ],cd)
    gulp.src('./sw.js')
        .pipe(gulp.dest('./dist'));
});

gulp.task('gzip', function (){ 
	gulp.src('./js/*.js')
		.pipe(gzip())
		.pipe(gulp.dest('./js/uglified'))
})