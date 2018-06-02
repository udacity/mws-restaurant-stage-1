# Mobile Web Specialist Certification Course

---

#### _Three Stage Course Material Project - Restaurant Reviews_

### How to run

1.  Download and run the backend Node server in a separate tab on port 1337
2.  npm install
3.  npm start

This will install and start the production build of the app.

Please note that I'm using Webpack twice, first to bundle my service worker and then to bundle and build my entire app. I do two separate passes because the service worker needs to be built and bundled before being used by Workbox's `InjectManifest` plugin. I did considerable research to see if there was a cleaner solution to using ESM modules in my service worker in conjuction with Workbox and Webpack, and I didn't really find anything.
