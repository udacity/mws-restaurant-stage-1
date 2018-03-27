# Mobile Web Specialist Certification Course
---
#### _Three Stage Course Material Project - Restaurant Reviews_

## Project Overview: Stage 1

For the **Restaurant Reviews** projects, you will incrementally convert a static webpage to a mobile-ready web application. In **Stage One**, you will take a static design that lacks accessibility and convert the design to be responsive on different sized displays and accessible for screen reader use. You will also add a service worker to begin the process of creating a seamless offline experience for your users.

### Specification

You have been provided the code for a restaurant reviews website. The code has a lot of issues. It’s barely usable on a desktop browser, much less a mobile device. It also doesn’t include any standard accessibility features, and it doesn’t work offline at all. Your job is to update the code to resolve these issues while still maintaining the included functionality. 

### Getting Started

**Install all dependencies**
```bash
npm install
```

**Create a config.js file on the root path of your project for the Google-Maps Configuration**
```bash
touch config.js
```
Example:
```
export default class Config {
    static get GOOGLE_MAPS_API_KEY() {
        return 'YOUR_GOOGLE_MAP_API_KEY';
    };

    static get DATA_STORE() {
        return 'http://localhost:8000/data/restaurants.json';
    };

    static get GOOGLE_MAPS_OPTIONS() {
        return {
            zoom: 12,
            center: {
                lat: 40.722216,
                lng: -73.987501
            },
            scrollwheel: false,
        };
    }
};
```
**Development Mode**
```bash
./local_server.sh // will start a local python server on port 8000
or
npm run start:dev
```

**Deploy project**
```bash
npm run build:prod
```

### Dependencies
- [normalize.css](http://necolas.github.io/normalize.css/)
- [babel](https://github.com/babel/babel)
- [clean-webpack-plugin](https://github.com/johnagan/clean-webpack-plugin)
- [copy-webpack-plugin](https://github.com/webpack-contrib/copy-webpack-plugin)
- [eslint](https://eslint.org/)
- [extract-text-webpack-plugin](https://github.com/webpack-contrib/extract-text-webpack-plugin)
- [gulp](https://gulpjs.com/)
- [html-minifier](https://www.npmjs.com/package/html-minifier)
- [html-webpack-plugin](https://github.com/jantimon/html-webpack-plugin)
- [node-sass](https://sass-lang.com/)
- [responsive-loader](https://github.com/herrstucki/responsive-loader)
- [webpack](https://webpack.js.org/)