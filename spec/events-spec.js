describe("Event emission", function() {
	var configuration, source;
	var fs = mocks.fs;
	var process = mocks.process;
	var module = mocks.module;

	beforeEach(function() {
		source = [];

		fs.directories["app/configuration/"] = ["one.json"];

		source[0] = fs.files["app/configuration/one.json"] = {
			"key1": "value",
			"key2": [1,2,3,4,5,6],
			"key3": {
				"k31": 1,
				"k32": [1,2,3,4,5,6],
				"k3c": "constant"
			},
			"key4": "ToOverwrite"
		};

		source[1] = fs.files["app/configuration/two.json"] = {
			"key2": ["a","b","c"],
			"key3": {
				"k32": ["a","b","c"],
				"k3c": "nope"
			},
			"key4": "newvalue"
		};
	});

	afterEach(function() {
		process.removeAllListeners("SIGHUP");
	});

	describe("Configuration Events", function() {
		it("Fulfils the _await promise", function(done) {
			configuration = testConfiguration();
			configuration
			._await
			.then(done)
			.catch(function() {
				fail("Failed where it should have loaded");
			});
		});
		
		it("Fails the _await promise for missing file", function(done) {
			fs.directories["app/configuration/"] = ["one.json", "missing.json"];
			configuration = testConfiguration();
			configuration
			._await
			.then(function() {
				fail("Loaded where it should have failed");
			})
			.catch(done);
		});

		// TODO:
		// Module tests pending resolution of https://github.com/felixge/node-sandboxed-module/issues/64
		xit("Fails the _await promise for failed module resolutions", function(done) {
			module.error = new Error();
			fs.directories["app/configuration/"] = ["one.json", "three.js"];
			configuration = testConfiguration();
			configuration
			._await
			.then(function() {
				fail("Loaded where it should have failed");
			})
			.catch(function(err) {
				global.console.log("Err: ", err);
				done();
			});
		});

		it("Emits a failed event when a file is missing", function(done) {
			fs.directories["app/configuration/"] = ["one.json", "two.json", "missing.json"];
			configuration = testConfiguration();
			configuration.on("failed", done);
			configuration._await.catch(function() {}); // For cleanliness
		});

		it("Emits a loaded event when complete with a signle file", function(done) {
			configuration = testConfiguration();
			configuration.on("loaded", done);
		});

		it("Emits a loaded event when complete with multiple files", function(done) {
			fs.directories["app/configuration/"] = ["one.json", "two.json"];
			configuration = testConfiguration();
			configuration.on("loaded", function() {
				expect(configuration.key4).toBe(source[1].key4);
				done();
			});
		});

		// TODO:
		// Module tests pending resolution of https://github.com/felixge/node-sandboxed-module/issues/64
		xit("Emits a loaded event when complete with module", function(done) {
			fs.directories["app/configuration/"] = ["one.json", "three.js"];
			configuration = testConfiguration();
			configuration.on("failed", function(err) {
				fail("Failed where it should have loaded: " + (err.toString?err.toString():err));
			});
			configuration.on("loaded", function() {
				expect(configuration.key3.k3c).toBe(module.resolved.key3.k3c);
				done();
			});
		});
	});

	describe("System Event Response", function() {
		it("Responds to SIGHUP for configuration adjustments", function() {
			delete(process.SIGHUP);
			configuration = testConfiguration();
			expect(process.SIGHUP).toBeDefined();
			expect(configuration.key4).toBe(source[0].key4);

			fs.directories["app/configuration/"] = ["one.json", "two.json"];
			process.SIGHUP();
			expect(configuration.key4).toBe(source[1].key4);
		});
	});
});
