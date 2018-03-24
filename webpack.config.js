/**
 * IMPORTS
 */
const path = require('path');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');

/**
 *  PATHS
 */
const sourceFolder =  path.resolve(__dirname, 'src');
const buildFolder = path.resolve(__dirname, 'dist');
const PATHS = {
    overviewTemplate: path.join(sourceFolder, 'templates/index.html'),
    detailTemplate: path.join(sourceFolder, 'templates/restaurant.html'),
    mainEntry: path.join(sourceFolder, 'index.js'),
};

/**
 *  PLUGIN IMPLEMENTATION
 */
const extractSASS = new ExtractTextPlugin({
    filename: 'styles/main.css',
    allChunks: true
});

const cleanDIst = new CleanWebpackPlugin(['dist'], { watch: false, verbose: true});

/**
 * RULES AND EXPORT
 */
const entries = {
    main: PATHS.mainEntry,
};

module.exports = {
    context: __dirname,
    entry: entries,
    output: {
        path: buildFolder,
        filename: 'js/[name].bundle.js'
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
        extractSASS,
    ]
};
