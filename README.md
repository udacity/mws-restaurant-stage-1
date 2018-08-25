# MWS Restaurant Reviews

One Paragraph of project description goes here

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes. See deployment for notes on how to deploy the project on a live system.

### Prerequisites

You first need a copy of the code in your local machine, you can do that by running this command:

```
git clone https://github.com/SalahHamza/mws-restaurant-stage-1.git
```

You need to install a graphics engine, preferably GraphicsMagic, you can do that by running this command if you are on MAC:

```
brew install GraphicsMagick
```

Alternatively, you can try:

```
$ sudo add-apt-repository ppa:dhor/myway
$ sudo apt-get update
$ sudo apt-get install graphicsmagick
```

**Note**: If you chose to download another graphics engine (ImageMagick) make sure to change `options.engine` of the responsive images task in `Gruntfile.js`. [Read about that here](https://github.com/andismith/grunt-responsive-images).

### Installing

To get up and running all you need to do is install the development dependencies. You can do that by running:

```
npm install
```

**Note**: Make sure you are inside the project directory.

After that make sure to run Grunt in order to generate the needed assests. You can simply do that by running

```
grunt
```

After that make sure to start up a simple HTTP server. Here are the steps to do so:

1. In this folder, start up a simple HTTP server to serve up the site files on your local computer. Python has some simple tools to do this, and you don't even need to know Python. For most people, it's already installed on your computer.

In a terminal, check the version of Python you have: `python -V`. If you have Python 2.x, spin up the server with `python -m SimpleHTTPServer 8000` (or some other port, if port 8000 is already in use.) For Python 3.x, you can use `python3 -m http.server 8000`. If you don't have Python installed, navigate to Python's [website](https://www.python.org/) to download and install the software.

2. With your server running, visit the site: `http://localhost:8000`, and look around for a bit to see what the current experience looks like.
3. Explore the provided code, and start making a plan to implement the required features in three areas: responsive design, accessibility and offline use.
4. Write code to implement the updates to get this site on its way to being a mobile-ready website.

Alternatively, If you are using chrome you can download [**Web server for chrome**](https://chrome.google.com/webstore/detail/web-server-for-chrome/ofhbbkphhbklhfoeikjpcbhemlocgigb) extension, it's easy to use and works offline.

## Running the tests

No tests available.

## Built With

* [npm](https://npmjs.com) - Dependency Management
* [https://gruntjs.com](Grunt) - Used task runner
* [Graphics Magic](http://sourceforge.net/projects/graphicsmagick/files/graphicsmagick/) - Used to compress/generate images

## Code Owners

* [@forbiddenvoid](https://github.com/udacity/mws-restaurant-stage-1/commits?author=forbiddenvoid)
* @hbkwong

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details

## Acknowledgments

* Hat tip to anyone whose code was used
* Inspiration
* etc
