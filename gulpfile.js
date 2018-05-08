var gulp = require('gulp');
var del = require('del');
var gm = require('gulp-gm');
var rename = require('gulp-rename');


var resizeImageTasks =[];

// resize restaurant images
[
  {width: 400, suffix: '1x', source: 'images_src/restaurants/*.{jpg,png}'},
  {width: 800, suffix: '2x', source: 'images_src/restaurants/*.{jpg,png}'},
  {width: 48, suffix: '1x', source: 'images_src/launcher-icon*'},
  {width: 96, suffix: '2x', source: 'images_src/launcher-icon*'}
].forEach((setting)=>{
    var taskName = `resize-image-${setting.width}-${setting.suffix}`;
    // create the task
    gulp.task(taskName, ()=>{
        gulp.src(setting.source)
          .pipe(gm( (gmfile) => {
              return gmfile.resize(setting.width)},
              {imageMagick: true}
          ))
          .pipe(rename({suffix: `-${setting.width}_${setting.suffix}`}))
          .pipe(gulp.dest(`img`))
    });
    // add the task to the array
    resizeImageTasks.push(taskName);
})


gulp.task('resize-images', resizeImageTasks);

/*
gulp.task('image-resize-1x',()=>{
    gulp.src('images_src/restaurants/*')
      .pipe(gm(function(gmfile){
          return gmfile.resize(400);
      },{
          imageMagick:true
      }))
      .pipe(gulp.dest('img'))
})

gulp.task('image-resize-2x',()=>{
    gulp.src('images_src/restaurants/*')
      .pipe(gm(function(gmfile){
          return gmfile.resize(800);
      },{
          imageMagick:true
      }))
      .pipe(gulp.dest('img'))
})*/

gulp.task('clear-images', ()=>{
    return del(`img/**/*`)
})

gulp.task('grab-idb', ()=>{
    gulp.src(['node_modules/idb/lib/idb.js'])
      .pipe(gulp.dest('js'))
})