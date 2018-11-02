const path = require("path")
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
	entry: {
		index: "./src/js/index.js",
		restaurant: "./src/js/restaurant.js"
	},
	output: {
		filename: "[name].bundle.js",
		path: path.join(__dirname, "dist")
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
				exclude: /(node_modules)/,
				use: {
					loader: "babel-loader",
					options: {
						presets: ["env"]
					}
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
			title: 'Restaurant Reviews',
			myPageHeader: 'Restaurant Reviews',
			template: './src/index.html',
			filename: './index.html'
		}),
		new HtmlWebpackPlugin({
			hash: true,
			title: 'Restaurant Reviews - Detail',
			myPageHeader: 'Restaurant Reviews - Detail',
			template: './src/restaurant.html',
			filename: './restaurant.html'
		})
	]
}











