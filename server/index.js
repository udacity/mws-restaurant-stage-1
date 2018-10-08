/*global __dirname process:true*/

const spdy = require('spdy');
const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();

// setting views engine
app.set('views', path.join(__dirname, '../app'));
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');

/**
 * requiring and using routes
 */
app.use(require('./routes'));

/**********************************
            spdy setup
**********************************/
const spdyOptions = {
  key: fs.readFileSync(path.join(__dirname, '/../server.key')),
  cert:  fs.readFileSync(path.join(__dirname, '/../server.crt'))
};

const server = spdy.createServer(spdyOptions, app);

server.listen(process.env.PORT || 3000, (error) => {
  if (error) {
    console.error(error);
    return process.exit(1);
  }
  console.log(`Listening on port ${server.address().port}`);
});

// based on: https://webapplog.com/http2-node/
