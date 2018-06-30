# gulp-minify

> Minify JavaScript with uglify-es.

## Note
The latest version of  `gulp-minify` is using [uglify-es](https://www.npmjs.com/package/uglify-es) to minify files, this may cause some incompatible issues with earlier language versions for now, see https://github.com/hustxiaoc/gulp-minify/issues/27.

So `gulp-minify@es5` is for the earlier language versions if your project is not ready for the ECMAScript 6 yet.

## Installation

Install package with NPM and add it to your development dependencies:

`npm install --save-dev gulp-minify`

## Usage

```javascript
var minify = require('gulp-minify');

gulp.task('compress', function() {
  gulp.src('lib/*.js')
    .pipe(minify({
        ext:{
            src:'-debug.js',
            min:'.js'
        },
        exclude: ['tasks'],
        ignoreFiles: ['.combo.js', '-min.js']
    }))
    .pipe(gulp.dest('dist'))
});
```

## Options
- `ext`
    An object that specifies output source and minified file extensions.

	- `source`

		The suffix string of the filenames that output source files ends with.

	- `min`

		- When string:	The suffix string of the filenames that output minified files ends with.
		- When Array:	The regex expressions to be replaced with input filenames. For example: `[/\.(.*)-source\.js$/, '$1.js']`

- `exclude`

    Will not minify files in the dirs.

- `noSource`
    Will not output the source code in the dest dirs.    

- `ignoreFiles`

    Will not minify files which matches the pattern.

- `mangle`

	Pass `false` to skip mangling names.

- `output`

	Pass an object if you wish to specify additional [output
	options](http://lisperator.net/uglifyjs/codegen). The defaults are
	optimized for best compression.

- `compress`

	Pass an object to specify custom [compressor
	options](http://lisperator.net/uglifyjs/compress). Pass `false` to skip
	compression completely.

- `preserveComments`

	A convenience option for `options.output.comments`. Defaults to preserving no
	comments.

	- `all`

		Preserve all comments in code blocks

	- `some`

		Preserve comments that start with a bang (`!`) or include a Closure
		Compiler directive (`@preserve`, `@license`, `@cc_on`)

	- `function`

		Specify your own comment preservation function. You will be passed the
		current node and the current comment and are expected to return either
		`true` or `false`.
