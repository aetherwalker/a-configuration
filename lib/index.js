"use strict";

/**
 * Configurations load in 2 stages.
 * 
 * The first stage is a blocking file read to provide base data for the application and base configurations
 * as described by the system.
 * 
 * The second stage is to load data from extended datasources in a non-blocking fashion. A `_await`
 * property is provided as a Promise to allow for waiting for the full configuration load if desired. 
 * 
 * @module a-configuration
 * @main
 * @class Configuration
 * @constructor
 * @static
 */
console.log("Dir: " + __dirname);
var root = __dirname.replace(/\\/g, "/");
var parent = root.substring(0, root.lastIndexOf("/"));
var fs = require("fs");
var EventEmitter = require("events").EventEmitter;

var emitter = new EventEmitter();
module.exports.__proto__ = emitter;

/**
 * Maps event names to their current name for consistency.
 * @property _events
 * @type Object
 * @private
 */
var events = {
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
 * @private
 */
module.exports._await = new Promise(function(done, fail) {
	initialized.success = function() {
		done(module.exports);
	};
	initialized.failure = fail;
});


/**
 * Maintains a map of path to Object of imported files for local configuration.
 * @property locals
 * @type Object
 * @private
 */
var locals = {};

/**
 * Maintains a map of path to Object of imported files for global configuration.
 * @property globals
 * @type Object
 * @private
 */
var globals = {};

/**
 * 
 * @method readJSON
 * @private
 * @param {String} path
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
 * @method resolveKey
 * @private
 * @param {Object} source
 * @param {String} key
 * @param {Object} destination
 */
var resolveKey = function(source, key, destination) {
	// TODO
};

/**
 * 
 * @method loadConfigurations
 * @private
 */
var loadConfigurations = function() {
	// TODO

	/**
	 * This event can occur more than once.
	 * @event loaded
	 * @param {Configuration} conf The configuration that finished loading.
	 */
	emitter.emit(events.loaded, module.exports);
};

/**
 * 
 * @method failConfiguration
 * @private
 * @param {Error} error
 */
var failConfiguration = function(error) {
	// TODO

	/**
	 * 
	 * @event errored
	 * @param {Configuration} conf The configuration that finished loading.
	 * @param {Error} error Thrown exception
	 */
	emitter.emit(events.errored, module.exports, error);
};

/* On unix machines, captuire SIGHUP to reload configuration */
process.on("SIGHUP", loadConfigurations);
loadConfigurations();
