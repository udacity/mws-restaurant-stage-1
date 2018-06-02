const path = require("path");

module.exports = {
  entry: {
    main: path.resolve(__dirname, "src", "js", "main.js"),
    restaurantInfo: path.resolve(__dirname, "src", "js", "restaurant_info.js")
  },
  module: {
    rules: [
      {
        test: /\/js\*.js$/,
        exclude: /(node_modules|bower_components)/,
        use: {
          loader: "babel-loader",
          options: {
            presets: ["@babel/preset-env"]
          }
        }
      },
      {
        test: /\.(svg|gif)$/,
        use: ["file-loader"]
      }
    ]
  }
};
