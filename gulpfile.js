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

// TODO: Bundle up dbhelper using browserify to pull in idb module
gulp.task('bundle-db', ()=>{
    return browserify('./js/dbhelper_src.js')
      .bundle()
      .pipe(source(`dbhelper.js`))
      .pipe(gulp.dest('./js/'))
})