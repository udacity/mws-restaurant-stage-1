const path = require('path');
const express = require('express');
const app = express();

// Redirect to secure traffics
app.all('*', function(req, res, next) {
  console.log('Request details: ', req.secure, req.hostname, req.url, app.get('port'));
  if (!_isLocalhost(req.hostname) && req.protocol === 'http') {
    res.redirect('https://' + req.hostname + ':' + app.get('secPort')+req.url);
  } else {
    return next();
  }
});

app.use(express.static(path.join(__dirname, 'dist')));
app.listen(8008, () => console.log('Example app listening on port 8008!'));

// https://github.com/googlearchive/platinum-https-redirect/blob/master/platinum-https-redirect.html
function _isLocalhost(hostname) {
  // !! coerces the logical expression to evaluate to the values true or false.
  return !!(hostname === 'localhost' ||
            // [::1] is the IPv6 localhost address.
            hostname === '[::1]' ||
            // 127.0.0.1/8 is considered localhost for IPv4.
            hostname.match(/^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/));
}

// if (window.location.protocol === 'http:' && !_isLocalhost(window.location.hostname)) {
//   // Redirect to https: if we're currently using http: and we're not on localhost.
//   window.location.href = 'https:' + window.location.href.substring(window.location.protocol.length);
// }
