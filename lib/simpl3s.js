/***************************************************
*                       SiMpL3S
****************************************************
*
*   About:  Simple HTTP file flinger with a few
*           perf tricks up it's sleeve.
*
****************************************************/
'use strict';

const serveStatic = require('serve-static'),
    minify = require('smushers'),
    mime = require('mime-types'),
    FS = require('fs'),
    isImg = {
        'gif'   : true,
        'jpeg'  : true,
        'jpg'   : true,
        'png'   : true,
        'webp'  : true
    },
    isText = {
        'css'   : true,
        'htm'   : true,
        'html'  : true,
        'js'    : true,
        'json'  : true,
        'svg'   : true,
        'txt'   : true,
        'xml'   : true
    },
    optimisedVersionExists = {},
    stats = {
        filesRequested  : {},
        error404        : {},
        errors          : 0,
        hits            : 0
    },
    API = {};


let hasMinified = false,
    config = {
        etag        : false,
        fallthrough : false,
        gzip        : false,
        immutable   : true,
        maxAge      : 181635468200,
        minify      : false,
        path        : './www'
    };


// Apply config with sensible defaults -------------
API.setConfig = (customConfig) => {
    if (!customConfig) {
        customConfig = {};
    }

    Object.keys(customConfig)
        .map((key) => {
           config[key] = customConfig[key];
        });

    if (!config.port) {
        config.port = process.env.PORT
            || process.env.port
            || 8080;
    }

    if (process.env.DEV === true) {
        config.maxAge = -1;
    }

    if (config.maxAge < 1) {
        config.immutable = false;
    } else {
        config.immutable = true;
    }

    if (config.minify === true
        && hasMinified === false) {
            minify.crush(config.path);
            hasMinified = true;
    }

    return API;
};


// Return stats ------------------------------------
API.getStats = () => {
    return JSON.parse(JSON.stringify(stats));
};


// Expose configuration ----------------------------
API.getConfig = () => {
    return config;
};


// Share minifiers ---------------------------------
API.minifiers = minify;


// Trigger minifiers -------------------------------
API.speedify = (customConfig, path) => {
    if (customConfig) {
        API.setConfig(customConfig);
    }

    minify.crush(path || config.path);
    return API;
};


// Serve a single file -----------------------------
API.serveFile = (req, res, customConfig) => {
    let isOptimised = false,
        optimisedFilename,
        fileExtension,
        fileName;

    if (customConfig) {
        API.setConfig(customConfig);
    }

    // Set response headers
    const setHeaders = (res, path) => {
        let acceptsEncoding = (req.headers['accept-encoding'] || '')
            .toLowerCase()
            .split(',')
            .map((item) => {
                return (item || '').trim();
            })
            .includes('gzip');

        res.setHeader('Content-Type', mime.lookup(fileExtension));

        if (config.gzip
            && acceptsEncoding === true
            && isOptimised === true
            && isText[fileExtension.toLowerCase()]) {
                res.setHeader('Content-Encoding', 'gzip');
        }
    };

    // Serve file
    const serve = () => {
        const handleError = (err) => {
            console.error('Could not serve file', req.url, err);

            if (!stats.error404[req.url]) {
                stats.error404[req.url] = 0;
            }
            stats.error404[req.url]++;
            stats.errors++;

            if (global.EVENTS) {
                return global.EVENTS.emit('error:404', {
                    req     : req,
                    res     : res,
                    data    : {
                        err : err
                    }
                });
            }

            res.writeHead(404);
            res.end('404');
        };

        config.setHeaders = setHeaders;
        serveStatic(config.path, config) (req, res, handleError);

        if (!stats.filesRequested[req.url]) {
            stats.filesRequested[req.url] = 0;
        }
        stats.filesRequested[req.url]++;
        stats.hits++;
    };

    // Prepare optimised filename
    const prepareOptimisedResponse = (err) => {
        if (!err) {
            if (!optimisedVersionExists[req.url]) {
                optimisedVersionExists[req.url] = 0;
            }
            optimisedVersionExists[req.url]++;
            isOptimised = true;

            req.url = optimisedFilename;
        }
        serve();
    };

    // Does optimised version exist?
    const optimisedVersionExists = () => {
        if (config.gzip === false) {
            return serve();
        }

        if (optimisedVersionExists[req.url]) {
            req.url = optimisedFilename;
            isOptimised = true;
            serve();
        } else {
            FS.readFile(`${config.path}${optimisedFilename}`, prepareOptimisedResponse);
        }
    };

    // Handle the request
    const handleRequest = () => {
        if (req.url === '/') {
            req.url = '/index.html';
        }

        fileName = req.url.split('.');
        fileExtension = fileName[fileName.length - 1];

        if (!isImg[fileExtension.toLowerCase()]) {
            optimisedFilename = `${req.url}.gz`;
        } else {
            fileName.pop();
            optimisedFilename = `${fileName.join('.')}.opt.${fileExtension}`;
        }

        optimisedVersionExists();
    };


    handleRequest();
    return API;
};


// Init standalone server --------------------------
API.standAloneServer = (customConfig) => {
    if (customConfig) {
        API.setConfig(customConfig);
    }

    require('http')
        .createServer(API.serveFile)
        .listen(config.port);

    console.log('SiMpL3S now listening on port ' + config.port);

    return API;
};


// Public API --------------------------------------
const init = (cfg) => {
    return API.setConfig(cfg);
};


// Public API
module.exports = init();