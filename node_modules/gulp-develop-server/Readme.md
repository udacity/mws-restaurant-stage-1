gulp-develop-server
===================

> run your node.js server and automatically restart with gulp.

[![Build Status][travis-image]][travis-url]
[![Test Coverage][coveralls-image]][coveralls-url]
[![Npm Modules][npm-image]][npm-url]
[![MIT Licensed][license-image]][license-url]

[travis-image]: https://img.shields.io/travis/narirou/gulp-develop-server.svg?style=flat-square
[travis-url]: https://travis-ci.org/narirou/gulp-develop-server
[coveralls-image]: https://img.shields.io/coveralls/narirou/gulp-develop-server.svg?style=flat-square
[coveralls-url]: https://coveralls.io/r/narirou/gulp-develop-server
[npm-image]: http://img.shields.io/npm/v/gulp-develop-server.svg?style=flat-square
[npm-url]: https://www.npmjs.org/package/gulp-develop-server
[license-image]: http://img.shields.io/badge/license-MIT-blue.svg?style=flat-square
[license-url]: ./LICENSE

gulp-develop-server is a development assistant for node.js server that runs
the process and automatically restarts it when a file is modified. 



installation
------------

```bash
npm install gulp-develop-server --save-dev
```



usage
-----

```javascript
var gulp   = require( 'gulp' ),
    server = require( 'gulp-develop-server' );

// run server
gulp.task( 'server:start', function() {
    server.listen( { path: './app.js' } );
});

// restart server if app.js changed
gulp.task( 'server:restart', function() {
    gulp.watch( [ './app.js' ], server.restart );
});
```



api
---

###server.listen( options[, callback] )

**options {Object}**  

- `path`  
    - type: {String}
    - example: `'./your_node_app.js'`
    - Your node application path. This option is required.

- `env`  
    - type: {Object}  
    - default: `{ NODE_ENV: 'development' }` (extends current `process.env`)  
    - example: `{ PORT: 3000, NODE_ENV: 'production' }`  
    - Environment settings of your server.  

- `args`
    - type: {Array}
    - your application's arguments

- `execArgv`  
    - type: {Array}  
    - example: `[ '--harmony' ]`  
    - Run node process with this options.  

- `delay`   
    - type: {Number}  
    - default: `600`  
    - If this plugin does not receive an error from the server after `options.delay` seconds,
    assumes the server listening success.
    - This option needs to adjust according to your application's initialize time.
    - If this option set `0`, it will only check `successMessage`.  

- `successMessage`  
    - type: {RegExp}
    - default: `/^[Ss]erver listening/`  
    - If your application send the specific message by `process.send` method,
    this plugin assumes the server listening success.

- `errorMessage`  
    - type: {RegExp}
    - default: `/[Ee]rror:/` 
    - If this plugin receives the specific error message that matched this RegExp at start-up, 
    assumes the server has error.

- `killSignal`  
    - type: {String}
    - default: `SIGTERM`

**callback( error )**  


###server.restart( [callback] ) / server.changed( [callback] )

**callback( error )**  


###server( [options] )

Create a `Transform` stream.
Restart the server at once when this stream gets files.


###server.kill( [signal, callback] )

Send kill signal to the server process.  
**signal {String}**  
**callback( error )**  


###server.reset( [signal, callback] )

Send kill signal to the server process and reset the options to default.   
**signal {String}**  
**callback( error )**  



more examples
-------------

####with [gulp-livereload](https://github.com/vohof/gulp-livereload):

```javascript
var gulp       = require( 'gulp' ),
    server     = require( 'gulp-develop-server' ),
    livereload = require( 'gulp-livereload' );

var options = {
    path: './apps/app.js'
};

var serverFiles = [
    './apps/app.js',
    './routes/*.js'
];

gulp.task( 'server:start', function() {
    server.listen( options, livereload.listen );
});

// If server scripts change, restart the server and then livereload.
gulp.task( 'default', [ 'server:start' ], function() {
    
    function restart( file ) {
        server.changed( function( error ) {
            if( ! error ) livereload.changed( file.path );
        });
    }

    gulp.watch( serverFiles ).on( 'change', restart );
});
```


####with [BrowserSync](https://github.com/BrowserSync/browser-sync):

```javascript
var gulp   = require( 'gulp' ),
    server = require( 'gulp-develop-server' ),
    bs     = require( 'browser-sync' );

var options = {
    server: {
        path: './apps/app.js',
        execArgv: [ '--harmony' ]
    },
    bs: {
        proxy: 'http://localhost:3000'
    }
};

var serverFiles = [
    './apps/app.js',
    './routes/*.js'
];

gulp.task( 'server:start', function() {
    server.listen( options.server, function( error ) {
        if( ! error ) bs( options.bs );
    });
});

// If server scripts change, restart the server and then browser-reload.
gulp.task( 'server:restart', function() {
    server.restart( function( error ) {
        if( ! error ) bs.reload();
    });
});

gulp.task( 'default', [ 'server:start' ], function() {
    gulp.watch( serverFiles, [ 'server:restart' ] )
});
```


####use as a stream:

```javascript
var gulp   = require( 'gulp' ),
    server = require( 'gulp-develop-server' ),
    bs     = require( 'browser-sync' ),
    coffee = require( 'gulp-coffee' );

var options = {
    server: {
        path: './apps/app.js',
        execArgv: [ '--harmony' ]
    },
    bs: {
        proxy: 'http://localhost:3000'
    }
};

var serverCoffee = [
    './src/*.coffee'
];

gulp.task( 'server:start', function() {
    server.listen( options.server, function( error ) {
        if( ! error ) bs( options.bs );
    });
});

// If server side's coffee files change, compile these files,
// restart the server and then browser-reload.
gulp.task( 'server:restart', function() {
    gulp.src( serverCoffee )
        .pipe( coffee() )
        .pipe( gulp.dest( './apps' ) )
        .pipe( server() )
        .pipe( bs.reload({ stream: true }) );
});

gulp.task( 'default', [ 'server:start' ], function() {
    gulp.watch( serverCoffee, [ 'server:restart' ] );
});
```



thanks
------

[@pronebird](https://github.com/pronebird)  
[@vkareh](https://github.com/vkareh)
