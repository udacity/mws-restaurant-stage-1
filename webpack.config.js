const path = require("path")
const webpack = require("webpack");
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin')

module.exports = {
	entry: {
		index: "./src/js/index.js",
		restaurant: "./src/js/restaurant.js"
	},
	output: {
		filename: "[name].bundle.js",
		path: path.resolve(__dirname, "dist")
	},
	devServer: {
		contentBase: path.join(__dirname, "dist"),
		compress: true,
		port: 8080
	},
	module: {
		rules: [
			{
				test: /\.js$/,
				exclude: /(node_modules|bower_components)/,
				use: {
					loader: "babel-loader"
				}
			},
			{
				test: /\.css$/,
				use: [
					{loader: "style-loader"},
					{loader: "css-loader"}
				]
			},
			{
				test: /\.scss$/,
				use: [
					{loader: "style-loader"},
					{loader: "css-loader"},
					{loader: "sass-loader"}
				]
			},
			{
				test: /\.jpg$/,
				use: [
					{loader: "url-loader"}
				]
			},
			{
			  test: /\.png$/,
			  use: [
				  {loader: "url-loader"}
			  ]
			}
		]
	},
	plugins: [
		new HtmlWebpackPlugin({
			hash: true,
			inject: false,
			title: 'Restaurant Reviews',
			myPageHeader: 'Restaurant Reviews',
			template: './src/index.html',
			filename: './index.html'
		}),
		new HtmlWebpackPlugin({
			hash: true,
			inject: false,
			title: 'Restaurant Reviews - Detail',
			myPageHeader: 'Restaurant Reviews',
			template: './src/restaurant.html',
			filename: './restaurant.html'
		}),
        new CopyWebpackPlugin([
            {from:'./src/img',to:'img'},
            {from:'./src/js/sw.js', to:'sw.js', toType:'file'},
            {from:'./src/manifest.json', to:'manifest.json', toType:'file'}
        ])
	]
}











