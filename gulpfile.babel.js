import gulp from 'gulp';
import responsive from 'gulp-responsive';
import del from 'del';
import runSequence from 'run-sequence';

///Responsive images
gulp.task('jpg-images', function(){
    return gulp.src('images/**/*.jpg')
    .pipe(responsive({
        '**/*.jpg': [{
            width: 800,
            quality: 70,
            rename: { suffix: '-large'}
        }, {
            width: 600,
            quality: 50,
            rename: { suffix: '-medium'}
        },{
            width: 300,
            quality: 40,
            rename: { suffix: '-small'}
        }]
    },))
    .pipe(gulp.dest('img/'));
});

gulp.task('clean', function(done){
    return del(['img/'], done)
});
gulp.task('images', function(done){
    runSequence(
        'clean', 
        ['jpg-images'],
        done
    );
});