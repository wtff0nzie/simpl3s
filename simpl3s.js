/***************************************************
 *                       SiMpL3S
 ****************************************************
 *
 *   About:  Simple node based HTTP file flinger
 *
 ****************************************************/
'use strict';


// Find and gzip static contents
var gzipStaticContents = function (path) {
    var minify = require('html-minifier').minify,
        cleanCSS = require('clean-css'),
        uglify = require('uglify-js'),
        zlib = require('zlib'),
        fs = require('fs');


    // Sync file read
    var readFileSync = function (fileName) {
        return fs.readFileSync(fileName).toString();
    };


    // Sync file write
    var writeFileSync = function (fileName, contents) {
        fs.writeFileSync(fileName, contents);
    };


    // Delete file
    var deleteFile = function (fileName, callback) {
        fs.unlink(fileName, function (err) {
            if (err) {
                console.log(err);
                return;
            }

            if (callback) {
                callback(err, fileName);
            }
        });
    };


    // gZip a file
    var compressAsset = function (fileName, outputFileName) {
        var input = fs.createReadStream(fileName),
            output = fs.createWriteStream((outputFileName || fileName) + '.gz');

        input.pipe(zlib.createGzip()).pipe(output);
    };


    // Find, minify and compress suitable files
    var compressStaticAssets = function (folder) {
        var canCompress = ['css', 'html', 'htm', 'js', 'json', 'svg', 'txt'];

        traverseFileSystem(folder, function (currentFile, currentPath) {
            var fName = currentFile.split('.'),
                extension = fName[fName.length - 1].toLowerCase(),
                outputFileName = currentFile,
                deleteTemp = false,
                source;

            if (fName && fName.length > 0 && extension) {
                if (canCompress.indexOf(extension) > -1) {

                    // Minify HTML, CSS,  JS
                    if (extension === 'css' || extension === 'js' || extension.indexOf('htm') > -1) {
                        source = readFileSync(currentFile);

                        if (extension === 'js') {
                            source = uglify.minify(currentFile).code;
                        } else if (extension === 'css') {
                            source = new cleanCSS().minify(source).styles;
                        } else {
                            source = minify(source, {
                                collapseWhitespace  : true,
                                removeComments      : true
                            });
                        }

                        outputFileName = currentFile + '-mini';
                        writeFileSync(outputFileName, source);
                        deleteTemp = true;
                    }

                    // gZip asset
                    setTimeout(function () {
                        compressAsset(outputFileName, currentFile);
                    }, 99);

                    // Clean up tmp files
                    if (deleteTemp) {
                        setTimeout(function () {
                            deleteFile(outputFileName);
                        }, 999);
                    }
                }
            }
        });
    };


    // Recursive file / folder dance, do stuff
    var traverseFileSystem = function (currentPath, func) {
        var files = fs.readdirSync(currentPath);

        files.forEach(function (file) {
            var currentFile = currentPath + '/' + file;

            fs.stat(currentFile, function(err, stat) {
                if (err) {
                    return;
                }

                if (stat.isFile()) {
                    if (func) {
                        func(currentFile, currentPath)
                    }
                } else if (stat.isDirectory()) {
                    traverseFileSystem(currentFile, func);
                }
            });
        });
    };


    // Lets not kill the server on start-up
    try {
        compressStaticAssets(path);
    } catch(ignore) {}
};


// Start up new server
var server = function () {

    var init = function (config) {
        var staticFiles = require('node-static'),
            config = config || {},
            port = process.env.PORT || process.env.port || config.port || 8081,
            path = config.path || './public',
            fileServer;


        if (config.gzip !== false) {
            gzipStaticContents(path, config.minify || true);
        }

        fileServer = new staticFiles.Server(path, {
            gzip        : config.gzip || true,
            serverInfo  : 'S'
        });


        // Listen for HTTP requests
        require('http').createServer(function (req, res) {
            if (req.url === '/') {
                req.url = '/index.html'
            }

            try {
                fileServer.serve(req, res);
            } catch (e) {
                console.log(e);
                res.writeHead(404);
                res.end('404');
            }
        }).listen(port);

        console.log('SiMpL3S now listening on port ' + port);
    };

    return {
        init: init
    };
};


// Public API
module.exports = server();