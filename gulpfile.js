var gulp = require( 'gulp' )
	, sequence = require( 'gulp-sequence' ).use( gulp )
	, eslint = require( 'gulp-eslint' )
	, uglify = require( 'gulp-uglify' )
	, sourcemaps = require( 'gulp-sourcemaps' )
	, babel = require( 'gulp-babel' )
	, concat = require( 'gulp-concat' )
	, browserSync = require( 'browser-sync' ).create()
	, inject = require( 'gulp-inject' )
	, injectString = require( 'gulp-inject-string' )
	, gulpif = require( 'gulp-if' )
	, gutil = require( 'gulp-util' )
	, clean = require( 'gulp-clean' ) //-> Deprecated, in favor of 'del'
	, css = require( 'gulp-clean-css' )
	, cssnano = require( 'gulp-cssnano' )
	, sass = require( 'gulp-sass' )
	, autoprefixer = require( 'gulp-autoprefixer' )
	, stylelint = require( 'gulp-stylelint' )
	, environments = require( 'gulp-environments' )
	, rev = require( 'gulp-rev' )
	, filter = require( 'gulp-filter' )
	, html = require( 'gulp-htmlmin' )
	, htmlhint = require( 'gulp-htmlhint' )
	, bower = require( 'gulp-main-bower-files' )
	, options = {
		github: {
			name: 'mws-restaurant-stage-1',
		},
		clean: {
			force: true,
		},
		read: {
			read: false,
		},
		directory: {
			source: 'src',
			dist: 'dist',
			git_pages: 'docs',
		},
		babel: {
			minified: false,
		},
		css: {
			level: 1,
		},
		cssnano: {
			autoprefixer: {
				add: true,
			},
		},
		sass: {
			outputStyle: 'expanded',
		},
		autoprefixer: {
			add: true,
		},
		stylelint: {
			reporters: [
				{
					formatter: 'string',
					console: true,
					debug: false,
				}
			]
		},
		sourcemaps: {
			addComment: false,
		},
		uglify: {
			mangle: true,
			preserveComments: false,
			compress: {
				drop_console: true,
				drop_debugger: true,
			},
			output: {
				max_line_len: 1200000,
			}
		},
		html: {
			removeAttributeQuotes: false,
			collapseWhitespace: true,
			removeComments: true,
			caseSensitive: true,
			minifyCSS: true,
			minifyJS: true,
		},
		browserSync: {
			port: 4000,
			server: {
				baseDir: '',
			},
			ui: false,
			ghostMode: false,
			logConnections: false,
			logSnippet: false,
			minify: false,
			notify: true,
			localOnly: true,
			timestamps: false,
			logLevel: "silent",
		}
	}
	, development = environments.development
	, production = environments.production
	, staging = environments.make( 'staging' )
;

// Common files
options.other_files = [
	options.directory.source + '/favicon.ico',
	options.directory.source + '/favicon.png',
	options.directory.source + '/manifest.json',
	options.directory.source + '/browserconfig.xml',
	options.directory.source + '/robots.txt'
];

// Starting Gulp Tasks
// CLEAN TASKS
gulp.task(
	'clean',
	function() {

		gutil.log( gutil.colors.white.bgMagenta( ' [ CLEAN : DIST ] ' ) );

		return gulp
			.src(
				[
					options.directory.dist,
					options.directory.source + '/app/scripts/app.environment.js',
				],
				options.read
			)
			.pipe( clean( options.clean ) )
		;

	}
);
gulp.task(
	'clean:app:scripts',
	function() {

		gutil.log( gutil.colors.white.bgMagenta( ' [ Clean : App : Scripts ] ' ) );

		return gulp
			.src(
				[
					options.directory.dist + '/app/scripts/app-*.js'
				],
				options.read
			)
			.pipe( clean( options.clean ) )
		;

	}
);
gulp.task(
	'clean:app:styles',
	function() {

		gutil.log( gutil.colors.white.bgMagenta( ' [ Clean : App : Styles ] ' ) );

		return gulp
			.src(
				[
					options.directory.dist + '/app/styles/app-*.css'
				],
				options.read
			)
			.pipe( clean( options.clean ) )
		;

	}
);
gulp.task(
	'clean:vendor:bower',
	function() {

		gutil.log( gutil.colors.white.bgMagenta( ' [ Clean : Vendor : Bower ] ' ) );

		return gulp
			.src(
				[
					options.directory.dist + '/app/scripts/vendor-*.js',
					options.directory.dist + '/app/styles/vendor-*.css',
				],
				options.read
			)
			.pipe( clean( options.clean ) )
		;

	}
);
gulp.task(
	'clean:vendor:themes',
	function() {

		gutil.log( gutil.colors.white.bgMagenta( ' [ Clean : Vendor : Themes ] ' ) );

		return gulp
			.src(
				[
					options.directory.dist + '/app/scripts/themes-*.js',
					options.directory.dist + '/app/styles/themes-*.css',
				],
				options.read
			)
			.pipe( clean( options.clean ) )
		;

	}
);

// COPY TASKS
gulp.task(
	'copy:data',
	function() {

		gutil.log( gutil.colors.white.bgBlue( ' [ Copy : Data ] ' ) );

		return gulp
			.src( options.directory.source + '/data/**/*.*' )
			.pipe( gulp.dest( options.directory.dist + '/data' ), { overwrite: true } )
		;

	}
);
gulp.task(
	'copy:assets',
	function() {

		gutil.log( gutil.colors.white.bgBlue( ' [ Copy : Assets ] ' ) );

		return gulp
			.src( options.directory.source + '/assets/**/*.*' )
			.pipe( gulp.dest( options.directory.dist + '/assets' ), { overwrite: true } )
		;

	}
);
gulp.task(
	'copy:requirements',
	function() {

		gutil.log( gutil.colors.white.bgBlue( ' [ Copy : Manifest ] ' ) );

		return gulp
			.src( options.other_files )
			.pipe( gulp.dest( options.directory.dist ), { overwrite: true } )
		;

	}
);

// BUILD VENDOR TASKS
gulp.task(
	'vendor:bower',
	function() {

		gutil.log( gutil.colors.white.bgCyan( ' [ Build : Vendor : Bower ] ' ) );

		var filterJS = filter( '**/*.js', { restore: true } )
			, filterCSS = filter( '**/*.css', { restore: true } )
			, nameJS = development() ? 'vendor.js' : 'vendor.min.js'
			, nameCSS = development() ? 'vendor.css' : 'vendor.min.css'
		;

		return gulp
			.src( './bower.json' )
			.pipe( bower() )
			.pipe( filterJS )
			.pipe( gulpif( staging(), sourcemaps.init() ) )
			.pipe( gulpif( ! development(), uglify( options.uglify ).on( 'error', errorManager ) ) )
			.pipe( concat( nameJS ) )
			.pipe( rev() )
			.pipe( gulpif( staging(), sourcemaps.write( '.', options.sourcemaps ) ) )
			.pipe( gulp.dest( options.directory.dist + '/app/scripts' ) )
			.pipe( filterJS.restore )
			.pipe( filterCSS )
			.pipe( gulpif( staging(), sourcemaps.init() ) )
			.pipe( concat( nameCSS ) )
			.pipe( gulpif( ! development(), css( options.css ).on( 'error', errorManager ) ) )
			.pipe( rev() )
			.pipe( gulpif( staging(), sourcemaps.write( '.', options.sourcemaps ) ) )
			.pipe( gulp.dest( options.directory.dist + '/app/styles' ) )
			.pipe( filterCSS.restore )
		;

	}
);
gulp.task(
	'vendor:themes',
	function() {

		gutil.log( gutil.colors.white.bgCyan( ' [ Build : Vendor : Themes ] ' ) );

		var filterJS = filter( '**/*.js', { restore: true } )
			, filterCSS = filter( '**/*.css', { restore: true } )
			, nameJS = development() ? 'themes.js' : 'themes.min.js'
			, namecss = development() ? 'themes.css' : 'themes.min.css'
		;
		return gulp
			.src( options.directory.source + '/themes/**/*.*' )
			.pipe( filterJS )
			.pipe( gulpif( staging(), sourcemaps.init() ) )
			.pipe( gulpif( ! development(), uglify( options.uglify ).on( 'error', errorManager ) ) )
			.pipe( concat( nameJS ) )
			.pipe( rev() )
			.pipe( gulpif( ! production(), sourcemaps.write( '.', options.sourcemaps ) ) )
			.pipe( gulp.dest( options.directory.dist + '/app/scripts' ) )
			.pipe( filterJS.restore )
			.pipe( filterCSS )
			.pipe( gulpif( staging(), sourcemaps.init() ) )
			.pipe( concat( namecss ) )
			.pipe( gulpif( ! development(), css( options.css ).on( 'error', errorManager ) ) )
			.pipe( rev() )
			.pipe( gulpif( staging(), sourcemaps.write( '.', options.sourcemaps ) ) )
			.pipe( gulp.dest( options.directory.dist + '/app/styles' ) )
			.pipe( filterCSS.restore )
		;

	}
);

// BUILD APP TASKS
gulp.task(
	'github:pages:clean',
	function() {

		gutil.log( gutil.colors.white.bgMagenta( ' [ Github Pages : Clean ] ' ) );

		return gulp
			.src( options.directory.git_pages, options.read )
			.pipe( clean( options.clean ) )
		;

	}
);
gulp.task(
	'github:pages:copy',
	function() {

		gutil.log( gutil.colors.white.bgBlue( ' [ Github Pages : Docs ] ' ) );

		return gulp
			.src( options.directory.dist + '/**/**/*.*' )
			.pipe( gulp.dest( options.directory.git_pages + '/' ), { overwrite: true } )
		;

	}
);
gulp.task(
	'github:pages:replace',
	function() {

		gutil.log( gutil.colors.white.bgCyan( ' [ Github Pages : Replace ] ' ) );

		var replace_base = [
				'<base href="/">',
				'<base href="/' + options.github.name + '/">',
			],
			replace_canonical = [
				'<link rel="canonical" href="/">',
				'<link rel="canonical" href="/' + options.github.name + '/">',
			]
		;

		return gulp
			.src( options.directory.dist + '/*.html' )
			.pipe( injectString.replace( replace_base[ 0 ], replace_base[ 1 ] ) )
			.pipe( injectString.replace( replace_canonical[ 0 ], replace_canonical[ 1 ] ) )
			.pipe( gulp.dest( options.directory.git_pages + '/' ), { overwrite: true } )
		;

	}
);
gulp.task(
	'build:inject',
	function() {

		gutil.log( gutil.colors.white.bgCyan( ' [ Build : Inject ] ' ) );

		var injectable = [
				options.directory.dist + '/app/styles/vendor-*.css',
				options.directory.dist + '/app/styles/themes-*.css',
				options.directory.dist + '/app/styles/app-*.css',
				options.directory.dist + '/app/scripts/vendor-*.js',
				options.directory.dist + '/app/scripts/themes-*.js',
				options.directory.dist + '/app/scripts/app-*.js',
			]
			, injectable_only_in_production = [
				'',
			]
			, inject_strings = injectable_only_in_production.join( '' )
			, sources = gulp.src( injectable, options.read )
		;

		return gulp
			.src( options.directory.source + '/*.html' )
			.pipe(
				gulpif(
					production(),
					injectString.after( '</title>', inject_strings )
				)
			)
			.pipe(
				inject(
					sources,
					{
						ignorePath: 'dist',
						addRootSlash: false,
					}
				)
			)
			.pipe( htmlhint().on( 'error', errorManager ) )
			.pipe( html( options.html ).on( 'error', errorManager ) )
			.pipe( gulp.dest( options.directory.dist + '/' ) )
		;

	}
);
gulp.task(
	'build:html',
	function() {

		gutil.log( gutil.colors.white.bgCyan( ' [ Build : Html ] ' ) );

		return gulp
			.src( options.directory.source + '/app/**/*.html' )
			.pipe( htmlhint().on( 'error', errorManager ) )
			.pipe( html( options.html ).on( 'error', errorManager ) )
			.pipe( gulp.dest( options.directory.dist + '/app' ) )
		;

	}
);
gulp.task(
	'build:scripts',
	function() {

		gutil.log( gutil.colors.white.bgCyan( ' [ Build : App : Scripts ] ' ) );

		var nameJS = development() ? 'app.js' : 'app.min.js';

		return gulp
			.src( options.directory.source + '/app/**/*.js' )
			.pipe( eslint() )
			.pipe( eslint.format() )
			.pipe( gulpif( production(), eslint.failAfterError() ) )
			.pipe( gulpif( staging(), sourcemaps.init() ) )
			.pipe( babel( options.babel ).on( 'error', errorManager ) )
			.pipe( concat( nameJS ) )
			.pipe( gulpif( ! development(), uglify( options.uglify ).on( 'error', errorManager ) ) )
			.pipe( rev() )
			.pipe( gulpif( staging(), sourcemaps.write( '.', options.sourcemaps ) ) )
			.pipe( gulp.dest( options.directory.dist + '/app/scripts' ) )
		;

	}
);
gulp.task(
	'build:styles',
	function() {

		gutil.log( gutil.colors.white.bgCyan( ' [ Build : App : Styles ] ' ) );

		var filterCSS = filter( '**/*.css', { restore: true } )
			, filterSASS = filter( [ '**/*.scss', '**/*.sass' ], { restore: true } )
			, nameCSS = development() ? 'app.css' : 'app.min.css';
		;

		return gulp
			.src(
				[
					options.directory.source + '/app/**/*.css',
					options.directory.source + '/app/**/*.sass',
					options.directory.source + '/app/**/*.scss',
				]
			)
			.pipe( filterCSS )
			.pipe( gulpif( staging(), sourcemaps.init() ) )
			.pipe( filterCSS.restore )
			.pipe( filterSASS )
			.pipe( sass( options.sass ).on( 'error', errorManager ) )
			.pipe( filterSASS.restore )
			.pipe( gulpif( ! development(), cssnano( options.cssnano ).on( 'error', errorManager ) ) )
			.pipe( gulpif( development(), autoprefixer( options.autoprefixer ).on( 'error', errorManager ) ) )
			.pipe( stylelint( options.stylelint ).on( 'error', errorManager ) )
			.pipe( concat( nameCSS ) )
			.pipe( rev() )
			.pipe( gulpif( staging(), sourcemaps.write( '.', options.sourcemaps ) ) )
			.pipe( gulp.dest( options.directory.dist + '/app/styles' ) )
		;

	}
);

// ENVIRONMENTS TASKS
gulp.task(
	'environment:development',
	function() {

		gutil.log( gutil.colors.white.bgRed( '                 ' ) );
		gutil.log( gutil.colors.white.bgRed( ' [ DEVELOPMENT ] ' ) );
		gutil.log( gutil.colors.white.bgRed( '                 ' ) );

		environments.current( development );

		return;

	}
);
gulp.task(
	'environment:testing',
	function() {

		gutil.log( gutil.colors.white.bgYellow( '             ' ) );
		gutil.log( gutil.colors.white.bgYellow( ' [ TESTING ] ' ) );
		gutil.log( gutil.colors.white.bgYellow( '             ' ) );

		environments.current( staging );

		return;

	}
);
gulp.task(
	'environment:staging',
	function() {

		gutil.log( gutil.colors.white.bgYellow( '             ' ) );
		gutil.log( gutil.colors.white.bgYellow( ' [ STAGING ] ' ) );
		gutil.log( gutil.colors.white.bgYellow( '             ' ) );

		environments.current( staging );

		return;

	}
);
gulp.task(
	'environment:production',
	function() {

		gutil.log( gutil.colors.white.bgGreen( '                ' ) );
		gutil.log( gutil.colors.white.bgGreen( ' [ PRODUCTION ] ' ) );
		gutil.log( gutil.colors.white.bgGreen( '                ' ) );

		environments.current( production );

		return;

	}
);

// SERVE || WATCH TASKS
function errorManager( error ) {

	gutil.log( gutil.colors.red( error.toString() ) );

	this.emit( 'end' );

};
function reload( done ) {

	gutil.log( gutil.colors.gray( 'File edited: browser reload..' ) );

	browserSync.reload();

	if( typeof done === 'function' )
		done();

};
gulp.task(
	'serve',
	[ 'build:development' ],
	function() {

		options.browserSync.server.baseDir = options.directory.dist;
		browserSync.init( options.browserSync );

		var sequenceJS = function() {

				sequence( 'clean:app:scripts', 'build:scripts', 'build:inject' )( reload );
				return;

			}
			, sequenceCSS = function() {

				sequence( 'clean:app:styles', 'build:styles', 'build:inject' )( reload );
				return;

			}
			, sequenceHTML = function() {

				sequence( 'build:html' )( reload );
				return;

			}
			, sequenceINDEX = function() {

				sequence( 'build:inject' )( reload );
				return;

			}
			, sequenceASSETS = function() {

				sequence( 'copy:requirements', [ 'copy:assets', 'copy:data' ] )( reload );
				return;

			}
			, sequenceVendorTHEMES = function() {

				sequence( 'clean:vendor:themes', 'vendor:themes', 'build:inject' )( reload );
				return;

			}
			, sequenceVendorBOWER = function() {

				sequence( 'clean:vendor:bower', 'vendor:bower', 'build:inject' )( reload )
				return;

			}
		;

		// Watch files
		// Styles
		gulp.watch(
			[
				options.directory.source + '/app/**/*.css',
				options.directory.source + '/app/**/*.sass',
				options.directory.source + '/app/**/*.scss',
			],
			sequenceCSS
		);
		// Scripts
		gulp.watch( options.directory.source + '/app/**/*.js', sequenceJS );
		gulp.watch( './.eslintrc', sequenceJS );
		// Html
		gulp.watch( options.directory.source + '/app/**/*.html', sequenceHTML );
		gulp.watch( options.directory.source + '/*.html', sequenceINDEX );
		// Vendor
		gulp.watch( options.directory.source + '/themes/**/*.*', sequenceVendorTHEMES );
		gulp.watch( './bower.json', sequenceVendorBOWER );
		// Assets
		options.other_files.push( options.directory.source + '/assets/**/*.*' );
		gulp.watch( options.other_files, sequenceASSETS );
		// Env
		gulp.watch( './environment.json', [ 'environment:development' ], sequenceJS );

	}
);

// DEFAULT TASKS
gulp.task( 'clean:all', [ 'clean', 'github:pages:clean' ] );
gulp.task( 'watch', [ 'serve' ] );
gulp.task( 'dev', [ 'serve' ] );

gulp.task( 'build:development', sequence( 'clean:all', 'environment:development', [ 'copy:requirements', 'copy:assets', 'copy:data' ], [ 'vendor:bower', 'vendor:themes' ], [ 'build:styles', 'build:scripts', 'build:html', ], 'build:inject' ) );
gulp.task( 'build:testing', sequence( 'clean:all', 'environment:testing', [ 'copy:requirements', 'copy:assets', 'copy:data' ], [ 'vendor:bower', 'vendor:themes' ], [ 'build:styles', 'build:scripts', 'build:html', ], 'build:inject' ) );
gulp.task( 'build:staging', sequence( 'clean:all', 'environment:staging', [ 'copy:requirements', 'copy:assets', 'copy:data' ], [ 'vendor:bower', 'vendor:themes' ], [ 'build:styles', 'build:scripts', 'build:html', ], 'build:inject' ) );
gulp.task( 'build', sequence( 'clean', 'environment:production', [ 'copy:requirements', 'copy:assets', 'copy:data' ], [ 'vendor:bower', 'vendor:themes' ], [ 'build:styles', 'build:scripts', 'build:html' ], 'build:inject' ) );
gulp.task( 'default', [ 'build' ] );

// Github Pages
gulp.task( 'github:pages', sequence( 'build', 'github:pages:clean', 'github:pages:copy', 'github:pages:replace' ) );

// Exports Gulp if you use 'Gulp Devtools' in Chrome DevTools
module.exports = gulp;
