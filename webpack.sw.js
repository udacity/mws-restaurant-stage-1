const path = require("path");
const CleanWebpackPlugin = require("clean-webpack-plugin");

module.exports = {
  mode: "none",
  entry: {
    sw: path.resolve(__dirname, "src", "sw.base.mjs")
  },
  output: {
    path: path.resolve(__dirname, "src", "sw-cache"),
    publicPath: "/",
    filename: "sw.base.js"
  },
  target: "webworker",
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
      }
    ]
  },
  plugins: [
    new CleanWebpackPlugin(path.resolve(__dirname, "src", "sw.base.js"))
  ]
};
