//NOTE to reviewer: I have not implemented this yet, but plan to switch to gulp for importing IDB in project 3

var gulp = require('gulp');
var concat = require('gulp-concat');
var babel = require('gulp-babel');
var uglify = require('uglify');
var sourcemaps = require('sourcemaps');
//have not installed yet
//be sure to add browserfy for import


//will combine all js into singular js file at all.js - make sure to change html file to all.js
gulp.task('scripts', function(){
	gulp.src('js/**/*.js')
		.pipe(babel())
		.pipe(concat('all.js'))
		.pipe(gulp.dest('dist/js'));
});

//distrubution vs of above - also minifies JS files... dont really need a dist file so????
gulp.task('scripts-dist', function(){
	gulp.src('js/**/*.js')
		.pipe(sourcemaps.init())
		.pipe(babel())
		.pipe(concat('all.js'))
		.pipe(uglify())
		.pipe(sourcemaps.write())
		.pipe(gulp.dest('dist/js'));
});

//javascript babel 
