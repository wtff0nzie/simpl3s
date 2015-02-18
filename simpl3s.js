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
    config = {},
    fileServer,
    stats;


// Apply config with sensible defaults
var setConfig = function (cfg) {
    if (!cfg) {
        cfg = {};
    }

    config = {
        port    : (process.env.PORT || process.env.port || cfg.port || config.port || 8081),
        path    : (cfg.path || config.path || './public'),
        minify  : (cfg.minify || config.minify || true),
        header  : (cfg.header || config.header || 'S'),
        gzip    : (cfg.gzip || config.gzip || true)
    };

    fileServer = new staticFiles.Server(config.path, {
        gzip        : config.gzip || true,
        serverInfo  : config.header
    });
};


// Obligatory non-persisted stats
stats = {
    errors  : 0,
    hits    : 0
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
    if (req.url === '/') {
        req.url = '/index.html'
    }

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


// Public APIg
var server = function (cfg) {
    setConfig(cfg);

    return {
        config      : setConfig,
        init        : init,
        server      : init,
        speedify    : minify.crush,
        minifiers   : minify
    };
};


// Public API
module.exports = server();