const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");

module.exports = {
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
              sourceMap: true
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
          // adapter: require("responsive-loader/sharp"),
          sizes: [300, 600, 1200, 2000]
        }
      }
    ]
  }
};
