# A Configuration

[![Build Status](https://secure.travis-ci.org/aetherwalker/a-configuration.png)](http://travis-ci.org/aetherwalker/a-configuration)
[![Dependency Status](https://david-dm.org/aetherwalker/a-configuration.svg)](https://david-dm.org/aetherwalker/a-configuration)

In Brief; This module exists to simplify and consolidate various files in a directory and to leverage other paths for generalized configuration.

Specifically, this module merges JSON and Javascript files in various directories ("app/configuration/" by default) into a single exported module for reference while also merging default "global" JSON Javascript files (Omitted by default) as well to allow for "system" level configuration to be applied along with the "application" level configuration.

# Getting Started

## Installation

```
npm install a-configuration
```

## Usage

### Simple Case

In your Node project, create an `app` directory and in that directory create a `configuration` directory [app/configuration] and place any JSON files in that directory that you wish to use to specify configuration values.

### Custom Case

Modify your `package.json` file by adding the key `aconfiguration` and then specify the keys you wish to override:

#### final
Type: `String`  
Aliases: finish  
Default: -

Relative file path to configurations to be loaded _last_ and will overwrite any previously written values.

#### application
Type: `String`  
Aliases: app, locals, directory  
Default: "app/configuration/"

Relative file path to where the "app" configurations are located. These configurations are applied _second to last_ and will overwrite any previously written values.

#### files
Type: `Array of Strings`  
Aliases: -  
Default: -

An array of relative or absolute file paths to apply to the configuration in the specified order. These are applied after the system configurations and before the application configurations.

#### system
Type: `String`  
Aliases: sys, globals  
Default: null

Relative or absolute file path to where the configurations the host are located. These configurations are applied _second_ and can be overwritten by similar keys in later configurations.

#### masks
Type: `String`  
Aliases: initial  
Default: -

Relative or absolute file path that specifies an initial mask for the configuration. This is applied _first_ and can be overwritten by similar keys in later configurations.

#### application
Type: `String`  
Aliases: app, locals, directory  
Default: "app/configuration/"

Relative file path to where the "app" configurations are located. These configurations are applied _last_ and will overwrite any previously written values.

#### ignore
Type: `String`  
Aliases: -  
Default: "_"

Used to determine if the _first_ character of a key indicates if that key should be ignored. By default, only the '_' character indicates that a key should be ignored. So if a configuration file has the key '_' at the top level, then that key will not be added to the configuration. The ignore character does not apply to key names below the top level.

## Implementing Configurations

### JSON Files

JSON files are used directly and can simply be edited for configuration reloading.

### Javascript Modules

Javascript files must specify a module.exports with a function `resolve` that returns a promise to be included and optionally takes an argument for the configuration object to be passed to it (This is the recommended way to get the Configuration object instead of requiring "a-configuration" in the module itself). If the exported module does not have a resolve function, it won't be included. If the "resolve" field is not a function, an error will be thrown and if the function doesn't return a Promise, the configuration will not be applied.

The Promise returned by `resolve` must complete with an object representing the configuration to be applied, and then the object acts the same as a JSON file as far as applying values to the exported configuration is concerned.

If there is a problem with generating the configuration in the module, fail the Promise and the configuration will error out accordingly. Note that this will result in an `error` event, but it will not block the configuration from loading the hard JSON files.

Additionally, note that `resolve` can be called multiple times as this function will be how configuration reloads are handled.

# Examples

## Multiple JSON Files for Database Connections

For this example lets assume there is the following:  
+ app/configuration/mongo.json
```json
{
	"mongo": {
		"host": "mongo.example.com"
	}
}
```
+ app/configuration/redis.json
```json
{
	"redis": {
		"host": "redis.example.com"
	}
}
```

Then the configuration will resolve as:
```json
{
	"mongo": {
		"host": "mongo.example.com"
	},
	"redis": {
		"host": "redis.example.com"
	}
}

Now if we add another file; app/configuration/login.json:
```json
{
	"_note": "Do not add this file to the repository",
	"mongo": {
		"user": "mongo-user",
		"pass": "mongo-pass"
	},
	"redis": {
		"user": "redis-user",
		"pass": "redis-pass"
	}
}
```

Then the configuration will resolve as:
```json
{
	"mongo": {
		"host": "mongo.example.com",
		"user": "mongo-user",
		"pass": "mongo-pass"
	},
	"redis": {
		"host": "redis.example.com",
		"user": "redis-user",
		"pass": "redis-pass"
	}
}
```

## Configuring a Server to hold shared information


For this example lets assume there is the following:  
+ /opt/system-configurations/databases.json
```json
{
	"_note": "Managed by Puppet",
	"mongo": {
		"host": "mongo.example.com",
		"user": "mongo-user",
		"pass": "mongo-pass"
	}
}
```
+ app/configuration/mongo.json
```json
{
	"mongo": {
		"database": "myapp"
	}
}
```

To leverage the shared system configuration, the `package.json` would need to be updated to have an `aconfiguration` key at the top level that specifies the relative or absolute path to the relevent configuration files.

Relative paths should start with a "." (ie. "./" or "../"), otherwise the path is assumed to be absolute.

./package.json
```json
{
	...
	"aconfiguration": {
		"system": "/opt/system-configurations/"
	}
}
```

Then the configuration will resolve as:
```json
{
	"mongo": {
		"host": "mongo.example.com",
		"user": "mongo-user",
		"pass": "mongo-pass",
		"database": "myapp"
	}
}
```

## JSON and Javascript Files

For this example lets assume there is the following:  
+ app/configuration/databases.json
```json
{
	"mongo": {
		"host": "mongo.example.com"
	},
	"redis": {
		"host": "redis.example.com"
	}
}
```
+ app/configuration/connect.js
```javascript
var mongo = require("mongo");
var redis = require("redis");

module.exports.resolve = function(configuration) {
	return new Promise(function(done, fail) {
		Promise.all([
			mongo.connect(configuration.mongo),
			redis.connect(configuration.redis)
		])
		.then(function(connections) {
			configuration.mongo.connection = connections[0];
			configuration.redis.connection = connections[1];
			done();
		})
		.catch(fail);
	});
};
```

Then the configuration will _initially_ resolve as:
```json
{
	"mongo": {
		"host": "mongo.example.com"
	},
	"redis": {
		"host": "redis.example.com"
	}
}
```

The connections will still be processing when `require("a-configuration")` finishes. Once _await completes or the "loaded" event fires, the configuration will _finally_ resolve as something similar to:
```json
{
	"mongo": {
		"host": "mongo.example.com",
		"connection": [object MongoConnection]
	},
	"redis": {
		"host": "redis.example.com",
		"connection": [object RedisConnection]
	}
}
```

&#9888; Note!

The "Mongo" and "Redis" modules in the example above do NOT reflect how those modules aare actually used. See their documentation for usage and examples.
