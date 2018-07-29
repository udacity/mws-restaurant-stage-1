# Noize's Restaurant Review App

Contents:


* [Project Description](#project-description)
* [Extra Features](#extra-features)
* [Local Usage](#local-usage)
* [Dependencies](#dependencies)



## Project Description
This is 6th project during the Udacity Front-End Web Developer Nanodegree Program.
Students were given a [starter code from Udacity](https://github.com/udacity/mws-restaurant-stage-1) to convert a static webpage to a mobile-ready web application.





##  Extra Features

### Responsive Design:
  - Responsive design for all kind of equipments

### Accessiblity:
  - Accessible images with alternate text
  - Selected access for useful buttons and information
  - ARIA labels, roles inserted 

### Offline mode:
  - Service worker created and initialized for this project.
  - Path to Service Worker: mws-restaurant-stage-1\js\sw.js


## Local usage

  1. Use a simple HTTP server to serve up the site files on your local computer.
  - Navigate to project folder in your terminal.
  - Check the version of Python you have: `python -V`.
  - If you have Python 2.x, spin up the server with `python -m SimpleHTTPServer 5050` 
  - For Python 3.x, you can use `python -m http.server 5050`

  2. With your server running, visit the site: `http://localhost:5050`.

### The file structure

1. In this folder **mws-restaurant-stage-1\js**, located the main.js , the dbhelper.js the restaurant_info.js and the sw.js.

sw.js is the service worker handling file. Tested only with Chrome browser.
If navigator does not support the service worker, the offline mode does not work.
The status of sw log into the consol. In case of error an alert box describe the problem.

2. In **mws-restaurant-stage-1\css** folder a responsive.css file support the different display appearance. The break points 377, 487, 1281 and 1601 pixels.

3. The structure of **data** and **img** folder was not modified.

4. The index.html and restaurant.html locate in root directory. The stucture of these two file was changed to better serve the project and the function of the page.

### Audits

- The code was tested by Audit function of Chrome browser. Qualification around 90%. 
- CSS was validated by: `https://jigsaw.w3.org/css-validator/validator`


### Note about ES6

Most of the code in this project has been written to the ES6 JavaScript specification for compatibility with modern web browsers and future proofing JavaScript code.

## Dependencies

`https://maps.googleapis.com/maps/api` Google Map API.
Used fonts: Arial, Helvetica, sans-serif;


