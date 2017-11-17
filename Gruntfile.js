module.exports = function(grunt) {
	require("load-grunt-tasks")(grunt);

	grunt.loadNpmTasks("grunt-jasmine-nodejs");
	grunt.loadNpmTasks("grunt-contrib-yuidoc");
	grunt.loadNpmTasks("grunt-contrib-watch");
	grunt.loadNpmTasks("grunt-eslint");
	grunt.loadNpmTasks("grunt-env");
	
	var gruntConfiguration = {
		pkg: grunt.file.readJSON("package.json"),
		eslint: {
			options: {
				ecmaFeatures: {
					modules: true
				},
				globals: [
					"requireSubject"
				],
				/* http://eslint.org/docs/rules/ */
				rules: {
					/* Programatic Fixes */
					"eqeqeq": 0,
					"curly": 2,
					"quotes": [2, "double"],
					"block-scoped-var": 2,
					"no-undef": 2,
					"semi": 2,
					"indent": [2, "tab"],
					"no-mixed-spaces-and-tabs": 2,
					"new-parens": 2,
					"keyword-spacing": [2, {
							"before": true,
							"after": false
						}
					],
					"key-spacing": [2, {}],
					"comma-spacing": 2,
					"comma-dangle": 2,
					"brace-style": 2,
					"no-trailing-spaces": 2,
					"object-curly-newline": [2, {
							"minProperties": 2
						}
					],
					"object-property-newline": 2,
					"space-before-blocks": 2,
					"space-before-function-paren": [2, "never"],
					"space-in-parens": 2,

					/* Manual Fixes */
					"max-depth": 2,
					"no-unused-vars": [1, {
							varsIgnorePattern: "^drop"
						}
					],

					/* Warnings */
					"camelcase": 1,
					"require-jsdoc": 1
				},
				"fix": true,
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
				specs: ["./spec/unit/**"],
				helpers: ["./node_modules/babel-register/lib/node.js", "./spec/helpers/**"]
			},
			e2e: {
				specs: ["./spec/e2e/**"],
				helpers: ["./node_modules/babel-register/lib/node.js"]
			}
		},
		yuidoc: {
			compile: {
				name: "<%= pkg.name %>",
				description: "<%= pkg.description %>",
				version: "<%= pkg.version %>",
				url: "<%= pkg.homepage %>",
				options: {
					paths: "./app",
					outdir: "./docs"
				}
			}
		}
	};
	
	grunt.initConfig(gruntConfiguration);
	grunt.registerTask("spec", ["eslint", "spec:unit"]);
	grunt.registerTask("development", ["spec", "watch"]);
	grunt.registerTask("default", ["spec"]);
};
