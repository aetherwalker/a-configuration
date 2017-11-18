module.exports = function(grunt) {
	require("load-grunt-tasks")(grunt);

	grunt.loadNpmTasks("grunt-jasmine-nodejs");
	grunt.loadNpmTasks("grunt-contrib-yuidoc");
	grunt.loadNpmTasks("gruntify-eslint");
	
	var gruntConfiguration = {
		pkg: grunt.file.readJSON("package.json"),
		eslint: {
			options: {
				ecmaFeatures: {
					modules: true
				},
				globals: [
					"requireUnit",
					"testConfiguration",
					"Promise",
					"module",
					"jasmine",
					"__dirname",
					"require",
					"process",
					"global",
					"mocks"
				],
				/* http://eslint.org/docs/rules/ */
				rules: {
					/* Programmatically Fixable */
					"eqeqeq": 0,
					"curly": 2,
					"quotes": [2, "double"],
					"block-scoped-var": 2,
					"no-undef": 2,
					"semi": 2,
					"indent": [2, "tab", {
						"MemberExpression": 0
					}],
					"no-mixed-spaces-and-tabs": 2,
					"new-parens": 2,
					"keyword-spacing": [2, {
						"before": true,
						"after": true,
						"overrides": {
							"if": {
								"after": false
							},
							"catch": {
								"after": false
							}
						}
					}],
					"key-spacing": [2, {}],
//					"comma-spacing": 2,
					"comma-dangle": 2,
					"brace-style": 2,
					"no-trailing-spaces": [2, {
						"skipBlankLines": true,
						"ignoreComments": true
					}],
					"object-curly-newline": [2, {
							"minProperties": 2
						}
					],
					"object-property-newline": 2,
					"space-before-blocks": 2,
					"space-before-function-paren": [2, "never"],
					"space-in-parens": 2,

					/* Manually Fixable */
					"max-depth": 2,
					"no-unused-vars": [1, {
							varsIgnorePattern: "^(drop|opt|_)" // "opt" For optional vars that maybe pending and "_" for similar
						}
					],
					"camelcase": 1,
					"require-jsdoc": 1
				},
				envs: ["nodejs", "jasmine"]
			},
			target: ["lib/**/*.js", "spec/**/*.js"]
		},
		watch: {
			build: {
				files: ["lib/**/*.js", "spec/**/*.js"],
				tasks: ["spec"]
			}
		},
		jasmine_nodejs: {
			options: {
				specNameSuffix: "spec.js",
				helperNameSuffix: "helper.js",
				useHelpers: true,
				stopOnFailure: true,
				reporters: {
	                console: {
	                    colors: 1,        // (0|false)|(1|true)|2
	                    cleanStack: 1,       // (0|false)|(1|true)|2|3
	                    verbosity: 4,        // (0|false)|1|2|3|(4|true)
	                    listStyle: "indent", // "flat"|"indent"
	                    activity: false
	                },
					junit: {
						savePath : "./spec/reports/jasmine",
						filePrefix: "unit",
						useDotNotation: true,
						consolidate: false
					}
				}
			},
			unit: {
				specs: ["./spec/*.js"],
				helpers: ["./spec/_helper.js"]
			}
		},
		yuidoc: {
			compile: {
				name: "<%= pkg.name %>",
				description: "<%= pkg.description %>",
				version: "<%= pkg.version %>",
				url: "<%= pkg.homepage %>",
				options: {
					paths: "./lib",
					outdir: "./docs"
				}
			}
		}
	};
	
	grunt.initConfig(gruntConfiguration);
	grunt.registerTask("spec", ["eslint", "jasmine_nodejs:unit"]);
	grunt.registerTask("build", ["spec", "yuidoc"]);
	grunt.registerTask("dev", ["spec", "watch"]);
	grunt.registerTask("default", ["spec"]);
};
