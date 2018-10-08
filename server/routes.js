/*global __dirname :true*/

const compression = require('compression');
const path = require('path');
const fs = require('fs');

const express = require('express');
const router = express.Router();

// enabling text based responses compression
router.use(compression());

/*
 In order to have a good cache policy, maxAge of 1year has been
 given to static assets, but there won't be any conflicts since
 a version will be added to the name of each file.
 for that to happen we need to give all html files a
 Cache-Control: no-cache, so that when we do change the version
 we get the latest html with the right path to files.
 learn more here:
 https://medium.com/pixelpoint/best-practices-for-cache-control-settings-for-your-website-ff262b38c5a2
*/
router.use('/assets', express.static(path.join(__dirname, '../app/assets'), {maxAge: '1y'}));
// Set default caching headers
router.use((req, res, next) => {
  res.set('Cache-Control', 'no-cache');
  next();
});

/*
 streaming service worker
 https://www.youtube.com/watch?v=3Tr-scf7trE&index=99&list=WL&t=1286s
*/
router.get('/sw.js', (req, res) => {
  /*
    since service workers have strict
    mime type checking, we are setting
    content-type header
  */
  res.set('Content-Type', 'application/javascript');
  const readStream = fs.createReadStream(`${__dirname}/../app/sw.js`);
  readStream.pipe(res);
});

router.get('/', (req, res) => {
  res.render('index.html');
});

/**
 * within index.html 'view detail' we are referencing the
 * /restaurant.html?id=*, which will resault in a 404 error
 * that's why the need to implicitly include both routes paths
 */
router.get(['/restaurant', '/restaurant.html'], (req, res) => {
  res.render('restaurant.html');
});


module.exports = router;