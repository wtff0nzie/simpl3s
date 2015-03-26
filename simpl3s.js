/***************************************************
 *                       SiMpL3S
 ****************************************************
 *
 *   About:  Simple HTTP file flinger
 *
 ****************************************************/
'use strict';

var staticFiles = require('node-static'),
    minify = require('smushers'),
    fs = require('fs'),
    optExists = {},
    config = {},
    fileServer,
    stats,
    imgs;


imgs = {
    'gif'   : true,
    'jpeg'  : true,
    'jpg'   : true,
    'png'   : true
};

// Apply config with sensible defaults
var setConfig = function (cfg) {
    if (!cfg) {
        cfg = {};
    }

    config = {
        port    : (process.env.PORT || process.env.port || cfg.port || config.port || 8080),
        path    : (cfg.path || config.path || './public'),
        minify  : (config.minify || true),
        header  : (cfg.header || config.header || 'S'),
        gzip    : (config.gzip || true)
    };

    if (cfg.gzip === false) {
        config.gzip = false;
    }

    if (cfg.minify === false) {
        config.minify = false;
    }

    fileServer = new staticFiles.Server(config.path, {
        gzip        : config.gzip,
        serverInfo  : config.header
    });
};


// Obligatory non-persisted stats
stats = {
    errors  : 0,
    hits    : 0
};


// Return stats
var getStats = function () {
    return JSON.parse(JSON.stringify(stats));
};


// Init standalone server
var init = function (cfg) {
    setConfig(cfg);

    if (config.gzip !== false) {
        minify.crush(config.path);
    }

    // Listen for HTTP requests
    require('http').createServer(function (req, res) {
        serveFile(req, res);
    }).listen(config.port);

    console.log('SiMpL3S now listening on port ' + config.port);
};


// Serve a single file
var serveFile = function (req, res) {
    var optimisedFilename,
        fileExtension,
        fileName;

    var serve = function () {
        try {
            fileServer.serve(req, res);
            stats.hits++;
        } catch (e) {
            console.log(e);
            res.writeHead(404);
            res.end('404');
            stats.errors++;
        }
    };

    if (req.url === '/') {
        req.url = '/index.html'
    }

    fileName = req.url.split('.');
    fileExtension = fileName[fileName.length - 1].toLowerCase();

    // Handle non image assets
    if (!imgs[fileExtension]) {
        serve();
        return;
    }

    // Handle images
    fileName.pop();
    optimisedFilename = fileName.join('.') + '.opt.' + fileExtension;

    // An optimised version of this file exists, serve it
    if (optExists[req.url]) {
        req.url = optimisedFilename;
        serve();
    } else if (imgs[fileExtension]) {
        // Does optimised version exist?
        fs.readFile(config.path + optimisedFilename, function(err) {
            if (!err) {
                optExists[req.url] = 1;
                req.url = optimisedFilename;
            }
            serve();
        });
    }
};


// Public API
var server = function (cfg) {
    setConfig(cfg);

    return {
        config      : setConfig,
        init        : init,
        server      : init,
        serveFile   : serveFile,
        set         : setConfig,
        speedify    : minify.crush,
        stats       : getStats,
        minifiers   : minify
    };
};


// Public API
module.exports = server();