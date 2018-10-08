/*global __dirname process:true*/

const spdy = require('spdy');
const express = require('express');
const compression = require('compression');
const fs = require('fs');
const path = require('path');

const app = express();
// enabling text based responses compression
app.use(compression());

app.use(express.static(path.join(__dirname, 'app')));

// setting views engine
app.set('views', path.join(__dirname, 'app'));
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');


app.get('/', (req, res) => {
  res.render('index.html');
});

app.get('/restaurant', (req, res) => {
  res.render('restaurant.html');
});


/**********************************
            spdy setup
**********************************/
const spdyOptions = {
  key: fs.readFileSync(path.join(__dirname, '/server.key')),
  cert:  fs.readFileSync(path.join(__dirname, '/server.crt'))
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
