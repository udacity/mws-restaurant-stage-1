# Mobile Web Specialist Certification Course
---
#### _Three Stage Course Material Project - Restaurant Reviews_

## Project Overview: Stage 1

For the **Restaurant Reviews** projects, you will incrementally convert a static webpage to a mobile-ready web application. In **Stage One**, you will take a static design that lacks accessibility and convert the design to be responsive on different sized displays and accessible for screen reader use. You will also add a service worker to begin the process of creating a seamless offline experience for your users.

## Project : Stage 2 Gulp instructions

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

###### Install project dependancies
```Install project dependancies
# npm i
```



1)  gulp                 -> runs image resize (imagemagick must be installed) and a webserver on the root development folder with live reload
2)  gulp dist            -> builds the project in dist folder with css,js minification and image resize (imagemagick must be installed)
2)  gulp dist-serve      -> builds the project in dist folder with css,js minification and image resize (imagemagick must be installed) and runs a webserver on dist folder
