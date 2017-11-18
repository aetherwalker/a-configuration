describe("Local configuration read", function() {
	var configuration, source;
	var fs = mocks.fs;

	beforeEach(function() {
		source = [];
		
		fs.directories["app/configuration/"] = ["one.json"];
		
		source[0] = fs.files["app/configuration/one.json"] = {
			"key1": "value",
			"key2": [1,2,3],
			"key3": {
				"key3.1": 1,
				"key3.2": [4,5,6]
			},
			"key4": "ToOverwrite"
		};
		
		source[1] = fs.files["app/configuration/two.json"] = {
			"key2": [1,2,3],
			"key3": {
				"key3.1": 1,
				"key3.2": [4,5,6]
			},
			"key4": "newvalue"
		};
	});

	it("Reads on configuration file", function() {
		configuration = testConfiguration();
		expect(fs.readFileSync).toHaveBeenCalled();
		expect(configuration.key1).toBe(source[0].key1);
	});
});
