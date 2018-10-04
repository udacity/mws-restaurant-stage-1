const express = require('express');
const app = express();

const bodyParser = require('body-parser');

const port = 5050; // Change server port if needed
const json = require('./data/restaurants.json');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// Added cors functionality
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept',
  );
  next();
});

app.get('/', (req, res) => {
  res.send('Basic Express server for fetching restaurant Data');
});

app.get('/restaurants', (req, res) => {
  res.send(JSON.stringify(json));
});

app.listen(port, () => console.log(`Server started on ${port}`));
