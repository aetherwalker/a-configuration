/* Injection */
var sandbox = require("sandboxed-module");
global.requireUnit = function(path, requires, globals, locals) {
	requires = requires || {};
	globals = globals || {};
	locals = locals || {};
	return sandbox.require("../lib/" + path, {
		"requires": requires,
		"globals": globals,
		"locals": locals
	});
};

global.testConfiguration = function(requires, globals, locals) {
	requires = requires || {};
	requires.events = global.mocks.events;
	requires.fs = global.mocks.fs;
	requires["./extend/mongo"] = requires["./extend/mongo"] || global.mocks.nullExtension;
	requires["./extend/redis"] = requires["./extend/redis"] || global.mocks.nullExtension;
	requires["./extend/postgresql"] = requires["./extend/postgresql"] || global.mocks.nullExtension;
	
	locals = locals || {};
	locals.__dirname = locals.__dirname || "";
	
	return global.requireUnit("index.js", requires, globals, locals);
};

/*
 * General Mocking
 */
global.mocks = {};
global.mocks.package = {};

/* Events */
global.mocks.EventEmitter = jasmine.createSpyObj("EventEmitter", ["on", "emit"]);
global.mocks.events = {};
global.mocks.events.EventEmitter = jasmine.createSpy("events.EventEmitter");
global.mocks.events.EventEmitter.and.callFake(function() {
	return global.mocks.EventEmitter;
});

/* Filesystem */
global.mocks.fs = jasmine.createSpyObj("fs", ["readFileSync", "readdirSync"]);
global.mocks.fs.readFileSync.and.callFake(function(file) {
	file = file.replace("/../../../", "");
	if(file === "package.json") {
		returning = global.mocks.package;
	}
	
	if(global.mocks.fs.errors[file]) {
		throw global.mocks.fs.errors[file];
	}
	
	var returning = global.mocks.fs.files[file];
	if(returning) {
		return JSON.stringify(returning);
	} else {
		throw new Error("File not found: " + file);
	}
});

global.mocks.fs.readdirSync.and.callFake(function(directory) {
	directory = directory.replace("/../../../", "");
	if(global.mocks.fs.errors[directory]) {
		throw global.mocks.fs.errors[directory];
	}
	return global.mocks.fs.directories[directory] || [];
});

global.mocks.fs.directories = {};
global.mocks.fs.errors = {};
global.mocks.fs.files = {};

/* Null Extension */
global.mocks.nullExtension = {};
