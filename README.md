# MWS Restaurant Reviews

Restaurant Reviews project is a capstone project in the Mobile Web Specialist program provided by Udacity.

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development.

### Prerequisites

You first need a copy of the code in your local machine, make sure to fork and clone, you can clone by running this command:

```
git clone -b gulp https://github.com/SalahHamza/mws-restaurant-stage-1.git
```

**Note**: as this is not the master branch the command above have the '-b' flag with the specific branch.

### Installing

To get up and running all you need to do is install the development dependencies. You can do that by running:

```
npm install
```

**Note**: Make sure you are inside the project directory.

After that make sure to run Gulp in order to generate the needed assests.

Run the build task to generate files for production

```
gulp build
```

Run the default task to generate files + live editing (with browser-sync):

```
gulp
```

There is a specific production and development task for each kind of asset (not all). Production and development tasks have the same name, production have a trailing `-prod`:

* `gulp styles` & `gulp styles-prod`: for stylesheets.
* `gulp scripts` & `gulp scripts-prod`: for stylesheets.
* `gulp optimize-images`: for images. As the pages need different image for different viewport, images need to be optimized even in development.
* `gulp copy-html`: for html files
* `gulp copy-data`: for .json data file (temporary)
* `gulp dev`: starts up the browser-sync dev server.

After that make sure to start up the server:

I. The easiest way to serve files is through browser-sync, run

```
gulp dev
```

II. The best way is to run the node http/2 server (server.js), you first need to have a SSL cert, but you can just make a self-signed SSL cert. Follow this link to know [how to make a self-signed cert](https://webapplog.com/http2-node/) and other details, or (unfortunately) the http/2 server won't work.

**Note**: Make sure you run the tasks in the root directory.

## Running the tests

No tests available.

## Built With

* [npm](https://npmjs.com) - Dependency Management
* [https://gulpjs.com/](Gulp) - Used task runner
* [https://babeljs.io/](Babel) - Used to compile ES2015 to ES5

## Code Owners

* [@forbiddenvoid](https://github.com/udacity/mws-restaurant-stage-1/commits?author=forbiddenvoid)
* @hbkwong

## License

No license.

## Acknowledgments

* Thanks to ALC and Udacity for giving us the chance to learn new things
* Thanks to instructors and reviewers for being helpful and patient with us