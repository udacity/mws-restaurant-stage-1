# Mobile Web Specialist Certification Course
---
#### _Three Stage Course Material Project - Restaurant Reviews_

## Project Overview: Stage 3

A reviews app where users can browse restaurants by cuisine and neighborhood. The app has offline capabilities. A restaurant can be toggled favorite even when offline and this action is synced when back online. The same goes for reviews. A user can post a review while offline (this is visible only for the user with indexed db) and the review will sync with the server when online.

## Project : Stage 3 Gulp instructions

#### Check for Node and npm
Make sure that you've installed Node and npm before attempting to install gulp.

```sh
node --version
```
```sh
npm --version
```

#### Install the `gulp` command

```sh
npm install --global gulp-cli
```

#### Install `gulp` in your devDependencies

Run this command in your project directory:

```sh
npm install --save-dev gulp@next
```

#### Install ImageMagick
```Install image magick
# https://www.imagemagick.org/script/download.php
```

#### Install project dependancies
```Install project dependancies
# npm i
```

## Development And Distribution

#### Development server

Run the gulp command in your project directory (runs image resize and a webserver on the root development folder with live reload):

```sh
gulp
```

#### Distribution

Run the gulp command in your project directory (builds the project in dist folder with css,js minification and image resize):

```sh
gulp dist
```
## Node http server

#### Install http-server
```Install thhp-server
# npm install http-server -g
```

#### Usage

Run the http-server on dist folder and enable gzip comporession and ssl. More info here https://github.com/indexzero/http-server

```sh
http-server -g -c86400 --ssl
```
