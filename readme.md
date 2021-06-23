# A Configuration

[![Version npm](https://img.shields.io/npm/v/a-configuration.svg)](https://www.npmjs.com/package/a-configuration)

In Brief; This module exists to simplify and consolidate various files in a directory and to leverage other paths for generalized configuration and extends the [NodeJS EventEmitter](https://nodejs.org/api/events.html#events_class_eventemitter) class to offer update events.

Specifically, this module merges JSON and Javascript files in various directories ("app/configuration/" by default) into a single exported module for reference while also merging default "global" JSON and Javascript files (Unspecified by default) as well to allow for "system" level configuration to be applied as well.

# Getting Started

## Installation

```
npm install a-configuration
```

## Usage

```javascript
var configuration = require("a-configuration");
```

See [NodeJS documentation](https://nodejs.org/api/events.html#events_class_eventemitter) for the methods and properties provided by the EventEmitter parent.

See [GitHub Pages](https://aetherwalker.github.io/a-configuration/) for the a-configuration API.

Note that files in a directory are ordered lexicographically, so if priority between files is needed, use numeric prefixing to guarantee load order; ie. [ "00-package.js", "10-logger.js", "20-database.js" ] .

### Simple Case

In your Node project, create an `app` directory and in that directory create a `configuration` directory [app/configuration] and place any JSON or javascript files in that directory that you wish to use to specify configuration values.

See the examples below or check out the [Wiki on Github](https://github.com/aetherwalker/a-configuration/wiki) for additional information.

### Custom Case

Modify your `package.json` file by adding the key `aconfiguration` and then specify the keys you wish to override:

(Note that specification through environment variables is planned for V1.2)

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

#### ignore
Type: `String`  
Aliases: -  
Default: "_"

Used to determine if the _first_ character of a key indicates if that key should be ignored. By default, only the '_' character indicates that a key should be ignored. So if a configuration file has the key '_' at the top level, then that key will not be added to the configuration. The ignore character does not apply to key names below the top level. For instance `{"_key": "..."}` would be ignored, however `{"key": {"_subkey": "..."}}` would not result in "_subkey" being ignored. 

## Implementing Configurations

### JSON Files

JSON files are used directly and can simply be edited for configuration reloading.

### Javascript Modules

Javascript files must specify a `module.exports.resolve` function that returns an object or a promise and optionally takes an argument for the configuration object to be passed to it (This is the recommended way to get the Configuration object instead of "require('a-configuration')" in the module itself). If the exported module does not have a resolve function, then the configuration will not attempt to use that module. If the "resolve" field exists but is not a function, then an error will be thrown.

If a Promise is returned by `resolve`, it must complete with an object representing the configuration to be applied. The returned object acts the same as a JSON file as far as applying values to the exported configuration is concerned.

If a Promise is used and there is a problem with generating the configuration in the module, fail the Promise and the configuration will error out accordingly. Note that this will result in an `error` event, but it will _not_ block the configuration from loading JSON files and thus having configuration data that can be used.

Additionally, note that `resolve` may be called multiple times during the application's execution. Subsequent calls are how the module handles "reloading" the configuration. Along that point, changing the code for an included javascript file will not make any difference in the configuration.

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
```

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

The "Mongo" and "Redis" modules in the example above do NOT reflect how those modules are actually used. See their documentation for usage and examples.
