# A Configuration

[![Build Status](https://secure.travis-ci.org/aetherwalker/a-configuration.png)](http://travis-ci.org/aetherwalker/a-configuration)

In Brief; This module exists to simplify and consolidate various files in a directory and to leverage other paths for generalized configuration.

Specifically, this module merges JSON files in various directories ("app/configuration/" by default) into a single exported module for reference while also merging default "global" JSON files (Omitted by default) as well to allow for "system" level configuration to be applied along with the "application" level configuration.

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

#### application
Type: `String`  
Aliases: app, locals, directory  
Default: "app/configuration/"

Relative file path to where the "app" configurations are located. These configurations are applied _last_ and will overwrite any previously written values.

#### system
Type: `String`  
Aliases: sys, globals  
Default: null

Relative file path to where the "local" configurations are for your application. These configurations are applied _first_ and can be overwritten by similar keys in local configurations.

#### ignore
Type: `String`
Aliases: -
Default: "_"

Used to determine if the _first_ character of a key indicates if that key should be ignored. By default, only the '_' character indicates that a key should be ignored. So if a configuration file has the key '_' at the top level, then that key will not be added to the configuration. The ignore character does not apply to key names below the top level.

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
	},
	"redis": {
		"host": "redis.example.com",
		"user": "redis-user",
		"pass": "redis-pass"
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
