"use strict";

/**
 * Configurations load in 2 stages.
 * 
 * The first stage is a blocking file read to provide base data for the application and base configurations
 * as described by the system.
 * 
 * The second stage is to load data from extended data sources in a non-blocking fashion. A `_await`
 * property is provided as a Promise to allow for waiting for the full configuration load if desired. 
 * 
 * Note that as this extends an EventEmitter, colliding key names should be avoided, such as "on" and
 * "once". Due to the nature of the EventEmitter properties and for simplicity, Configuration merely
 * extends the EventEmitter class so that `configuration.on` and similar methods are simply available
 * without needing to remember referencing such as `configuration._events.on`, however the extended
 * event emitted is also available as _events to allow for key collision if needed.
 * 
 * Additionally, this module binds a listener to the "SIGHUP" Process Event to trigger configuration
 * reload events.
 * 
 * @module a-configuration
 * @main
 * @class Configuration
 * @extends EventEmitter
 * @constructor
 * @static
 */
var fs = require("fs");
var root = __dirname.replace(/\\/g, "/") + "/../../../";
var EventEmitter = require("events").EventEmitter;

var appPackage;

var emitter = new EventEmitter();
module.exports.__proto__ = emitter;
/**
 * Provides a reference to the extended event emitter to allow for key collisions
 * off of the configuration object itself.
 * @property _emitter
 * @type EventEmitter
 */
module.exports._emitter = emitter;

/**
 * Maps event names to their current name for consistency.
 * @property _events
 * @type Object
 * @private
 */
var events = {
	"loaded": "loaded",
	"errored": "failed"
};

/**
 * Tracks included javascript file configurations so that reloads can be triggered
 * via their functional invocations.
 * @property loaded
 * @type Object
 * @private
 */
var loaded = {};

/**
 * Called after the first completion of the second load stage.
 * @method initialized.success
 * @private
 */
/**
 * Called if the first completion of the second load stage resulted in an exception.
 * @method initialized.failure
 * @private
 * @param {Error} exception The thrown exception
 */
var initialized = {};

/**
 * Called after the first completion of the second load stage.
 * @property _await
 * @type Promise
 */
module.exports._await = new Promise(function(done, fail) {
	initialized.success = function() {
		done(module.exports);
	};
	initialized.failure = fail;
});

/**
 * 
 * @method readJSON
 * @private
 * @param {String} path
 * @return {Object}
 */
var readJSON = function(path) {
	var contents = fs.readFileSync(path, "utf8");
	if(contents === undefined || contents === null) {
		throw new Error("can not load "  + path);
	}
	try {
		return JSON.parse(contents.trim());
	} catch(exception) {
		contents = new Error("Failed to read file (" + path + ")");
		contents.path = path;
		contents.original = exception;
		throw contents;
	}
};

/**
 * 
 * @method getExt
 * @private
 * @param {String} path File name or complete file path.
 * @return {Boolean}
 */
var getExt = function(path) {
	return path.substring(path.lastIndexOf(".")).toLowerCase();
};

/**
 * 
 * @method loadFailed
 * @private
 * @param {Error} exception
 * @return {Promise}
 */
var loadFinished = function() {
	/**
	 * 
	 * @event loaded
	 * @param {Configuration} conf This configuration that finished loading.
	 */
	initialized.success();
	setTimeout(function() {
		/* Some failures happen in the module initialization and throw before listeners
		 * have a chance to bind. To allow this, the event emission is off loaded.
		 */
		emitter.emit(events.loaded, module.exports);
	}, 0);
};

/**
 * 
 * @method loadFailed
 * @private
 * @param {Error} exception
 * @return {Promise}
 */
var loadFailed = function(exception) {
	/**
	 * Thrown in the case of an error in any stage.
	 * @event failed
	 * @param {Configuration} conf This configuration that finished loading.
	 * @param {Error} error Thrown exception
	 */
	initialized.failure(exception);
	setTimeout(function() {
		/* Some failures happen in the module initialization and throw before listeners
		 * have a chance to bind. To allow this, the event emission is off loaded.
		 */
		emitter.emit(events.errored, module.exports, exception);
	}, 0);
};

/**
 * 
 * @method loadConfigurations
 * @private
 */
var loadConfigurations = function() {
	var files = [], ensure = [];

	/**
	 * 
	 * @method loadFile
	 * @private
	 * @param {String} file Filename to load.
	 */
	var loadFile = function(file) {
		switch(getExt(file)) {
			case ".json":
				resolveConfiguration(readJSON(file));
				break;
			case ".js":
				if(!loaded[file]) {
					if(file[0] === "." || file[0] === "/" || (file[1] === ":" && file[2] === "\\")) {
						loaded[file] = require(file);
					} else {
						loaded[file] = require(root + file);
					}
				}
				// TODO:
				// The pressence of Resolve is considered enough here to allow for unit testing to continue
				// as the user should be aware of the configuration usage anyway. When Issue 44 is fixed,
				// this should be updated to use instanceof
				if(loaded[file].resolve /*instanceof Function*/) {
					resolveConfiguration(loaded[file].resolve(module.exports));
				}
				break;
			default:
				if(fs.lstatSync(file).isDirectory()) {
					fs.readdirSync(file).forEach(function(path) {
						loadFile(file + path);
					});
				} else {
					throw new Error("Unknown file type: " + file);
				}
		}
	};

	/**
	 * 
	 * @method resolveConfiguration
	 * @private
	 * @param {Object} conf Configuration to resolve against the current export.
	 */
	var resolveConfiguration = function(conf) {
		// TODO:
		// Due to sandbox issues, a string compare fallback is present
		// https://github.com/felixge/node-sandboxed-module/issues/44
		conf = conf || {};
		if(conf instanceof Promise || conf.toString() === "[object Promise]") {
			conf.then(resolveConfiguration);
			ensure.push(conf);
		} else {
			Object.keys(conf).forEach(function(key) {
				if(appPackage.aconfiguration.ignore.indexOf(key[0]) === -1) {
					if(module.exports[key] && typeof module.exports[key] === "object") {
						Object.assign(module.exports[key], conf[key]);
					} else {
						module.exports[key] = conf[key];
					}
				}
			});
		}
	};

	try {
		appPackage = readJSON(root + "package.json");
	} catch(exception) {
		appPackage = {};
	}

	appPackage.aconfiguration = appPackage.aconfiguration || {};
	appPackage.aconfiguration.masks = appPackage.aconfiguration.masks || appPackage.aconfiguration.initial;
	appPackage.aconfiguration.locals = appPackage.aconfiguration.application || appPackage.aconfiguration.app || appPackage.aconfiguration.locals || appPackage.aconfiguration.directory || "app/configuration/";
	appPackage.aconfiguration.globals = appPackage.aconfiguration.system || appPackage.aconfiguration.sys || appPackage.aconfiguration.globals;
	appPackage.aconfiguration.final = appPackage.aconfiguration.final || appPackage.aconfiguration.finish;
	appPackage.aconfiguration.ignore = appPackage.aconfiguration.ignore || "_";

	if(appPackage.aconfiguration.globals && appPackage.aconfiguration.globals[appPackage.aconfiguration.globals.length-1] !== "/") {
		appPackage.aconfiguration.globals += "/";
	}
	if(appPackage.aconfiguration.locals[appPackage.aconfiguration.locals.length-1] !== "/") {
		appPackage.aconfiguration.locals += "/";
	}

	try {
		if(appPackage.aconfiguration.masks) {
			if(appPackage.aconfiguration.masks[0] === ".") {
				files.push(root + appPackage.aconfiguration.masks);
			} else {
				files.push(appPackage.aconfiguration.masks);
			}
		}

		if(appPackage.aconfiguration.globals) {
			if(appPackage.aconfiguration.globals[0] === ".") {
				files.push(root + appPackage.aconfiguration.globals);
			} else {
				files.push(appPackage.aconfiguration.globals);
			}
		}

		if(appPackage.aconfiguration.locals) {
			if(appPackage.aconfiguration.locals[0] === ".") {
				files.push(root + appPackage.aconfiguration.locals);
			} else {
				files.push(appPackage.aconfiguration.locals);
			}
		}

		if(appPackage.aconfiguration.files) {
			appPackage.aconfiguration.files.forEach(function(file) {
				if(file === ".") {
					files.push(root + file);
				} else {
					files.push(file);
				}
			});
		}

		if(appPackage.aconfiguration.final) {
			if(appPackage.aconfiguration.final[0] === ".") {
				files.push(root + appPackage.aconfiguration.final);
			} else {
				files.push(appPackage.aconfiguration.final);
			}
		}

		files.forEach(loadFile);

		Promise.all(ensure)
		.then(loadFinished)
		.catch(loadFailed);
	} catch(exception) {
		loadFailed(exception);
	}
};

/**
 * When true, the configuration is updating its values. This does not block
 * the values from being used, but does indicate that the module is busy and
 * operations that would cause further updates should be blocked.
 * @property reloading
 * @type {Boolean}
 * @private
 */
var reloading = false;

/**
 * Indicate if the configuration module is currently updating.
 * 
 * This currently responds to the following states:  
 * + reloading
 * 
 * @method isLocked
 * @private
 * @return {Boolean}
 */
var isLocked = function() {
	return reloading;
};

/**
 * Update the configurations.
 * 
 * This will cause all configuration sources to be read again and then applied
 * over the current configuration. Which will change values that exist but will
 * in general not delete values.
 * 
 * Specifically this will not remove values at the first, or second level due to
 * the way in which the configurations are assembled. Keys at the third level or
 * deeper will fall off _IF_ the second level key has an update applied.
 * @method _reload
 * @return {Promise} Resolves with the final status of the configuration loading;
 * 		See: "loaded" and "error" events.
 */
module.exports._reload = function() {
	return new Promise(function(done, fail) {
		if(isLocked()) {
			fail(new Error("Reload in process"));
		} else {
			reloading = true;
			module.exports.once(events.loaded, function() {
				reloading = false;
				module.exports.removeListener(events.errored, fail);
				done();
			});
			module.exports.once(events.errored, function(err) {
				reloading = false;
				module.exports.removeListener(events.loaded, done);
				fail(err);
			});
			loadConfigurations();
		}
	});
};

/* Capture SIGHUP to reload configuration */
process.on("SIGHUP", function() {
	if(!isLocked()) {
		reloading = true;
		var release = function() {
			module.exports.removeListener(events.loaded, release);
			module.exports.removeListener(events.errored, release);
			reloading = false;
		};
		module.exports.once(events.loaded, release);
		module.exports.once(events.errored, release);
		loadConfigurations();
	}
});

loadConfigurations();
