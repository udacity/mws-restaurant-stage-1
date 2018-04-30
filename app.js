const express = require('express');
const http = require('http');

const app = express();
let server;

app.use(express.static('./'));

server = http.createServer(app);

server.listen(8000, ()=>{console.log(`listening on http://localhost:8000`)})