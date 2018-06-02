const merge = require("webpack-merge");
const common = require("./webpack.common.js");
const ManifestPlugin = require("webpack-manifest-plugin");
const CleanWebpackPlugin = require("clean-webpack-plugin");
const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const { InjectManifest } = require("workbox-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");

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
    new CleanWebpackPlugin(["dist"]),
    new CopyWebpackPlugin([
      "./src/manifest.json",
      { from: "./src/img/icons/*", to: "./img/icons/", flatten: true }
    ]),
    new HtmlWebpackPlugin({
      template: "./src/index.html",
      inject: true,
      chunks: ["main"],
      filename: "index.html"
    }),
    new HtmlWebpackPlugin({
      template: "./src/restaurant.html",
      inject: true,
      chunks: ["restaurantInfo"],
      filename: "restaurant.html"
    }),
    new ManifestPlugin(),
    new InjectManifest({
      include: [/\.html$/, /\.css$/, /\.js$/],
      swSrc: "./src/sw-cache/sw.base.js",
      swDest: "sw.js",
      importWorkboxFrom: "local"
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
