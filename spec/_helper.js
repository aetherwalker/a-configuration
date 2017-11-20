/* Injection */
var sandbox = require("sandboxed-module");
global.requireUnit = function(path, requires, globals, locals) {
	requires = requires || {};
	globals = globals || {};
	locals = locals || {};
	return sandbox.require("../lib/" + path, {
		"requires": requires,
		"globals": globals,
		"locals": locals,
		"ignoreMissing": true
	});
};

global.testConfiguration = function(requires, globals, locals) {
	requires = requires || {};
	requires.fs = global.mocks.fs;

	// TODO:
	// Module tests pending resolution of https://github.com/felixge/node-sandboxed-module/issues/64
	//requires["/../../../app/configuration/three.js"] = global.mocks.module;
	
	// Note:
	//requires.events = global.mocks.events; // This is omitted as the EventEmitter is an integrol part of the system and should be tested as such
	
	locals = locals || {};
	locals.__dirname = locals.__dirname || "";

	globals = globals || {};
	globals.process = global.mocks.process;
	
	return global.requireUnit("index.js", requires, globals, locals);
};

/*
 * General Mocking
 */
global.mocks = {};
global.mocks.package = {};

/* Events */
global.mocks.EventEmitter = jasmine.createSpyObj("EventEmitter", ["on", "emit", "once"]);
global.mocks.events = {};
global.mocks.events.EventEmitter = jasmine.createSpy("events.EventEmitter");
global.mocks.events.EventEmitter.and.callFake(function() {
	return global.mocks.EventEmitter;
});

/* Process */
global.mocks.process = jasmine.createSpyObj("Process", ["on", "removeAllListeners"]);
global.mocks.process.on.and.callFake(function(key, listener) {
	global.mocks.process[key] = listener;
});

/* Filesystem */
global.mocks.fs = jasmine.createSpyObj("fs", ["readFileSync", "readdirSync", "lstatSync"]);
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

global.mocks.fs.lstatSync.and.callFake(function(file) {
	var lstat = jasmine.createSpyObj("lstat", ["isDirectory"]);
	lstat.isDirectory.and.callFake(function() {
		return !!global.mocks.fs.directories[file];
	});
	return lstat;
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

/* Mock Module */
global.mocks.module = jasmine.createSpyObj("module", ["resolve"]);
global.mocks.module.resolved = {};
global.mocks.module.resolved.key3 = {};
global.mocks.module.resolved.key3.k3c = "yup";
global.mocks.module.resolve = function() {
	return new Promise(function(done, fail) {
		if(global.mocks.module.error) {
			fail(global.mocks.module.error);
			delete(global.mocks.module.error);
		} else {
			done(global.mocks.module.resolved);
		}
	});
};
