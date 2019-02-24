/***************************************************
*                       SiMpL3S
****************************************************
*
*   About:  Simple HTTP file flinger with a few
*           perf tricks up it's sleeve.
*
****************************************************/
'use strict';

const simp = require('./lib/simpl3s');

console.log('API', simp);
console.log('Config (default)', simp.getConfig());
console.log('Stats', simp.getStats());

simp.setConfig({
   path: './test'
});
console.log('Config (change path)', simp.getConfig());


// Demonstrate stand alone warning

simp.standAloneServer({
    gzip    : true,
    minify  : true
});


/*
// Demonstrate single file serving
require('http')
    .createServer(simp.serveFile)
    .listen(8080);
*/


simp.speedify();

setInterval(() => {
    console.log('Stats', simp.getStats());
}, 10 * 1000);