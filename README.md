# Mobile Web Specialist Certification Course
---
#### _Three Stage Course Material Project - Restaurant Reviews_

### Specification

You have been provided the code for a restaurant reviews website. The code has a lot of issues. It’s barely usable on a desktop browser, much less a mobile device. It also doesn’t include any standard accessibility features, and it doesn’t work offline at all. Your job is to update the code to resolve these issues while still maintaining the included functionality. 

### Note about ES6

Most of the code in this project has been written to the ES6 JavaScript specification for compatibility with modern web browsers and future proofing JavaScript code. As much as possible.

## Project : Stage 2

### Application Data Source
	
The client application should pull restaurant data from the development server, parse the JSON response, and use the information to render the appropriate sections of the application UI.

### Offline Use

The client application works offline. JSON responses are cached using the IndexedDB API. Any data previously accessed while connected is reachable while offline.

### How to run and test the App?

1. Clone or Download REST server and nagivate to it (Terminal) : https://github.com/MohamedSayed008/mws-restaurant-stage-2
###### Install project dependancies
```Install project dependancies
# npm i
```
###### Install Sails.js globally
```Install sails global
# npm i sails -g
```
###### Start the server
```Start server
# node server
```
2. Clone or Download the App and nagivate to it (Terminal) : https://github.com/MohamedSayed008/mws-restaurant-stage-1
3. Run `gulp serve`

## Project : Stage 3

On Stage 3 of the MWS ND project we added :

### User Interface
	
Users are able to mark a restaurant as a favorite, this toggle is visible in the application. A form is added to allow users to add their own reviews for a restaurant. Form submission works properly and adds a new review to the database.

### Offline Use
	
The client application works offline. JSON responses are cached using the IndexedDB API. Any data previously accessed while connected is reachable while offline. User is able to add a review to a restaurant while offline and the review is sent to the server when connectivity is re-established.

### Site Performance
	
Lighthouse targets for each category exceed:

Progressive Web App: >90
Performance: >70
Accessibility: >90

### How to run and test the App?

1. Clone or Download REST server and nagivate to it (Terminal) : https://github.com/MohamedSayed008/mws-restaurant-stage-3
###### Install project dependancies
```Install project dependancies
# npm i
```
###### Install Sails.js globally
```Install sails global
# npm i sails -g
```
###### Start the server
```Start server
# node server
```
2. Clone or Download the App and nagivate to it (Terminal) : https://github.com/MohamedSayed008/mws-restaurant-stage-1
3. Run `gulp serve`