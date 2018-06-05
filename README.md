# Mobile Web Specialist Certification Course
---
#### _Three Stage Course Material Project - Restaurant Reviews_

### Project Overview: Stage 2

| Item | Score |
| --- | ---: |
| _Performance_ | **79**|
| _Progressive Web App_ | **91**|
| _Accessibility_ | **90**|
| _Best Practices_ | **69**|
| _SEO_ | **89**|

Steps to run the project:

1. Run gulp `default` task in order to:
    * __Clean__ the dist folder.
    * __Optimise jpg__ images and convert them to _webp_.
    * __Optimise css__ styles.
    * __Lint__ all javascript files.
    * __Copy js scripts__ into _dist_ folder.
    * __Copy the service__ worker into _dist_.
    * __Minify__ html.
    * copy `manifest.json` file.
2. Run gulp `serve:dist` task

* Gulp's `serve` task will mount an **http** server with unoptimised **ES6** scripts and watch for any change on the _root_ folder.

* Gulp's `serve:dist` task will mount an **https** server and minify and uglify and Babel transpile every javascript file on the **dist** folder and watch for every change on the _dist_ folder. 
