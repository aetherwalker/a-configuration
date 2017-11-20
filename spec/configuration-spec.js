describe("Application configuration", function() {
	var configuration, source;
	var fs = mocks.fs;
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

	describe("single application configuration file", function() {
		beforeEach(function() {
			configuration = testConfiguration();
			expect(fs.readFileSync).toHaveBeenCalled();
		});

		it("Maps top level direct values", function() {
			expect(configuration.key1).toBe(source[0].key1);
			expect(configuration.key4).toBe(source[0].key4);
		});

		it("Maps top level arrays", function() {
			expect(configuration.key2[0]).toBe(source[0].key2[0]);
			expect(configuration.key2[1]).toBe(source[0].key2[1]);
			expect(configuration.key2[2]).toBe(source[0].key2[2]);
			expect(configuration.key2[3]).toBe(source[0].key2[3]);
			expect(configuration.key2[4]).toBe(source[0].key2[4]);
			expect(configuration.key2[5]).toBe(source[0].key2[5]);
		});

		it("Maps sub-key values", function() {
			expect(configuration.key3.k31).toBe(source[0].key3.k31);
			expect(configuration.key3.k3c).toBe(source[0].key3.k3c);
		});

		/* Sub-Key Arrays */
		it("Maps sub-key arrays", function() {
			expect(configuration.key3.k32[0]).toBe(source[0].key3.k32[0]);
			expect(configuration.key3.k32[1]).toBe(source[0].key3.k32[1]);
			expect(configuration.key3.k32[2]).toBe(source[0].key3.k32[2]);
			expect(configuration.key3.k32[3]).toBe(source[0].key3.k32[3]);
			expect(configuration.key3.k32[4]).toBe(source[0].key3.k32[4]);
			expect(configuration.key3.k32[5]).toBe(source[0].key3.k32[5]);
		});
	});

	describe("multiple application configuration files", function() {
		beforeEach(function() {
			fs.directories["app/configuration/"] = ["one.json", "two.json"];
			configuration = testConfiguration();
		});

		it("Merges top level direct values", function() {
			expect(configuration.key1).toBe(source[0].key1);
			expect(configuration.key4).toBe(source[1].key4);
		});

		it("Merges top level arrays", function() {
			expect(configuration.key2[0]).toBe(source[1].key2[0]);
			expect(configuration.key2[1]).toBe(source[1].key2[1]);
			expect(configuration.key2[2]).toBe(source[1].key2[2]);
			expect(configuration.key2[3]).toBe(source[0].key2[3]);
			expect(configuration.key2[4]).toBe(source[0].key2[4]);
			expect(configuration.key2[5]).toBe(source[0].key2[5]);
		});

		it("Merges sub-key values", function() {
			expect(configuration.key3.k31).toBe(source[0].key3.k31);
			expect(configuration.key3.k3c).toBe(source[1].key3.k3c);
		});

		it("Merges sub-key arrays", function() {
			expect(configuration.key3.k32[0]).toBe(source[1].key3.k32[0]);
			expect(configuration.key3.k32[1]).toBe(source[1].key3.k32[1]);
			expect(configuration.key3.k32[2]).toBe(source[1].key3.k32[2]);
			expect(configuration.key3.k32[3]).toBeUndefined();
			expect(configuration.key3.k32[4]).toBeUndefined();
			expect(configuration.key3.k32[5]).toBeUndefined();
		});
	});

	// Module tests pending resolution of https://github.com/felixge/node-sandboxed-module/issues/64
	xdescribe("containing application configuration modules", function() {
		beforeEach(function() {
			fs.directories["app/configuration/"] = ["one.json", "two.json", "three.js"];
			configuration = testConfiguration();
		});

		it("Merges top level direct values", function() {
			expect(configuration.key1).toBe(source[0].key1);
			expect(configuration.key4).toBe(source[1].key4);
		});

		it("Merges top level arrays", function() {
			expect(configuration.key2[0]).toBe(source[1].key2[0]);
			expect(configuration.key2[1]).toBe(source[1].key2[1]);
			expect(configuration.key2[2]).toBe(source[1].key2[2]);
			expect(configuration.key2[3]).toBe(source[0].key2[3]);
			expect(configuration.key2[4]).toBe(source[0].key2[4]);
			expect(configuration.key2[5]).toBe(source[0].key2[5]);
		});

		it("Merges sub-key values", function() {
			expect(configuration.key3.k31).toBe(source[0].key3.k31);
			expect(configuration.key3.k3c).toBe(module.resolved.key3.k3c); // Module Overwrite
		});

		it("Merges sub-key arrays", function() {
			expect(configuration.key3.k32[0]).toBe(source[1].key3.k32[0]);
			expect(configuration.key3.k32[1]).toBe(source[1].key3.k32[1]);
			expect(configuration.key3.k32[2]).toBe(source[1].key3.k32[2]);
			expect(configuration.key3.k32[3]).toBeUndefined();
			expect(configuration.key3.k32[4]).toBeUndefined();
			expect(configuration.key3.k32[5]).toBeUndefined();
		});
	});
});
