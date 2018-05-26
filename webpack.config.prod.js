const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const ManifestPlugin = require("webpack-manifest-plugin");

module.exports = {
  mode: "production",
  entry: {
    main: path.resolve(__dirname, "src", "js", "main.js"),
    restaurantInfo: "./src/js/restaurant_info.js"
  },
  plugins: [
    new HtmlWebpackPlugin({
      chunks: ["main"],

      filename: "index.html",
      minify: {
        removeComments: true,
        collapseWhitespace: true,
        removeRedundantAttributes: true,
        useShortDoctype: true,
        removeEmptyAttributes: true,
        removeStyleLinkTypeAttributes: true,
        keepClosingSlash: true,
        minifyJS: true,
        minifyCSS: true,
        minifyURLs: true
      },
      template: "./src/index.html"
    }),
    new HtmlWebpackPlugin({
      chunks: ["restaurantInfo"],
      filename: "restaurant.html",
      minify: {
        removeComments: true,
        collapseWhitespace: true,
        removeRedundantAttributes: true,
        useShortDoctype: true,
        removeEmptyAttributes: true,
        removeStyleLinkTypeAttributes: true,
        keepClosingSlash: true,
        minifyJS: true,
        minifyCSS: true,
        minifyURLs: true
      },
      template: "./src/restaurant.html"
    }),
    new ManifestPlugin({
      fileName: "asset-manifest.json"
    })
  ],
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /(node_modules|bower_components)/,
        use: {
          loader: "babel-loader",
          options: {
            presets: ["@babel/preset-env"]
          }
        }
      },
      {
        test: /\.css$/,
        use: [
          { loader: "style-loader" },
          {
            loader: "css-loader",
            options: {
              sourceMap: false,
              minimize: true
            }
          }
        ]
      },
      {
        test: /\.(png|svg|jpg|gif)$/,
        use: ["file-loader"]
      },
      {
        test: /\.(jpg|png)$/i,
        loader: "responsive-loader",
        options: {
          // If you want to enable sharp support:
          adapter: require("responsive-loader/sharp"),
          sizes: [300, 600, 1200, 2000]
        }
      }
    ]
  }
};
