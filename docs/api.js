YUI.add("yuidoc-meta", function(Y) {
   Y.YUIDoc = { meta: {
    "classes": [
        "Configuration"
    ],
    "modules": [
        "a-configuration"
    ],
    "allModules": [
        {
            "displayName": "a-configuration",
            "name": "a-configuration",
            "description": "Configurations load in 2 stages.\n\nThe first stage is a blocking file read to provide base data for the application and base configurations\nas described by the system.\n\nThe second stage is to load data from extended data sources in a non-blocking fashion. A `_await`\nproperty is provided as a Promise to allow for waiting for the full configuration load if desired. \n\nNote that as this extends an EventEmitter, colliding key names should be avoided, such as \"on\" and\n\"once\". Due to the nature of the EventEmitter properties and for simplicity, Configuration merely\nextends the EventEmitter class so that `configuration.on` and similar methods are simply available\nwithout needing to remember referencing such as `configuration._events.on`, however the extended\nevent emitted is also available as _events to allow for key collision if needed.\n\nAdditionally, this module binds a listener to the \"SIGHUP\" Process Event to trigger configuration\nreload events."
        }
    ],
    "elements": []
} };
});