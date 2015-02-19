# Simpl3s

Small, fast, quick and easy node.js file flinger with a silly name.

## Features
* Small static file HTTP server
* Fast!
* CSS/HTML/JS files are automatically minified and gzipped
* JSON/SVG/TXT/XML file are automatically gzipped
* Silly name

## Quick usage
    require('simpl3s').server();


## Sample configuration
    var simpl3s = require('simpl3s'),
        config = {
            gzip: true,
            port: 8081,
            path: './public'
        };

    simpl3s.server(config);


## Serve a single file
    var simpl3s = require('simpl3s');

    simpl3s.serveFile(req, res);


## Just optimise static assets

    require('simpl3s').speedify('./public');


## Notes
Explicit port configuration will be ignored if a cloud environment is detected. Defaults to 8081 when no port is specified.

## Installation

#### npm
* npm install simpl3s