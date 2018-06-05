const path = require("path");

module.exports = {
    entry: {
        main: "./js/main.js",
        info: "./js/restaurant_info.js",
    },
    output: {
        filename: "[name].js",
        path: path.resolve(__dirname, "dist"),
    },
};
