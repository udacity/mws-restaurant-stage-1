/**
 * IMPORTS
 */
const path = require('path');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

/**
 *  PATHS
 */
const sourceFolder =  path.resolve(__dirname, 'src');
const buildFolder = path.resolve(__dirname, 'dist');
const PATHS = {
    overviewTemplate: path.join(sourceFolder, 'templates/index.html'),
    detailTemplate: path.join(sourceFolder, 'templates/restaurant.html'),
    mainEntry: path.join(sourceFolder, 'index.js'),
    detailsEntry: path.join(sourceFolder, 'restaurant.js'),
    dataSource: path.join(sourceFolder, 'data'),
    imgSource: path.join(sourceFolder, 'img'),
    dataDest: path.join(buildFolder, 'data'),
    imgDest: path.join(buildFolder, 'img'),
};

/**
 *  PLUGIN IMPLEMENTATION
 */
const overviewHtmlWebpackPlugin = new HtmlWebpackPlugin({
    hash: true,
    inject: false,
    title: 'Restaurant Reviews',
    template: PATHS.overviewTemplate,
    chunks: ['main'],
    filename: 'index.html',
    favicon: '',
});

const detailsHtmlWebpackPlugin = new HtmlWebpackPlugin({
    hash: true,
    inject: false,
    title: 'Restaurant Info',
    template: PATHS.detailTemplate,
    chunks: ['details'],
    filename: 'restaurant.html',
    favicon: '',
});

const extractSASS = new ExtractTextPlugin({
    filename: 'styles/main.css',
    allChunks: true
});

const cleanDIst = new CleanWebpackPlugin(['dist'], { watch: false, verbose: true});

const copyWebpackPlugin = new CopyWebpackPlugin(
    [
        { from: PATHS.dataSource, to: PATHS.dataDest },
        { from: PATHS.imgSource, to: PATHS.imgDest }
    ],
    { debug: 'info' }
);

/**
 * RULES AND EXPORT
 */
const entries = {
    main: PATHS.mainEntry,
    details: PATHS.detailsEntry,
};

module.exports = {
    context: __dirname,
    entry: entries,
    output: {
        path: buildFolder,
        filename: 'js/[name].bundle.js'
    },
    watch: true,
    devServer: {
        inline: true,
        port: 8000
    },
    resolve: {
        modules: [
            'node_modules',
            sourceFolder
        ]
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['babel-preset-env'],
                        cacheDirectory: true
                    }
                }
            },
            {
                test: /\.scss$/,
                exclude: /node_modules/,
                use: extractSASS.extract({
                    fallback: 'style-loader',
                    use: [
                        {
                            loader: 'css-loader',
                            options: {url: false, minimize: true, sourceMap: true}
                        },
                        {
                            loader: 'sass-loader',
                            options: {sourceMap: true, minimize: true}
                        }
                    ]
                })
            },
        ]
    },
    plugins: [
        cleanDIst,
        overviewHtmlWebpackPlugin,
        detailsHtmlWebpackPlugin,
        extractSASS,
        copyWebpackPlugin,
    ]
};
