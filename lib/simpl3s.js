/***************************************************
*                       SiMpL3S
****************************************************
*
*   About:  Simple HTTP file flinger with a few
*           perf tricks up it's sleeve.
*
****************************************************/
/*jslint browser: false, node: true */

'use strict';

const serveStatic = require('serve-static'),
    minify = require('smushers'),
    mime = require('mime-types'),
    FS = require('fs'),
    is_img = {
        'gif'   : true,
        'jpeg'  : true,
        'jpg'   : true,
        'png'   : true,
        'webp'  : true
    },
    is_text = {
        'css'   : true,
        'htm'   : true,
        'html'  : true,
        'js'    : true,
        'json'  : true,
        'svg'   : true,
        'txt'   : true,
        'xml'   : true
    },
    is_dev_mode = process.env.DEV,
    optimised_version_exists = {},
    stats = {
        filesRequested  : {},
        error404        : {},
        errors          : 0,
        hits            : 0
    },
    API = {};


let has_minified = false,
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
API.setConfig = (custom_config) => {
    if (!custom_config) {
        custom_config = {};
    }

    Object.keys(custom_config)
        .map((key) => {
           config[key] = custom_config[key];
        });

    if (!config.port) {
        config.port = process.env.PORT
            || process.env.port
            || 8080;
    }

    if (is_dev_mode === true) {
        config.maxAge = -1;
    }

    config.immutable = true;
    if (config.maxAge < 1) {
        config.immutable = false;
    }

    if (config.minify === true
        && has_minified === false
        && !is_dev_mode) {
            minify.crush(config.path);
            has_minified = true;
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
API.serveFile = (req, res, custom_config) => {
    let is_optimised = false,
        optimised_filename,
        file_extension,
        file_name;

    if (custom_config) {
        API.setConfig(custom_config);
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

        res.setHeader('Content-Type', mime.lookup(file_extension));

        if (config.immutable) {
            res.setHeader('Expires', 'Mon, 5 Jul 2038 21:31:12 GMT');
        }

        if (config.gzip
            && acceptsEncoding === true
            && is_optimised === true
            && is_text[file_extension.toLowerCase()]) {
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

            if (global.EVENTS
                && req.backpage_payload) {
                    return global.EVENTS.emit('error:404', req.backpage_payload);
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
            if (!optimised_version_exists[req.url]) {
                optimised_version_exists[req.url] = 0;
            }
            optimised_version_exists[req.url]++;
            is_optimised = true;

            req.url = optimised_filename;
        }

        serve();
    };

    // Does optimised version exist?
    const checkOptimisedVersionExists = () => {
        if (config.gzip === false
            || config.minify === false) {
               return serve();
        }

        if (optimised_version_exists[req.url]) {
            req.url = optimised_filename;
            is_optimised = true;
            serve();
        } else {
            FS.readFile(`${config.path}${optimised_filename}`, prepareOptimisedResponse);
        }
    };

    // Handle the request
    const handleRequest = () => {
        if (req.url === '/') {
            req.url = '/index.html';
        }

        file_name = req.url.split('.');
        file_extension = file_name[file_name.length - 1];

        if (!is_img[file_extension.toLowerCase()]) {
            optimised_filename = `${req.url}.gz`;
        } else {
            file_name.pop();
            optimised_filename = `${file_name.join('.')}.opt.${file_extension}`;
        }

        checkOptimisedVersionExists();
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