# Mobile Web Specialist Certification Course
---
## _Three Stage Course Material Project - Restaurant Reviews_

### Project Overview

#### Description
A responsive mobile-first offline capable restaurant finder

#### Prerequisite
run gulp's `default` and `serve:dist` tasks

#### Installation
 You will need to have **NodeJs** & [npm](https://nodejs.org/en/) installed in your machine.
 run `npm install` to download all associated dependencies.

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

##### Aditional notes

* Configure a commit message template 

`git config --global commit.template <.git-commit-template.txt file path>`
