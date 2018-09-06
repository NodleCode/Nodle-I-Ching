const webpack = require('webpack');
const uglify = require('uglifyjs-webpack-plugin');
const { removeEmpty } = require('webpack-config-utils');
const { resolve } = require('path');

/**
 * UMD bundling configs
 */
module.exports = {
    mode: 'production',

    entry: {
        'index.min': './src/index.ts',
    },

    output: {
        path: resolve(__dirname, 'lib', 'umd'),
        libraryTarget: 'umd',
        library: 'iching',
        umdNamedDefine: true
    },

    // `.ts` resolver in order for webpack to look for typescript files
    resolve: {
        extensions: ['.ts'],
    },

    // Add source maps to the bundles for user debugging
    devtool: 'source-map',

    optimization: {
        splitChunks: {
            chunks: 'all'
        }
    },

    plugins: removeEmpty([

        // Enable scope hoisting
        new webpack.optimize.ModuleConcatenationPlugin(),

        // Uglify the production bundle
        new uglify({
            sourceMap: true,
            uglifyOptions: {
                compress: true,
                output: {
                    comments: false
                }
            }
        })
    ]),

    module: {
        rules: [{
            test: /\.ts?$/,
            include: /src/,
            loader: 'awesome-typescript-loader',
        }],
    },
};