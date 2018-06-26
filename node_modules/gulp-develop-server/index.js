'use strict';

var _          = require( 'lodash' ),
	gutil      = require( 'gulp-util' ),
	Transform  = require( 'stream' ).Transform,
	fork       = require( 'child_process' ).fork,
	pluginName = 'gulp-develop-server';


var isChanged = false;


var defaultOptions = {
	path: '',
	env: _.extend( { NODE_ENV: 'development' }, process.env ),
	args: [],
	execArgv: [],
	delay: 600,
	successMessage: /^[Ss]erver listening/,
	errorMessage: /[Ee]rror:/,
	killSignal: 'SIGTERM'
};


var app = module.exports = function( options ) {
	var stream = new Transform( { objectMode: true } ),
		isStream = false;

	// override default options
	if( ! app.child && typeof options === 'object' ) {
		_.merge( app.options, options );
	}

	stream._transform = function( file, encoding, callback ) {
		var pushFile = function() {
			stream.push( file );
			callback();
		};

		if( ! isStream ) {
			isStream = true;
			return app.changed( pushFile );
		}

		pushFile();
	};

	stream.on( 'finish', function() {
		isStream = false;
	});

	return stream;
};


var done = function( error, message, callback ) {

	// fallback arguments
	if( typeof message === 'function' ) {
		callback = message;
	}

	// print message
	else if( ! error && typeof message === 'string' ) {
		gutil.log( message );
	}

	// run callback
	if( typeof callback === 'function' ) {
		callback( error || null );
	}

	return app;
};


app.child = null;


app.options = _.cloneDeep( defaultOptions );


app.listen = function( options, callback ) {

	// throw error when options is not set
	if( ! app.options.path && typeof options.path !== 'string' ) {
		throw new gutil.pluginError( pluginName, 'application `path` required.' );
	}

	// fallback arguments
	if( typeof options === 'function' ) {
		callback = options;
		options = {};
	}

	// server already started
	if( app.child && app.child.connected ) {
		return done( 'Development server already started.', callback );
	}

	// override default options
	if( typeof options === 'object' ) {
		_.merge( app.options, options );
	}

	// run server process
	var child = fork( app.options.path, app.options.args, {
		cwd:      app.options.cwd,
		env:      app.options.env,
		execPath: app.options.execPath,
		execArgv: app.options.execArgv,
		gid:      app.options.gid,
		uid:      app.options.uid,
		silent:   true
	});

	// run callback when server initialized
	var called = false,
		timer;

	var initialized = function( error ) {
		if( called ) {
			return;
		}

		if( timer ) {
			timer = clearTimeout( timer );
		}

		if( error ) {
			gutil.log( gutil.colors.red( error ) );
			done( error, callback );
		}
		else {
			var pid = gutil.colors.magenta( child.pid );
			app.child = child;
			done( null, 'Development server listening. (PID:' + pid + ')', callback );
		}

		called = true;
		child.stderr.removeListener( 'data', errorListener );
		child.removeListener( 'message', successMessageListener );
	};

	// initialized by timer using `delay`
	if( app.options.delay > 0 ) {
		timer = setTimeout( initialized, app.options.delay );
	}

	// initialized by `successMessage`
	var successMessageListener = function( message ) {
		if( typeof message === 'string' && message.match( app.options.successMessage ) ) {
			initialized();
		}
	};
	child.on( 'message', successMessageListener );

	// initialized by `errorMessage` if server printed error
	var errorListener = function( error ) {
		if( error instanceof Buffer && error.toString().match( app.options.errorMessage ) ) {
			initialized( 'Development server has error.' );
		}
	};
	child.stderr.on( 'data', errorListener );

	// pipe child_process's stdout / stderr
	child.stdout.pipe( process.stdout );
	child.stderr.pipe( process.stderr );

	return app;
};


app.kill = function( signal, callback ) {

	// fallback arguments
	if( typeof signal === 'function' ) {
		callback = signal;
		signal = app.options.killSignal;
	}
	else {
		signal = signal || app.options.killSignal;
	}

	// send kill signal
	if( app.child ) {
		var pid = gutil.colors.magenta( app.child.pid );

		var stopped = function() {
			app.child = null;
			done( null, 'Development server was stopped. (PID:' + pid + ')', callback );
		};

		app.child.once( 'close', stopped );
		app.child.kill( signal );

		return app;
	}

	// server already stopped
	return done( 'Development server already stopped.', callback );
};


app.changed = app.restart = function( callback ) {

	// already called this function
	if( isChanged ) {
		return done( null, 'Development server already received restart requests.', callback );
	}

	// restart server
	var restarted = function( error ) {
		isChanged = false;
		return done( error, gutil.colors.cyan( 'Development server was restarted.' ), callback );
	};

	if( app.child ) {
		isChanged = true;
		return app.kill( function() {
			app.listen( restarted );
		});
	}

	// if server not started, try to start using options.path
	else if( app.options.path ) {
		isChanged = true;
		return app.listen( restarted );
	}

	// server not started
	throw new gutil.PluginError( pluginName, 'Development server not started.' );
};


app.reset = function( signal, callback ) {

	// fallback arguments
	if( typeof signal === 'function' ) {
		callback = signal;
		signal = app.options.killSignal;
	}
	else {
		signal = signal || app.options.killSignal;
	}

	// kill server process and then reset options
	var stopped = function( error ) {
		app.options = _.cloneDeep( defaultOptions );
		done( error, callback );
	};

	return app.kill( signal, stopped );
};
