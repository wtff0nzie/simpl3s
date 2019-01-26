# Simpl3s

Small, fast, quick and easy node.js file flinger with a silly name.

## Features
* Small static file HTTP server
* Fast!
* CSS/HTML/JS files are automatically minified and gzipped
* JSON/SVG/TXT/XML file are automatically gzipped
* Silly name

## Quick usage
    require('simpl3s').standAloneServer();


## Sample configuration
    const simpl3s = require('simpl3s'),
        config = {
            gzip    : true,
            minify  : true,
            port    : 8081,
            path    : './public'
        };

    simpl3s.standAloneServer(config);


## Complete configuration
    const simpl3s = require('simpl3s'),
        config = {
            etag        : true,
            gzip        : true,
            immutable   : true,
            maxAge      : 181635468200,
            minify      : true,
            path        : './www',
            port        : 8080
        };

    simpl3s.standAloneServer(config);


## Serve a single file
    const simpl3s = require('simpl3s'),
        server = require('http'); 

    server
        .createServer(simpl3s.serveFile)
        .listen(8080);


## Just optimise static assets

    require('simpl3s').speedify({}, './public');


## Notes
Explicit port configuration will be ignored if a cloud environment is detected. Defaults to 8080 when no port is specified.

## Installation

#### npm
* npm install simpl3s