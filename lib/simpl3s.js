/***************************************************
*                       SiMpL3S
****************************************************
*
*   About:  Simple HTTP file flinger
*
****************************************************/
'use strict';

let staticFiles = require('node-static'),
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
const setConfig = (cfg) => {
    if (!cfg) {
        cfg = {};
    }

    config = {
        port    : (process.env.PORT || process.env.port || cfg.port || config.port || 8080),
        path    : (cfg.path || config.path || './www'),
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
        cache       : -1,
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
const getStats = () => {
    return JSON.parse(JSON.stringify(stats));
};


// Serve a single file
const serveFile = (req, res) => {
    let optimisedFilename,
        fileExtension,
        fileName,
        serve;

    serve = () => {
        try {
            fileServer.serve(req, res);
            stats.hits = stats.hits + 1;
        } catch (e) {
            console.log(e);
            res.writeHead(404);
            res.end('404');
            stats.errors = stats.errors + 1;
        }
    };

    if (req.url === '/') {
        req.url = '/index.html';
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
        fs.readFile(config.path + optimisedFilename, (err) => {
            if (!err) {
                optExists[req.url] = 1;
                req.url = optimisedFilename;
            }
            serve();
        });
    }
};


// Init standalone server
const init = (cfg) => {
    setConfig(cfg);

    if (config.gzip !== false) {
        minify.crush(config.path);
    }

    // Listen for HTTP requests
    require('http').createServer((req, res) => {
        serveFile(req, res);
    }).listen(config.port);

    console.log('SiMpL3S now listening on port ' + config.port);
};


// Public API
const server = (cfg) => {
    setConfig(cfg);

    return {
        config      : setConfig,
        fileServer  : staticFiles.serveFile,
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