const compression = require("compression");
const express = require("express");
const app = express();
app.use(compression());
app.use(express.static("dist"));
app.listen(3000, () => {
  console.log("Listening on port 3000");
});
