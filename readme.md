# Simpl3s

Small, fast, quick and easy node.js file flinger with a silly name.

## Features
* Small static file HTTP server
* Fast!
* CSS/HTML/JS files are automatically minified and gzipped
* JSON/TXT/XML file are automatically gzipped
* Silly name

## Quick usage
    require('simpl3s').init();


## Sample configuration
    var simpl3s = require('simpl3s'),
        config = {
            gzip: true,
            port: 8081,
            path: './public'
        };

    simpl3s.init(config);

## Notes
Explicit port configuration will be ignored if a cloud environment is detected. Defaults to 8081 when no port is specified.

## Installation

#### npm
* npm install simpl3s

#### Localhost
* Ensure node.js is installed (http://nodejs.org)
* CD to the freezing-tribble directory
* sudo npm install
* sudo npm update
* node simpl3s.js

#### AWS EB
* Create a zip archive containing this app (ensure package.json is in the root)
* Open AWS EB console
* Choose 'upload archive' option.

#### Heroku
The most convenient approach is to configure your heroku app to listen for commits to github and automatically deploy from a designated branch.

##### Manually from git repo
* ~ heroku git:remote -a heroku-app-name
* ~ git push heroku master

##### Alternatives
* https://devcenter.heroku.com/articles/deploying-nodejs

#### Azure
* http://azure.microsoft.com/en-us/documentation/articles/cloud-services-nodejs-develop-deploy-app/
