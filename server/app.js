const express = require('express');
const app = express();

const bodyParser = require('body-parser');

const port = 5050; // Change server port if needed
const json = require('./data/restaurants.json');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.get('/', (req, res) => {
  res.send('Basic Express server for fetching restaurant Data');
});

app.get('/restaurants', (req, res) => {
  res.send(JSON.stringify(json));
});

app.listen(port, () => console.log(`Server started on ${port}`));
