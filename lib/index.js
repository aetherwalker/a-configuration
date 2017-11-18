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
 * @module a-configuration
 * @main
 * @class Configuration
 * @extends EventEmitter
 * @constructor
 * @static
 */
var root = __dirname.replace(/\\/g, "/") + "/../../../";
var fs = require("fs");
var EventEmitter = require("events").EventEmitter;

var extMongo = require("./extend/mongo");
var extRedis = require("./extend/redis");
var extPostgresql = require("./extend/postgresql");

var appPackage;

var emitter = new EventEmitter();
module.exports.__proto__ = emitter;
/**
 * Provides a reference to the extended event emitter to allow for key collisions
 * off of the configuration object itself.
 * @property _events
 * @type EventEmitter
 */
module.exports._events = emitter;

/**
 * Maps event names to their current name for consistency.
 * @property _events
 * @type Object
 * @private
 */
var events = {
	"started": "started",
	"initialized": "initialized",
	"loaded": "loaded",
	"errored": "errored"
};

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
 * @method loadFile
 * @private
 * @param {String} file Filename to load
 */
var loadFile = function(file) {
	file = readJSON(file);
	Object.keys(file).forEach(function(key) {
		if(appPackage.aconfiguration.ignore.indexOf(key[0]) === -1) {
			if(module.exports[key]) {
				Object.assign(module.exports[key], file[key]);
			} else {
				module.exports[key] = file[key];
			}
		}
	});
};

/**
 * 
 * @method isJSON
 * @private
 * @param {String} path File name or complete file path.
 * @return {Boolean}
 */
var isJSON = function(path) {
	var index = path.lastIndexOf(".");
	index = path.substring(index).toLowerCase();
	return index === ".json";
};

/**
 * 
 * @method loadMongo
 * @private
 * @return {Promise}
 */
var loadMongo = function() {
	return new Promise(function(done, fail) {
		if(appPackage.aconfiguration.mongo) {
			if(extMongo.load) {
				
			} else {
				fail(new Error("No support for MongoDB found."));
			}
		} else {
			done();
		}
	});
};

/**
 * 
 * @method loadRedis
 * @private
 * @return {Promise}
 */
var loadRedis = function() {
	return new Promise(function(done, fail) {
		if(appPackage.aconfiguration.redis) {
			if(extRedis.load) {
				
			} else {
				fail(new Error("No support for Redis found."));
			}
		} else {
			done();
		}
	});
};

/**
 * 
 * @method loadPostgresql
 * @private
 * @return {Promise}
 */
var loadPostgresql = function() {
	return new Promise(function(done, fail) {
		if(appPackage.aconfiguration.postgresql) {
			if(extPostgresql.load) {
				
			} else {
				fail(new Error("No support for PostgreSQL found."));
			}
		} else {
			done();
		}
	});
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
	 * @param {Configuration} conf The configuration that finished loading.
	 */
	emitter.emit(events.loaded, module.exports);
	initialized.success();
};

/**
 * 
 * @method loadFailed
 * @param {Error} exception
 * @return {Promise}
 */
var loadFailed = function(exception) {
	/**
	 * 
	 * @event errored
	 * @param {Configuration} conf The configuration that finished loading.
	 * @param {Error} error Thrown exception
	 */
	emitter.emit(events.errored, module.exports, exception);
	initialized.failure();
};

/**
 * 
 * @method loadConfigurations
 * @private
 */
var loadConfigurations = function() {
	var path, files;
	
	try {
		appPackage = readJSON(root + "package.json");
	} catch(exception) {
		appPackage = {};
	}
	
	appPackage.aconfiguration = appPackage.aconfiguration || {};
	appPackage.aconfiguration.locals = appPackage.aconfiguration.application || appPackage.aconfiguration.app || appPackage.aconfiguration.locals || appPackage.aconfiguration.directory || "app/configuration/";
	appPackage.aconfiguration.globals = appPackage.aconfiguration.system || appPackage.aconfiguration.sys || appPackage.aconfiguration.globals;
	appPackage.aconfiguration.ignore = appPackage.aconfiguration.ignore || "_";
	
	if(appPackage.aconfiguration.globals && appPackage.aconfiguration.globals[appPackage.aconfiguration.globals.length-1] !== "/") {
		appPackage.aconfiguration.globals += "/";
	}
	if(appPackage.aconfiguration.locals[appPackage.aconfiguration.locals.length-1] !== "/") {
		appPackage.aconfiguration.locals += "/";
	}

	/**
	 * 
	 * @event started
	 * @param {Configuration} conf The configuration that finished loading.
	 */
	emitter.emit(events.started, module.exports);

	try {
		files = fs.readdirSync(root + appPackage.aconfiguration.locals);
		files.forEach(function(file) {
			if(isJSON(file)) {
				loadFile(root + appPackage.aconfiguration.locals + file);
			}
		});
	
		if(appPackage.aconfiguration.globals) {
			if(appPackage.aconfiguration.globals[0] === ".") {
				path = root + appPackage.aconfiguration.globals;
			} else {
				path = appPackage.aconfiguration.globals;
			}
			files = fs.readdirSync(appPackage.aconfiguration.globals);
			files.forEach(function(file) {
				if(isJSON(file)) {
					loadFile(path + file);
				}
			});
		}
	
		/**
		 * This event can occur more than once.
		 * @event initialized
		 * @param {Configuration} conf The configuration that finished loading.
		 */
		emitter.emit(events.initialized, module.exports);
		
		loadMongo()
		.then(loadRedis)
		.then(loadPostgresql)
		.then(loadFinished)
		.catch(loadFailed);
	} catch(exception) {
		loadFailed(exception);
	}
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
 */
module.exports._reload = loadConfigurations;
/* Capture SIGHUP to reload configuration */
process.on("SIGHUP", loadConfigurations);
loadConfigurations();
