/*global __dirname :true*/

const compression = require('compression');
const path = require('path');

const express = require('express');
const router = express.Router();

// enabling text based responses compression
router.use(compression());

router.use('/assets', express.static(path.join(__dirname, '../app/assets'), {maxAge: '1y'}));

// Set default caching headers
/**
 *
 */
router.use((req, res, next) => {
  res.set('Cache-Control', 'no-cache');
  next();
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