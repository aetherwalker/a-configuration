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

var root = __dirname.replace(/\\/g, "/") + "/../../../";
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
 * @private
 */
module.exports._await = new Promise(function(done, fail) {
	initialized.success = function() {
		done(module.exports);
	};
	initialized.failure = fail;
});


var extMongo = require("./extend/mongo");
var extRedis = require("./extend/redis");
var extPostgres = require("./extend/postgresql");


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

var appPackage;

var loadFile = function(file) {
	file = readJSON(file);
	Object.keys(file).forEach(function(key) {
		if(module.exports[key]) {
			Object.assign(module.exports[key], file[key]);
		} else {
			module.exports[key] = file[key];
		}
	});
};

var isJSON = function(path) {
	var index = path.lastIndexOf(".");
	index = path.substring(index).toLowerCase();
	return index === ".json";
};


var loadMongo = function() {
	return new Promise(function(done, fail) {
		if(pkg.aconfiguration.mongo) {
			if(extMongo.load) {
				
			} else {
				fail(new Error("No support for MongoDB found."));
			}
		} else {
			done();
		}
	});
};


var loadRedis = function() {
	return new Promise(function(done, fail) {
		if(pkg.aconfiguration.redis) {
			if(extRedis.load) {
				
			} else {
				fail(new Error("No support for Redis found."));
			}
		} else {
			done();
		}
	});
};


var loadPostgresql = function() {
	return new Promise(function(done, fail) {
		if(pkg.aconfiguration.postgresql) {
			if(extPostgresql.load) {
				
			} else {
				fail(new Error("No support for PostgreSQL found."));
			}
		} else {
			done();
		}
	});
};


var loadFinished = function() {
	/**
	 * 
	 * @event loaded
	 * @param {Configuration} conf The configuration that finished loading.
	 */
	emitter.emit(events.loaded, module.exports);
	initialized.success();
};

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
	var pkg, files;
	
	try {
		pkg = readJSON(root + "package.json");
		pkg.aconfiguration = appPackage.aconfiguration || {};
		pkg.aconfiguration.locals = appPackage.aconfiguration.locals || appPackage.aconfiguration.directory || "app/configuration";
		pkg.aconfiguration.globals = appPackage.aconfiguration.directory;
		appPackage = pkg;
	} catch(exception) {
		
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
			files = fs.readdirSync(root + appPackage.aconfiguration.globals);
			files.forEach(function(file) {
				if(isJSON(file)) {
					loadFile(root + appPackage.aconfiguration.globals + file);
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
		.then(loadPostgres)
		.then(loadFinished)
		.catch(loadFailed);
	} catch(exception) {
		loadFailed(exception);
	}
};

/* On unix machines, captuire SIGHUP to reload configuration */
process.on("SIGHUP", loadConfigurations);
loadConfigurations();
