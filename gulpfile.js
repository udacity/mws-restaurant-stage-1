var gulp = require('gulp');
var del = require('del');
var gm = require('gulp-gm');
var browserify = require('browserify');


gulp.task('image-resize',()=>{
    gulp.src('images_src/**/*')
      .pipe(gm(function(gmfile){
          return gmfile.resize(800);
      },{
          imageMagick:true
      }))
      .pipe(gulp.dest('img'))
})

gulp.task('clear-images', ()=>{
    return del(`img/**/*`)
})

gulp.task('grab-idb', ()=>{
    gulp.src(['node_modules/idb/lib/idb.js'])
      .pipe(gulp.dest('js'))
})