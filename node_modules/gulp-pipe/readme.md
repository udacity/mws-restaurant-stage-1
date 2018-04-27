# gulp-pipe

#### Expose your flows without laying so much `.pipe()`

Get rid of needless boilerplate noise and just focus on the *stuff that changes*.

Turn this (195 non-space characters):
````javascript
return gulp.src(paths.scripts)
           .pipe(sourcemaps.init())
           .pipe(to5())
           .pipe(concat('index.js'))
           .pipe(sourcemaps.write('.'))
           .pipe(gulp.dest(paths.dist))
           .on('error', function(e) { console.log(e); });
````

Into this (175 non-space characters):
````javascript
return pipe([
        gulp.src(paths.scripts)
        ,sourcemaps.init()
        ,to5()
        ,concat('index.js')
        ,sourcemaps.write('.')
        ,gulp.dest(paths.dist)
       ])
       .on('error', function(e) { console.log(e); });
````

Or this:
````javascript
return pipe(gulp.src(paths.scripts),
            [
              sourcemaps.init(),
              to5(),
              concat('index.js'),
              sourcemaps.write('.'),
              gulp.dest(paths.dist)
            ])
            .on('error', function(e) {console.log(e);});
````


### [Source](/index.js):

````javascript
module.exports = function pipe(stream, tubes) {
  tubes = tubes || stream.slice(1);
  return tubes.reduce(function(stream, tube) { return stream.pipe(tube); }, Array.isArray(stream) ? stream[0] : stream);
};
````

### Installation
`npm install --save gulp-pipe`

### Under consideration

1. Investigate flows for allowing inline `.on`, as in [this example](https://github.com/greypants/gulp-starter/blob/1466eee867271271d91d7f837a1291c40e139fa3/gulp/tasks/browserify.js).

### Notes

1. This library is not specific to, nor has dependencies on, [gulp](https://github.com/gulpjs/gulp). It will work for any Streams, however it was created to simplify my `gulpfile.js`'s