const merge = require("webpack-merge");
const common = require("./webpack.common.js");

const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");

module.exports = merge(common, {
  mode: "development",
  entry: {
    main: path.resolve(__dirname, "src", "js", "main.js"),
    restaurantInfo: "./src/js/restaurant_info.js"
  },
  devServer: {
    contentBase: "./dist"
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: "./src/index.html",
      chunks: ["main"],
      filename: "index.html"
    }),
    new HtmlWebpackPlugin({
      template: "./src/restaurant.html",
      chunks: ["restaurantInfo"],
      filename: "restaurant.html"
    })
  ],
  module: {
    rules: [
      {
        test: /\.css$/,
        use: [
          { loader: "style-loader" },
          {
            loader: "css-loader",
            options: {
              sourceMap: true
            }
          }
        ]
      },
      {
        test: /\.(jpg|png)$/i,
        loader: "responsive-loader"
      }
    ]
  }
});
