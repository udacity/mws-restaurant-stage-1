const merge = require("webpack-merge");
const common = require("./webpack.common.js");
const { InjectManifest } = require("workbox-webpack-plugin");

const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const ManifestPlugin = require("webpack-manifest-plugin");
const CleanWebpackPlugin = require("clean-webpack-plugin");
const OptimizeCSSAssetsPlugin = require("optimize-css-assets-webpack-plugin");
const ExtractTextPlugin = require("extract-text-webpack-plugin");
const HtmlWebpackInlineSourcePlugin = require("html-webpack-inline-source-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const MiniCSSExtractPlugin = require("mini-css-extract-plugin");
const UglifyJsPlugin = require("uglifyjs-webpack-plugin");

module.exports = merge(common, {
  mode: "production",
  optimization: {
    minimizer: [
      new UglifyJsPlugin({
        cache: true,
        parallel: true,
        sourceMap: true // set to true if you want JS source maps
      }),
      new OptimizeCSSAssetsPlugin({})
    ]
  },
  output: {
    path: path.resolve(__dirname, "dist"),
    publicPath: "/",
    filename: "[name].js"
  },
  plugins: [
    new CleanWebpackPlugin(["dist"]),
    new CopyWebpackPlugin([
      "./src/manifest.json",
      { from: "./src/img/icons/*", to: "./img/icons/", flatten: true }
    ]),
    new HtmlWebpackPlugin({
      chunks: ["main", "main~restaurantInfo"],
      filename: "index.html",
      inlineSource: ".(css)$",
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
      inject: true,
      chunks: ["restaurantInfo", "main~restaurantInfo"],
      filename: "restaurant.html",
      inlineSource: ".(css)$",
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
    new HtmlWebpackInlineSourcePlugin(),
    new ManifestPlugin({
      fileName: "asset-manifest.json"
    }),
    new MiniCSSExtractPlugin({
      filename: "[name].css"
    }),
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
        use: [MiniCSSExtractPlugin.loader, "css-loader"]
      },
      {
        test: /\.(jpg|png)$/i,
        use: [
          {
            loader: "responsive-loader",
            options: {
              // If you want to enable sharp support:
              adapter: require("responsive-loader/sharp"),
              sizes: [300, 600]
            }
          }
        ]
      }
    ]
  }
});
